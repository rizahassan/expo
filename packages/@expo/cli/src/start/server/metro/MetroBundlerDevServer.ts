/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getConfig } from '@expo/config';
import * as runtimeEnv from '@expo/env';
import { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import { RequestHandler, convertRequest, respond } from '@expo/server/build/vendor/http';
import assert from 'assert';
import chalk from 'chalk';
import {
  decodeInput,
  encodeInput,
  generatePrefetchCode,
} from 'expo-router/build/rsc/renderers/utils';
import { AssetData } from 'metro';
import fetch from 'node-fetch';
import path from 'path';

import { createRouteHandlerMiddleware } from './createServerRouteMiddleware';
import { ExpoRouterServerManifestV1, fetchManifest } from './fetchRouterManifest';
import { instantiateMetroAsync } from './instantiateMetro';
import { logMetroError, getErrorOverlayHtmlAsync, logMetroErrorAsync } from './metroErrorInterface';
import { metroWatchTypeScriptFiles } from './metroWatchTypeScriptFiles';
import {
  getRouterDirectoryModuleIdWithManifest,
  hasWarnedAboutApiRoutes,
  isApiRouteConvention,
  warnInvalidWebOutput,
} from './router';
import { serializeHtmlWithAssets } from './serializeHtml';
import { observeAnyFileChanges, observeFileChanges } from './waitForMetroToObserveTypeScriptFile';
import { ExportAssetMap } from '../../../export/saveAssets';
import { Log } from '../../../log';
import getDevClientProperties from '../../../utils/analytics/getDevClientProperties';
import { logEventAsync } from '../../../utils/analytics/rudderstackClient';
import { stripAnsi } from '../../../utils/ansi';
import { CommandError } from '../../../utils/errors';
import { getFreePortAsync } from '../../../utils/port';
import { BundlerDevServer, BundlerStartOptions, DevServerInstance } from '../BundlerDevServer';
import {
  evalMetro,
  getStaticRenderFunctionsForEntry,
  metroFetchAsync,
  evalMetroNoHandling,
  requireFileContentsWithMetro,
  MetroNodeError,
} from '../getStaticRenderFunctions';
import { ContextModuleSourceMapsMiddleware } from '../middleware/ContextModuleSourceMapsMiddleware';
import { CreateFileMiddleware } from '../middleware/CreateFileMiddleware';
import { DevToolsPluginMiddleware } from '../middleware/DevToolsPluginMiddleware';
import { FaviconMiddleware } from '../middleware/FaviconMiddleware';
import { HistoryFallbackMiddleware } from '../middleware/HistoryFallbackMiddleware';
import { InterstitialPageMiddleware } from '../middleware/InterstitialPageMiddleware';
import { getMetroServerRoot, resolveMainModuleName } from '../middleware/ManifestMiddleware';
import { ReactDevToolsPageMiddleware } from '../middleware/ReactDevToolsPageMiddleware';
import {
  DeepLinkHandler,
  RuntimeRedirectMiddleware,
} from '../middleware/RuntimeRedirectMiddleware';
import { ServeStaticMiddleware } from '../middleware/ServeStaticMiddleware';
import {
  ExpoMetroOptions,
  createBundleUrlPath,
  getAsyncRoutesFromExpoConfig,
  getMetroDirectBundleOptions,
  getRscPathFromExpoConfig,
  getBaseUrlFromExpoConfig,
  shouldEnableAsyncImports,
  createBundleUrlSearchParams,
} from '../middleware/metroOptions';
import { prependMiddleware } from '../middleware/mutations';
import { ServerNext, ServerRequest, ServerResponse } from '../middleware/server.types';
import { startTypescriptTypeGenerationAsync } from '../type-generation/startTypescriptTypeGeneration';

import { HMRClient } from './ssrHmrClient';
import { PathSpec } from 'expo-router/build/rsc/path';
import { EntriesPrd } from 'expo-router/build/rsc/server';
import { streamToStringAsync } from '../../../utils/stream';
export type ExpoRouterRuntimeManifest = Awaited<
  ReturnType<typeof import('expo-router/build/static/renderStaticContent').getManifest>
>;

export class ForwardHtmlError extends CommandError {
  constructor(
    message: string,
    public html: string,
    public statusCode: number
  ) {
    super(message);
  }
}

const debug = require('debug')('expo:start:server:metro') as typeof console.log;

/** Default port to use for apps running in Expo Go. */
const EXPO_GO_METRO_PORT = 8081;

/** Default port to use for apps that run in standard React Native projects or Expo Dev Clients. */
const DEV_CLIENT_METRO_PORT = 8081;

export class MetroBundlerDevServer extends BundlerDevServer {
  private metro: import('metro').Server | null = null;

  get name(): string {
    return 'metro';
  }

  async resolvePortAsync(options: Partial<BundlerStartOptions> = {}): Promise<number> {
    const port =
      // If the manually defined port is busy then an error should be thrown...
      options.port ??
      // Otherwise use the default port based on the runtime target.
      (options.devClient
        ? // Don't check if the port is busy if we're using the dev client since most clients are hardcoded to 8081.
          Number(process.env.RCT_METRO_PORT) || DEV_CLIENT_METRO_PORT
        : // Otherwise (running in Expo Go) use a free port that falls back on the classic 8081 port.
          await getFreePortAsync(EXPO_GO_METRO_PORT));

    return port;
  }

  async exportExpoRouterApiRoutesAsync({
    outputDir,
    prerenderManifest,
  }: {
    outputDir: string;
    // This does not contain the API routes info.
    prerenderManifest: ExpoRouterServerManifestV1;
  }): Promise<{ files: ExportAssetMap; manifest: ExpoRouterServerManifestV1<string> }> {
    const { routerRoot } = this.instanceMetroOptions;
    assert(
      routerRoot != null,
      'The server must be started before calling exportExpoRouterApiRoutesAsync.'
    );

    const appDir = path.join(this.projectRoot, routerRoot);
    const manifest = await this.getExpoRouterRoutesManifestAsync({ appDir });

    const files: ExportAssetMap = new Map();

    for (const route of manifest.apiRoutes) {
      const filepath = path.join(appDir, route.file);
      const contents = await this.bundleApiRoute(filepath);
      const artifactFilename = path.join(
        outputDir,
        path.relative(appDir, filepath.replace(/\.[tj]sx?$/, '.js'))
      );
      if (contents) {
        files.set(artifactFilename, {
          contents: contents.src,
          targetDomain: 'server',
        });
      }
      // Remap the manifest files to represent the output files.
      route.file = artifactFilename;
    }

    return {
      manifest: {
        ...manifest,
        htmlRoutes: prerenderManifest.htmlRoutes,
      },
      files,
    };
  }

  async getExpoRouterRoutesManifestAsync({ appDir }: { appDir: string }) {
    // getBuiltTimeServerManifest
    const manifest = await fetchManifest(this.projectRoot, {
      asJson: true,
      appDir,
    });

    if (!manifest) {
      throw new CommandError(
        'EXPO_ROUTER_SERVER_MANIFEST',
        'Unexpected error: server manifest could not be fetched.'
      );
    }

    return manifest;
  }

  async getStaticRenderFunctionAsync(): Promise<{
    serverManifest: ExpoRouterServerManifestV1;
    manifest: ExpoRouterRuntimeManifest;
    renderAsync: (path: string) => Promise<string>;
  }> {
    const { mode, minify, isExporting } = this.instanceMetroOptions;
    assert(
      mode != null && minify != null && isExporting != null,
      'The server must be started before calling ssrLoadModule.'
    );

    const url = this.getDevServerUrlOrAssert();

    const { getStaticContent, getManifest, getBuildTimeServerManifestAsync } =
      await this.ssrLoadModule<typeof import('expo-router/build/static/renderStaticContent')>(
        'expo-router/node/render.js',
        {
          minify,
          // mode: 'production',
          isExporting,
        }
      );

    return {
      serverManifest: await getBuildTimeServerManifestAsync(),
      // Get routes from Expo Router.
      manifest: await getManifest({ preserveApiRoutes: false }),
      // Get route generating function
      async renderAsync(path: string) {
        return await getStaticContent(new URL(path, url));
      },
    };
  }

  async getStaticResourcesAsync({
    includeSourceMaps,
    mainModuleName,
    clientBoundaries = this.instanceMetroOptions.clientBoundaries ?? [],
    platform = 'web',
  }: {
    includeSourceMaps?: boolean;
    mainModuleName?: string;
    clientBoundaries?: string[];
    platform?: string;
  } = {}): Promise<{ artifacts: SerialAsset[]; assets?: AssetData[] }> {
    const { mode, minify, rscPath, isExporting, baseUrl, routerRoot, asyncRoutes } =
      this.instanceMetroOptions;
    assert(
      mode != null &&
        minify != null &&
        isExporting != null &&
        baseUrl != null &&
        routerRoot != null &&
        asyncRoutes != null,
      'The server must be started before calling getStaticPageAsync.'
    );

    const devBundleUrlPathname = createBundleUrlPath({
      platform,
      mode,
      minify,
      environment: 'client',
      serializerOutput: 'static',
      serializerIncludeMaps: includeSourceMaps,
      mainModuleName: mainModuleName ?? resolveMainModuleName(this.projectRoot, { platform }),
      lazy: shouldEnableAsyncImports(this.projectRoot),
      asyncRoutes,
      baseUrl,
      rscPath,
      isExporting,
      routerRoot,
      clientBoundaries,
      bytecode: false,
    });
    // console.log('devBundleUrlPathname:', devBundleUrlPathname, clientBoundaries);

    const bundleUrl = new URL(devBundleUrlPathname, this.getDevServerUrlOrAssert());

    // Fetch the generated HTML from our custom Metro serializer
    const results = await fetch(bundleUrl.toString());

    const txt = await results.text();

    let data: any;
    try {
      data = JSON.parse(txt);
    } catch (error: any) {
      debug(txt);

      // Metro can throw this error when the initial module id cannot be resolved.
      if (!results.ok && txt.startsWith('<!DOCTYPE html>')) {
        throw new ForwardHtmlError(
          `Metro failed to bundle the project. Check the console for more information.`,
          txt,
          results.status
        );
      }

      Log.error(
        'Failed to generate resources with Metro, the Metro config may not be using the correct serializer. Ensure the metro.config.js is extending the expo/metro-config and is not overriding the serializer.'
      );
      throw error;
    }

    // NOTE: This could potentially need more validation in the future.
    if ('artifacts' in data && Array.isArray(data.artifacts)) {
      return data;
    }

    if (data != null && (data.errors || data.type?.match(/.*Error$/))) {
      // {
      //   type: 'InternalError',
      //   errors: [],
      //   message: 'Metro has encountered an error: While trying to resolve module `stylis` from file `/Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/@emotion/cache/dist/emotion-cache.browser.esm.js`, the package `/Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/package.json` was successfully found. However, this package itself specifies a `main` module field that could not be resolved (`/Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/dist/stylis.mjs`. Indeed, none of these files exist:\n' +
      //     '\n' +
      //     '  * /Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/dist/stylis.mjs(.web.ts|.ts|.web.tsx|.tsx|.web.js|.js|.web.jsx|.jsx|.web.json|.json|.web.cjs|.cjs|.web.scss|.scss|.web.sass|.sass|.web.css|.css)\n' +
      //     '  * /Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/dist/stylis.mjs/index(.web.ts|.ts|.web.tsx|.tsx|.web.js|.js|.web.jsx|.jsx|.web.json|.json|.web.cjs|.cjs|.web.scss|.scss|.web.sass|.sass|.web.css|.css): /Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/metro/src/node-haste/DependencyGraph.js (289:17)\n' +
      //     '\n' +
      //     '\x1B[0m \x1B[90m 287 |\x1B[39m         }\x1B[0m\n' +
      //     '\x1B[0m \x1B[90m 288 |\x1B[39m         \x1B[36mif\x1B[39m (error \x1B[36minstanceof\x1B[39m \x1B[33mInvalidPackageError\x1B[39m) {\x1B[0m\n' +
      //     '\x1B[0m\x1B[31m\x1B[1m>\x1B[22m\x1B[39m\x1B[90m 289 |\x1B[39m           \x1B[36mthrow\x1B[39m \x1B[36mnew\x1B[39m \x1B[33mPackageResolutionError\x1B[39m({\x1B[0m\n' +
      //     '\x1B[0m \x1B[90m     |\x1B[39m                 \x1B[31m\x1B[1m^\x1B[22m\x1B[39m\x1B[0m\n' +
      //     '\x1B[0m \x1B[90m 290 |\x1B[39m             packageError\x1B[33m:\x1B[39m error\x1B[33m,\x1B[39m\x1B[0m\n' +
      //     '\x1B[0m \x1B[90m 291 |\x1B[39m             originModulePath\x1B[33m:\x1B[39m \x1B[36mfrom\x1B[39m\x1B[33m,\x1B[39m\x1B[0m\n' +
      //     '\x1B[0m \x1B[90m 292 |\x1B[39m             targetModuleName\x1B[33m:\x1B[39m to\x1B[33m,\x1B[39m\x1B[0m'
      // }
      // The Metro logger already showed this error.
      throw new Error(data.message);
    }

    throw new Error(
      'Invalid resources returned from the Metro serializer. Expected array, found: ' + data
    );
  }

  private async getStaticPageAsync(pathname: string) {
    const {
      mode,
      minify,
      isExporting,
      rscPath,
      clientBoundaries,
      baseUrl,
      routerRoot,
      asyncRoutes,
    } = this.instanceMetroOptions;
    assert(
      mode != null &&
        minify != null &&
        isExporting != null &&
        baseUrl != null &&
        routerRoot != null &&
        asyncRoutes != null,
      'The server must be started before calling getStaticPageAsync.'
    );
    const platform = 'web';

    const devBundleUrlPathname = createBundleUrlPath({
      platform,
      mode,
      environment: 'client',
      mainModuleName: resolveMainModuleName(this.projectRoot, { platform }),
      lazy: shouldEnableAsyncImports(this.projectRoot),
      baseUrl,
      rscPath,
      isExporting,
      asyncRoutes,
      routerRoot,
      clientBoundaries,

      // ignoredModules: isExporting
      //   ? []
      //   : [
      //       '@expo/server',
      //       'source-map-support',
      //       '@remix-run/node',
      //       'react-native',
      //       'react-native-web',
      //     ],
      bytecode: false,
    });

    const bundleStaticHtml = async (): Promise<string> => {
      const { getStaticContent } = await this.ssrLoadModule<
        typeof import('expo-router/build/static/renderStaticContent')
      >('expo-router/node/render.js', {
        minify: false,
        // mode: 'production',
        isExporting,
        platform,
      });

      const location = new URL(pathname, this.getDevServerUrlOrAssert());
      return await getStaticContent(location);
    };

    const [{ artifacts: resources }, staticHtml] = await Promise.all([
      this.getStaticResourcesAsync({
        // TODO(Bacon-RSC): Check this
        clientBoundaries: [],
      }),
      bundleStaticHtml(),
    ]);
    const content = serializeHtmlWithAssets({
      isExporting,
      resources,
      template: staticHtml,
      devBundleUrl: devBundleUrlPathname,
      baseUrl,
    });
    return {
      content,
      resources,
    };
  }

  // Set when the server is started.
  private instanceMetroOptions: Partial<ExpoMetroOptions> = {};

  async ssrLoadModule<T extends Record<string, any>>(
    filePath: string,
    specificOptions: Partial<ExpoMetroOptions> = {}
  ): Promise<T> {
    return await (
      await this.ssrLoadModuleAndHmrEntry<T>(filePath, specificOptions)
    ).fn;
  }

  async ssrLoadModuleAndHmrEntry<T extends Record<string, any>>(
    filePath: string,
    specificOptions: Partial<ExpoMetroOptions> = {}
  ): Promise<{ fn: T; filename: string }> {
    const { baseUrl, routerRoot, isExporting } = this.instanceMetroOptions;
    assert(
      baseUrl != null && routerRoot != null && isExporting != null,
      'The server must be started before calling ssrLoadModule.'
    );

    console.log('Load module:', this.projectRoot, this.getDevServerUrlOrAssert(), filePath);

    return await getStaticRenderFunctionsForEntry<T>(
      this.projectRoot,
      this.getDevServerUrlOrAssert(),
      {
        // Bundle in Node.js mode for SSR.
        environment: 'node',
        platform: 'web',
        mode: 'development',
        bytecode: false,

        ...this.instanceMetroOptions,
        baseUrl,
        routerRoot,
        isExporting,
        ...specificOptions,
      },
      filePath
    );
  }

  async ssrLoadModuleContents(
    filePath: string,
    specificOptions: Partial<ExpoMetroOptions> = {}
  ): Promise<{ src: string; filename: string }> {
    const { baseUrl, routerRoot, isExporting } = this.instanceMetroOptions;
    assert(
      baseUrl != null && routerRoot != null && isExporting != null,
      'The server must be started before calling ssrLoadModule.'
    );

    return await requireFileContentsWithMetro(
      this.projectRoot,
      this.getDevServerUrlOrAssert(),
      filePath,
      {
        // Bundle in Node.js mode for SSR.
        environment: 'node',
        platform: 'web',
        mode: 'development',
        bytecode: false,

        ...this.instanceMetroOptions,
        baseUrl,
        routerRoot,
        isExporting,
        ...specificOptions,
      }
    );
  }

  getMetroInstance() {
    return this.metro;
  }

  async watchEnvironmentVariables() {
    if (!this.instance) {
      throw new Error(
        'Cannot observe environment variable changes without a running Metro instance.'
      );
    }
    if (!this.metro) {
      // This can happen when the run command is used and the server is already running in another
      // process.
      debug('Skipping Environment Variable observation because Metro is not running (headless).');
      return;
    }

    const envFiles = runtimeEnv
      .getFiles(process.env.NODE_ENV)
      .map((fileName) => path.join(this.projectRoot, fileName));

    observeFileChanges(
      {
        metro: this.metro,
        server: this.instance.server,
      },
      envFiles,
      () => {
        debug('Reloading environment variables...');
        // Force reload the environment variables.
        runtimeEnv.load(this.projectRoot, { force: true });
      }
    );
  }

  /** RSC Client boundaries */
  private clientModuleMap = new Map<string, Map<string, Set<string>>>();

  public getClientModules(platform: string, input: string) {
    const key = (
      require('expo-router/build/matchers') as typeof import('expo-router/build/matchers')
    ).getNameFromFilePath(input);

    // console.log('getClientModules:', input, key, this.clientModuleMap.keys(), this.clientModuleMap);

    const platformSet = this.clientModuleMap.get(platform);
    if (!platformSet) {
      throw new CommandError(
        `No client modules found for platform "${platform}". Expected one of: ${Array.from(
          this.clientModuleMap.keys()
        ).join(', ')}`
      );
    }

    if (!platformSet.has(key)) {
      throw new CommandError(
        `No client modules found for "${key}". Expected one of: ${Array.from(
          platformSet.keys()
        ).join(', ')}`
      );
    }
    const idSet = platformSet.get(key);
    return Array.from(idSet || []);
  }

  public async bundleMultiEntryGraph(entries: readonly string[], options: ExpoMetroOptions) {
    const directOptions = getMetroDirectBundleOptions(options);

    // const { customResolverOptions, ...defaultTransformInputOptions } = Server.DEFAULT_GRAPH_OPTIONS;

    const multiGraph = await this.metro!.getBundler().buildGraphForEntries(
      entries,
      {
        // ...defaultTransformInputOptions,
        hot: false,

        unstable_transformProfile: directOptions.unstable_transformProfile!,
        customTransformOptions: directOptions.customTransformOptions,
        dev: directOptions.dev!,
        minify: directOptions.minify!,
        platform: directOptions.platform,
        type: 'module',
      },
      { customResolverOptions: directOptions.customResolverOptions },
      {
        onProgress(numProcessed, total) {
          console.log(`Processed ${numProcessed} of ${total} modules...`);
        },
        shallow: false,
        // TODO: progress bar support.
        // onProgress
      }
    );
    // TODO: Run graph through multi-entry serializer for splitting.

    console.log('multiGraph:', multiGraph);

    // TODO
    return '';
  }

  getExpoLineOptions() {
    return this.instanceMetroOptions;
  }

  private async getExpoRouterRscEntriesGetterAsync({ platform }: { platform: string }) {
    // NOTE: In waku, this would be user-defined via entries.js
    const getRscEntries = await this.ssrLoadModule<
      typeof import('expo-router/build/rsc/router/expo-definedRouter')
    >('expo-router/build/rsc/router/expo-definedRouter.js', {
      environment: 'react-server',
      platform,
    });

    return getRscEntries;
  }

  private getResolveClientEntry(context: { platform: string; engine?: 'hermes' }) {
    // TODO: Memoize this
    const serverRoot = getMetroServerRoot(this.projectRoot);

    // NOTE: MUST MATCH THE IMPL IN ExpoMetroConfig.ts
    function stringToHash(str: string): number {
      let hash = 0;
      if (str.length === 0) return hash;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
      }
      return Math.abs(hash);
    }

    const fileURLToFilePath = (fileURL: string) => {
      if (!fileURL.startsWith('file://')) {
        throw new Error('Not a file URL');
      }
      return decodeURI(fileURL.slice('file://'.length));
    };

    const {
      mode,
      minify,
      rscPath,
      isExporting,
      baseUrl,
      routerRoot,
      asyncRoutes,
      preserveEnvVars,
      lazy,
    } = this.instanceMetroOptions;

    assert(
      isExporting != null &&
        baseUrl != null &&
        mode != null &&
        routerRoot != null &&
        minify != null &&
        asyncRoutes != null,
      'The server must be started.'
    );

    return (
      file: string // filePath or fileURL
    ) => {
      const searchParams = createBundleUrlSearchParams({
        mainModuleName: '',
        platform: context.platform,
        mode,
        minify,
        // environment: 'client',
        // serializerOutput,
        // serializerIncludeMaps,
        lazy,
        preserveEnvVars,
        asyncRoutes,
        baseUrl,
        rscPath,
        routerRoot,
        isExporting,

        // An optimization to extern common chunks that appear in the client bundle. This is only needed for development and does nothing in production.
        isClientBoundary: true,

        // TODO:
        engine: context.engine,
        bytecode: false,
        clientBoundaries: [],
        inlineSourceMap: false,
      });

      const clientReferenceUrl = new URL(this.getDevServerUrlOrAssert());
      searchParams.set('modulesOnly', 'true');
      searchParams.set('runModule', 'false');

      clientReferenceUrl.search = searchParams.toString();

      if (!isExporting) {
        // TODO: Maybe add a new param to execute and return the module exports.

        const filePath = file.startsWith('file://') ? fileURLToFilePath(file) : file;
        const metroOpaqueId = stringToHash(filePath);
        const relativeFilePath = path.relative(serverRoot, filePath);
        // TODO: May need to remove the original extension.
        clientReferenceUrl.pathname = relativeFilePath + '.bundle';
        // Pass the Metro runtime ID back in the hash so we can emulate Webpack requiring.
        clientReferenceUrl.hash = String(metroOpaqueId);

        // Return relative URLs to help Android fetch from wherever it was loaded from since it doesn't support localhost.
        const id =
          clientReferenceUrl.pathname + clientReferenceUrl.search + clientReferenceUrl.hash;
        return { id, url: id };
      } else {
        // if (!file.startsWith('@id/')) {
        //   throw new Error('Unexpected client entry in PRD: ' + file);
        // }
        // url.pathname = file.slice('@id/'.length);

        // TODO: This should be different for prod
        const filePath = file.startsWith('file://') ? fileURLToFilePath(file) : file;
        const metroOpaqueId = stringToHash(filePath);
        const relativeFilePath = path.relative(serverRoot, filePath);
        // TODO: May need to remove the original extension.
        clientReferenceUrl.pathname = relativeFilePath;
        // Pass the Metro runtime ID back in the hash so we can emulate Webpack requiring.
        clientReferenceUrl.hash = String(metroOpaqueId);

        // Return relative URLs to help Android fetch from wherever it was loaded from since it doesn't support localhost.
        const id = '/' + clientReferenceUrl.hash;
        return {
          id,
          url: clientReferenceUrl.pathname,
        };
      }
    };
  }

  private setupHmr(url: URL) {
    const onReload = () => {
      // Send reload command to client from Fast Refresh code.
      debug('[CLI]: Reload RSC');

      this.broadcastMessage('sendDevCommand', {
        name: 'rsc-reload',
        // TODO: Target only certain platforms
        // platform,
      });
    };

    if (HMRClient.isSetup()) {
      // console.log('[CLI]: register extra bundle URL:', url.toString());
      // TODO: Do we need to dedupe URLs?
      HMRClient.registerBundle(url.toString());
    } else {
      HMRClient.setup({
        isEnabled: true,
        url,
        onReload,
        // onFullReload: () => {
        //   this.broadcastMessage('reload');
        // },
        onError(error) {
          // console.log('[CLI]:', 'onError', error);
          // Do nothing and reload.
          // TODO: If we handle this better it could result in faster error feedback.
          onReload();
        },
      });
    }
  }

  async getRscBuildConfigAsync({
    platform,
    engine,
    publicIndexHtml,
  }: {
    platform: string;
    engine?: 'hermes';
    publicIndexHtml: string;
  }) {
    const { baseUrl, mode, routerRoot, isExporting } = this.instanceMetroOptions;
    assert(
      baseUrl != null && mode != null && routerRoot != null && isExporting != null,
      'The server must be started before calling ssrLoadModule.'
    );
    // if (method === 'POST') {
    //   assert(req, 'Server request must be provided when method is POST (server actions)');
    // }

    // TODO: Extract CSS Modules / Assets from the bundler process
    const {
      fn: {
        getBuildConfig,
        // setupHmr,
        // renderRouteWithContextKey, getRouteNodeForPathname
      },
    } = await this.ssrLoadModuleAndHmrEntry<
      //   typeof import('expo-router/build/static/rsc-renderer')
      // >('expo-router/node/rsc.js', {
      typeof import('expo-router/src/static/rsc-renderer')
    >('expo-router/src/static/rsc-renderer.ts', {
      environment: 'react-server',
      platform,
    });

    const router = await this.getExpoRouterRscEntriesGetterAsync({ platform });

    // TODO: Add support for dynamic HTML paths
    const dynamicHtmlPathMap = new Map<PathSpec, string>();
    const dynamicHtmlPaths = Array.from(dynamicHtmlPathMap);

    const buildConfig = await getBuildConfig({
      config: {},
      resolveClientEntry: this.getResolveClientEntry({ platform, engine }),
      entries: {
        ...router,
        loadModule(url: string) {
          throw new Error('TODO: Add support for Server Actions in production');
        },
        dynamicHtmlPaths,
        publicIndexHtml,
      },
    });

    console.log('buildConfig', [...buildConfig][0]);

    return buildConfig;
  }

  async emitRscFiles(
    // rootDir: string,
    // config: { distDir: string; rscPath: string },
    // distEntries: EntriesPrd,
    buildConfig: Awaited<
      ReturnType<typeof import('expo-router/src/static/rsc-renderer').getBuildConfig>
    >,
    {
      engine,
      platform,
    }: {
      engine?: 'hermes';
      platform: string;
    },
    files: ExportAssetMap
  ) {
    // const clientModuleMap = new Map<string, Set<string>>();

    const getClientModules = (input: string) => {
      const clientEntries = this.getClientModules(platform, input);

      if (!clientEntries) {
        // Could be a key mismatch
        Log.warn('-----');
        Log.warn(' NO CLIENT ENTRIES !! TECHNICALLY NOT A BUG');
        Log.warn('-----');
      }

      console.log('clientEntries', clientEntries, input);
      // TODO: Improve this
      const serverRoot = getMetroServerRoot(this.projectRoot);
      const entryFiles = clientEntries.map((entry) => {
        return path.join(serverRoot, entry.replace(/#.+$/, ''));
      });

      return entryFiles;
      // return this.getClientModules('web', input);
    };

    const staticInputSet = new Set<string>();
    const clientModules = new Set<string>();
    await Promise.all(
      Array.from(buildConfig).map(async ({ entries, context }) => {
        for (const { input, isStatic } of entries || []) {
          console.log('[export] emit rsc>', { input, isStatic });
          if (!isStatic) {
            continue;
          }
          if (staticInputSet.has(input)) {
            continue;
          }
          staticInputSet.add(input);
          const destRscFile = path.join(
            // rootDir,
            // config.distDir,
            // config.publicDir,
            this.getExpoLineOptions().rscPath!.replace(/^\/+/, ''),
            encodeInput(input)
          );

          const pipe = await this.renderRscToReadableStream({
            route: input,
            method: 'GET',
            engine,
            platform,
            searchParams: new URLSearchParams(),
          });

          const rsc = await streamToStringAsync(pipe);

          console.log('route.rsc', rsc);

          files.set(destRscFile, {
            contents: rsc,
            targetDomain: 'client',
            rscId: input,
          });

          const clientBoundaries = getClientModules(input);
          for (const clientBoundary of clientBoundaries) {
            clientModules.add(clientBoundary);
          }

          // // await mkdir(joinPath(destRscFile, '..'), { recursive: true });
          // const readable = await this.renderRscToReadableStream(
          //   {
          //     input,
          //     searchParams: new URLSearchParams(),
          //     method: 'GET',
          //     config,
          //     context,
          //     moduleIdCallback: (id) => addClientModule(input, id),
          //   },
          //   {
          //     isDev: false,
          //     entries: distEntries,
          //   },
          // );
          // await pipeline(
          //   Readable.fromWeb(readable as any),
          //   createWriteStream(destRscFile),
          // );
        }
      })
    );
    return { getClientModules, clientModules: Array.from(clientModules) };
  }

  async emitHtmlFiles(
    config: { basePath: string; rscPath: string; indexHtml: string },
    distEntriesFile: string,
    distEntries: EntriesPrd,
    buildConfig: Awaited<
      ReturnType<typeof import('expo-router/src/static/rsc-renderer').getBuildConfig>
    >,
    getClientModules: (input: string) => string[],
    ssr: boolean,
    {
      publicIndexHtml,
    }: {
      publicIndexHtml: string;
    },
    files: ExportAssetMap
  ) {
    const basePrefix = config.basePath + config.rscPath + '/';
    // const publicIndexHtmlFile = joinPath(
    //   rootDir,
    //   config.distDir,
    //   config.publicDir,
    //   config.indexHtml,
    // );
    // const publicIndexHtml = await readFile(publicIndexHtmlFile, {
    //   encoding: 'utf8',
    // });
    // if (ssr) {
    //   await unlink(publicIndexHtmlFile);
    // }
    const publicIndexHtmlHead = publicIndexHtml.replace(/.*?<head>(.*?)<\/head>.*/s, '$1');
    const dynamicHtmlPathMap = new Map<PathSpec, string>();
    await Promise.all(
      Array.from(buildConfig).map(async ({ pathname, isStatic, entries, customCode, context }) => {
        const pathSpec = typeof pathname === 'string' ? pathname2pathSpec(pathname) : pathname;
        let htmlStr = publicIndexHtml;
        let htmlHead = publicIndexHtmlHead;
        const inputsForPrefetch = new Set<string>();
        const moduleIdsForPrefetch = new Set<string>();
        for (const { input, skipPrefetch } of entries || []) {
          if (!skipPrefetch) {
            inputsForPrefetch.add(input);
            for (const id of getClientModules(input)) {
              moduleIdsForPrefetch.add(id);
            }
          }
        }
        const code =
          generatePrefetchCode(basePrefix, inputsForPrefetch, moduleIdsForPrefetch) +
          (customCode || '');
        if (code) {
          // HACK is this too naive to inject script code?
          htmlStr = htmlStr.replace(
            /<\/head>/,
            `<script type="module" async>${code}</script></head>`
          );
          htmlHead += `<script type="module" async>${code}</script>`;
        }
        if (!isStatic) {
          dynamicHtmlPathMap.set(pathSpec, htmlHead);
          return;
        }
        pathname = pathSpec2pathname(pathSpec);
        const destHtmlFile = path.join(
          // rootDir,
          // config.distDir,
          // config.publicDir,
          path.extname(pathname)
            ? pathname
            : pathname === '/404'
              ? '404.html' // HACK special treatment for 404, better way?
              : pathname + '/' + config.indexHtml
        );
        // const htmlReadable = null;

        // TODO: Extract CSS Modules / Assets from the bundler process
        const { renderHtml } = await this.ssrLoadModule<
          //   typeof import('expo-router/build/static/rsc-renderer')
          // >('expo-router/node/rsc.js', {
          typeof import('expo-router/src/static/html-renderer')
        >('expo-router/src/static/html-renderer.ts', {
          environment: 'react-server',
          platform: 'web',
        });
        const { getSsrConfig } = await this.ssrLoadModule<
          //   typeof import('expo-router/build/static/rsc-renderer')
          // >('expo-router/node/rsc.js', {
          typeof import('expo-router/src/static/rsc-renderer')
        >('expo-router/src/static/rsc-renderer.ts', {
          environment: 'react-server',
          platform: 'web',
        });

        const htmlReadable =
          ssr &&
          (await renderHtml({
            config,
            pathname,
            searchParams: new URLSearchParams(),
            htmlHead,
            loadClientModule: async (id) => {
              const CLIENT_MODULE_MAP: Record<string, string> = {
                react: 'react',
                'rd-server': 'react-dom/server.edge',
                'rsdw-client': 'react-server-dom-webpack/client.edge',
                'waku-client': 'waku/client',
              };

              return await this.ssrLoadModule(CLIENT_MODULE_MAP[id], {
                environment: 'react-server',
                platform: 'web',
              });
            },
            renderRscForHtml: (input, searchParams) => {
              return this.renderRscToReadableStream({
                searchParams,
                engine: 'hermes',
                method: 'GET',
                platform: 'web',
                route: input,
                entries: distEntries,
              });
              // return renderRsc(
              //   {
              //     config,
              //     input,
              //     searchParams,
              //     method: 'GET',
              //     context,
              //   },
              //   {
              //     isDev: false,
              //     entries: distEntries,
              //   }
              // );
            },
            getSsrConfigForHtml: (pathname, searchParams) =>
              getSsrConfig(
                {
                  config,
                  pathname,
                  searchParams,
                },
                {
                  isDev: false,
                  entries: distEntries,
                }
              ),
            // loadClientModule: (key) => distEntries.loadModule(CLIENT_PREFIX + key),
            isDev: false,
            loadModule: distEntries.loadModule,
          }));
        // await mkdir(joinPath(destHtmlFile, '..'), { recursive: true });
        if (htmlReadable) {
          // await pipeline(
          //   Readable.fromWeb(htmlReadable as any),
          //   createWriteStream(destHtmlFile),
          // );

          files.set(destHtmlFile, {
            contents: await streamToStringAsync(htmlReadable),
            targetDomain: 'client',
          });
        } else {
          files.set(destHtmlFile, {
            contents: htmlStr,
            targetDomain: 'client',
          });

          // await writeFile(destHtmlFile, htmlStr);
        }
      })
    );
    const dynamicHtmlPaths = Array.from(dynamicHtmlPathMap);
    const code = `
export const dynamicHtmlPaths= ${JSON.stringify(dynamicHtmlPaths)};
export const publicIndexHtml= ${JSON.stringify(publicIndexHtml)};
`;

    files.set(distEntriesFile, {
      contents: code,
      targetDomain: 'client',
    });
    // await appendFile(distEntriesFile, code);
  }

  async renderRscToReadableStream({
    route,
    searchParams,
    method,
    platform,
    req,
    engine,
    entries,
  }: {
    route: string;
    searchParams: URLSearchParams;
    // eslint-disable-next-line @typescript-eslint/ban-types
    method: 'POST' | 'GET';
    platform: string;
    req?: Request;
    engine?: 'hermes';
    entries?: EntriesPrd;
  }) {
    const { baseUrl, mode, routerRoot, isExporting } = this.instanceMetroOptions;
    assert(
      baseUrl != null && mode != null && routerRoot != null && isExporting != null,
      'The server must be started before calling ssrLoadModule.'
    );
    if (method === 'POST') {
      assert(req, 'Server request must be provided when method is POST (server actions)');
    }

    // TODO: Extract CSS Modules / Assets from the bundler process
    const {
      filename: serverUrl,
      fn: {
        renderRsc,
        // setupHmr,
        // renderRouteWithContextKey, getRouteNodeForPathname
      },
    } = await this.ssrLoadModuleAndHmrEntry<
      //   typeof import('expo-router/build/static/rsc-renderer')
      // >('expo-router/node/rsc.js', {
      typeof import('expo-router/src/static/rsc-renderer')
    >('expo-router/src/static/rsc-renderer.ts', {
      environment: 'react-server',
      platform,
    });

    console.log('>', route, platform, serverUrl);

    // const routeNode = await getRouteNodeForPathname(route);

    // const elements = await renderRouteWithContextKey(routeNode.file, {
    //   //TODO: Props for RSC.
    // });

    // const input = './index.tsx';
    // const normalizedRouteKey = 'TODO';
    //TODO: This isn't right
    const normalizedRouteKey = (
      require('expo-router/build/matchers') as typeof import('expo-router/build/matchers')
    ).getNameFromFilePath(route);

    // TODO: Add config
    const config = {};

    if (isExporting) {
      // throw new Error('TODO: Add exporting back');

      const pipe = await renderRsc({
        body: req?.body!,
        entries: entries ?? (await this.getExpoRouterRscEntriesGetterAsync({ platform })),
        searchParams,
        context: {},
        isExporting: !!isExporting,
        resolveClientEntry: this.getResolveClientEntry({ platform, engine }),
        config,
        method,
        input: route,
        moduleIdCallback: (moduleInfo: {
          id: string;
          chunks: string[];
          name: string;
          async: boolean;
        }) => {
          console.log('moduleIdCallback:', moduleInfo.id, moduleInfo.name, moduleInfo.async);
          let platformSet = this.clientModuleMap.get(platform);
          if (!platformSet) {
            platformSet = new Map();
            this.clientModuleMap.set(platform, platformSet);
          }
          // Collect the client boundaries while rendering the server components.
          // Indexed by routes.
          let idSet = platformSet.get(normalizedRouteKey);
          if (!idSet) {
            idSet = new Set();
            platformSet.set(normalizedRouteKey, idSet);
          }
          idSet.add(moduleInfo.id);
        },
      });

      return pipe;
    } else {
      this.setupHmr(new URL(serverUrl));

      const pipe = await renderRsc({
        body: req?.body!,
        entries: entries ?? (await this.getExpoRouterRscEntriesGetterAsync({ platform })),
        searchParams,
        context: {},
        isExporting: !!isExporting,
        resolveClientEntry: this.getResolveClientEntry({ platform, engine }),
        config,
        method,
        input: route,

        customImport: async (relativeDevServerUrl: string): Promise<any> => {
          const url = new URL(relativeDevServerUrl, this.getDevServerUrlOrAssert());

          // TODO: Apply all params here.
          url.searchParams.set('modulesOnly', 'true');
          url.searchParams.set('runModule', 'true');

          url.searchParams.set('transform.environment', 'react-server');
          url.searchParams.set('resolver.environment', 'react-server');

          url.searchParams.set('platform', platform);

          const urlString = url.toString();
          const contents = await metroFetchAsync(this.projectRoot, urlString);
          // console.log('Server action:');
          // console.log(contents);
          return evalMetro(this.projectRoot, contents.src, contents.filename);
        },
        // serverUrl: new URL(serverUrl),
        // onReload: (...args: any[]) => {
        //   // Send reload command to client from Fast Refresh code.
        //   debug('[CLI]: Reload RSC:', args);

        //   // TODO: Target only certain platforms
        //   this.broadcastMessage('reload');
        // },
        moduleIdCallback: (moduleInfo: {
          id: string;
          chunks: string[];
          name: string;
          async: boolean;
        }) => {
          // console.log('moduleIdCallback:', moduleInfo.id, moduleInfo.name, moduleInfo.async);
          // let platformSet = this.clientModuleMap.get(platform);
          // if (!platformSet) {
          //   platformSet = new Map();
          //   this.clientModuleMap.set(platform, platformSet);
          // }
          // // Collect the client boundaries while rendering the server components.
          // // Indexed by routes.
          // let idSet = platformSet.get(normalizedRouteKey);
          // if (!idSet) {
          //   idSet = new Set();
          //   platformSet.set(normalizedRouteKey, idSet);
          // }
          // idSet.add(moduleInfo.id);
        },
      });

      return pipe;
    }
  }

  protected async startImplementationAsync(
    options: BundlerStartOptions
  ): Promise<DevServerInstance> {
    options.port = await this.resolvePortAsync(options);
    this.urlCreator = this.getUrlCreator(options);

    const config = getConfig(this.projectRoot, { skipSDKVersionRequirement: true });
    const { exp } = config;
    const useServerRendering = ['static', 'server'].includes(exp.web?.output ?? '');
    const baseUrl = getBaseUrlFromExpoConfig(exp);
    const asyncRoutes = getAsyncRoutesFromExpoConfig(exp, options.mode ?? 'development', 'web');
    const routerRoot = getRouterDirectoryModuleIdWithManifest(this.projectRoot, exp);
    const rscPath = getRscPathFromExpoConfig(exp);
    const appDir = path.join(this.projectRoot, routerRoot);
    const mode = options.mode ?? 'development';

    this.instanceMetroOptions = {
      isExporting: !!options.isExporting,
      baseUrl,
      mode,
      routerRoot,
      minify: options.minify,
      asyncRoutes,
      rscPath,
      // Options that are changing between platforms like engine, platform, and environment aren't set here.
    };

    const parsedOptions = {
      port: options.port,
      maxWorkers: options.maxWorkers,
      resetCache: options.resetDevServer,
    };

    // Required for symbolication:
    process.env.EXPO_DEV_SERVER_ORIGIN = `http://localhost:${options.port}`;
    // const serverRoot = getMetroServerRoot(this.projectRoot);

    const { metro, server, middleware, messageSocket } = await instantiateMetroAsync(
      this,
      parsedOptions,
      {
        isExporting: !!options.isExporting,
      }
    );

    const manifestMiddleware = await this.getManifestMiddlewareAsync(options);

    // Important that we noop source maps for context modules as soon as possible.
    prependMiddleware(middleware, new ContextModuleSourceMapsMiddleware().getHandler());

    // We need the manifest handler to be the first middleware to run so our
    // routes take precedence over static files. For example, the manifest is
    // served from '/' and if the user has an index.html file in their project
    // then the manifest handler will never run, the static middleware will run
    // and serve index.html instead of the manifest.
    // https://github.com/expo/expo/issues/13114
    prependMiddleware(middleware, manifestMiddleware.getHandler());

    middleware.use(
      new InterstitialPageMiddleware(this.projectRoot, {
        // TODO: Prevent this from becoming stale.
        scheme: options.location.scheme ?? null,
      }).getHandler()
    );
    middleware.use(new ReactDevToolsPageMiddleware(this.projectRoot).getHandler());
    middleware.use(
      new DevToolsPluginMiddleware(this.projectRoot, this.devToolsPluginManager).getHandler()
    );

    const deepLinkMiddleware = new RuntimeRedirectMiddleware(this.projectRoot, {
      onDeepLink: getDeepLinkHandler(this.projectRoot),
      getLocation: ({ runtime }) => {
        if (runtime === 'custom') {
          return this.urlCreator?.constructDevClientUrl();
        } else {
          return this.urlCreator?.constructUrl({
            scheme: 'exp',
          });
        }
      },
    });
    middleware.use(deepLinkMiddleware.getHandler());

    middleware.use(new CreateFileMiddleware(this.projectRoot).getHandler());

    // Append support for redirecting unhandled requests to the index.html page on web.
    if (this.isTargetingWeb()) {
      // This MUST be after the manifest middleware so it doesn't have a chance to serve the template `public/index.html`.
      middleware.use(new ServeStaticMiddleware(this.projectRoot).getHandler());

      // This should come after the static middleware so it doesn't serve the favicon from `public/favicon.ico`.
      middleware.use(new FaviconMiddleware(this.projectRoot).getHandler());

      let rscPathPrefix = rscPath;
      if (rscPathPrefix !== '/') {
        rscPathPrefix += '/';
      }

      const getFullUrl = (url: string) => {
        try {
          return new URL(url);
        } catch (error: any) {
          if (error.code === 'ERR_INVALID_URL') {
            return new URL(url, this.getDevServerUrlOrAssert());
          }
          throw error;
        }
      };

      middleware.use(
        createRequestHandler(this.projectRoot, async (req) => {
          const url = getFullUrl(req.url);
          if (!url.pathname.startsWith(rscPathPrefix)) {
            winterNext();
          }
          const method = req.method;
          if (!isSupportedRequestMethod(method)) {
            notAllowed();
          }

          const engine = url.searchParams.get('transform.engine');
          if (engine && !['hermes'].includes(engine)) {
            return new Response(
              `Query parameter "transform.engine" is an unsupported value: ${engine}`,
              {
                status: 500,
                headers: {
                  'Content-Type': 'text/plain',
                },
              }
            );
          }
          const platform = url.searchParams.get('platform') ?? req.headers.get('expo-platform');
          if (typeof platform !== 'string' || !platform) {
            return new Response('Missing expo-platform header or platform query parameter', {
              status: 500,
              headers: {
                'Content-Type': 'text/plain',
              },
            });
          }

          let route: string;
          const encodedInput = url.pathname.replace(rscPathPrefix, '');
          try {
            route = decodeInput(encodedInput);
          } catch {
            return new Response(`Invalid encoded input: "${encodedInput}"`, {
              status: 400,
              headers: {
                'Content-Type': 'text/plain',
              },
            });
          }

          let pipe: ReadableStream<any>;
          try {
            pipe = await this.renderRscToReadableStream({
              route,
              searchParams: url.searchParams,
              platform,
              req,
              method,
              engine: engine as 'hermes' | undefined,
            });
          } catch (error: any) {
            // If you get a codeFrame error during SSR like when using a Class component in React Server Components, then this
            // will throw with:
            // {
            //   rawObject: {
            //     type: 'TransformError',
            //     lineNumber: 0,
            //     errors: [ [Object] ],
            //     name: 'SyntaxError',
            //     message: '...',
            //   }
            // }
            if (error instanceof MetroNodeError) {
              throw error;
            }

            // res.statusCode = 500;
            // res.statusMessage = `Metro Bundler encountered an error (check the terminal for more info).`;
            const sanitizedServerMessage = stripAnsi(error.message) ?? error.message;

            return new Response(`Metro Bundler encountered an error: ` + sanitizedServerMessage, {
              status: 500,
              headers: {
                'Content-Type': 'text/plain',
              },
            });
          }

          console.log('pipe:', pipe);
          const response = new Response(pipe, {
            headers: {
              // Set headers for RSC
              // 'Content-Type': 'application/json; charset=UTF-8',
              // https://dev.to/one-beyond/react-server-components-without-any-frameworks-5a8p#:~:text=The%20RSC%20format%20is%20a,elements%20the%20client%20will%20render.
              // 'Content-Type': 'text/x-component',
              // The response is a streamed text file
              'Content-Type': 'text/plain',
            },
          });
          // TODO: Should we set X-Location? https://github.com/reactjs/server-components-demo/blob/95fcac10102d20722af60506af3b785b557c5fd7/server/api.server.js#L108C40-L108C48

          console.log('>>', response.headers.entries());
          // TODO: Prevent this from being appended (in RNC CLI)
          // response.headers.delete('Surrogate-Control');
          // response.headers.delete('Cache-Control');
          // response.headers.delete('Expires');
          // response.headers.delete('X-Content-Type-Options');

          return response;
        })
      );

      if (useServerRendering) {
        middleware.use(
          createRouteHandlerMiddleware(this.projectRoot, {
            appDir,
            routerRoot,
            config,
            bundleApiRoute: (functionFilePath) => this.ssrImportApiRoute(functionFilePath),
            getHtml: async (req) => {
              const devMiddleware = (await this.ssrLoadModule(
                require.resolve('expo-router/build/static/handler-dev.js'),
                {
                  environment: 'react-server',
                }
              )) as typeof import('expo-router/build/static/handler-dev');

              const handler = await devMiddleware.createHandler({
                projectRoot: this.projectRoot,
                config: {
                  basePath: baseUrl,
                  htmlHead: '',
                  mainJs: '',
                  publicDir: '',
                  rscPath: '/rsc',
                  srcDir: '',
                },
                ssrLoadModule(fileURL) {
                  return this.ssrLoadModule(fileURL);
                },
                renderRscWithWorker: async (props) => {
                  // TODO: This is terrible, it should use all the `props`.
                  const stream = await this.renderRscToReadableStream({
                    route: props.input,
                    method: props.method,
                    platform: 'web',
                    url: new URL(req.url!, this.getDevServerUrlOrAssert()),
                  });
                  console.log('stream:', stream);
                  return [
                    stream,
                    // TODO: Next context
                    {},
                  ];
                },
                // ssrLoadModule: metroSsr.ssrLoadModule,
                async transformIndexHtml(pathname, data) {
                  console.log('transform index:', pathname, data);
                  const codeToInject = `
  globalThis.__waku_module_cache__ = new Map();
  globalThis.__webpack_chunk_load__ = (id) => import(id).then((m) => globalThis.__waku_module_cache__.set(id, m));
  globalThis.__webpack_require__ = (id) => globalThis.__waku_module_cache__.get(id);`;

                  //            // HACK without <base>, some relative assets don't work.
                  // // FIXME ideally, we should avoid this.
                  // { tag: 'base', attrs: { href: config.basePath } },
                  // {
                  //   tag: 'script',
                  //   attrs: { type: 'module', async: true },
                  //   children: codeToInject,
                  // },
                  // ...(config.cssAssets || []).map((href) => ({
                  //   tag: 'link',
                  //   attrs: { rel: 'stylesheet', href },
                  //   injectTo: 'head' as const,
                  // })),

                  const start = `<!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8" />
                        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover" />
                      </head>
                      <body></body>
                    </html>`;

                  // TODO: Run additional plugins.

                  return start;
                },
                env: process.env,
                ssr: true,
              });

              // TODO: Memoize this stuff.
              // const res = new Response();

              return await handler(req);
            },
            getStaticPageAsync: (pathname) => {
              return this.getStaticPageAsync(pathname);
            },
          })
        );

        observeAnyFileChanges(
          {
            metro,
            server,
          },
          (events) => {
            if (exp.web?.output === 'server') {
              // NOTE(EvanBacon): We aren't sure what files the API routes are using so we'll just invalidate
              // aggressively to ensure we always have the latest. The only caching we really get here is for
              // cases where the user is making subsequent requests to the same API route without changing anything.
              // This is useful for testing but pretty suboptimal. Luckily our caching is pretty aggressive so it makes
              // up for a lot of the overhead.
              this.invalidateApiRouteCache();
            } else if (!hasWarnedAboutApiRoutes()) {
              for (const event of events) {
                if (
                  // If the user did not delete a file that matches the Expo Router API Route convention, then we should warn that
                  // API Routes are not enabled in the project.
                  event.metadata?.type !== 'd' &&
                  // Ensure the file is in the project's routes directory to prevent false positives in monorepos.
                  event.filePath.startsWith(appDir) &&
                  isApiRouteConvention(event.filePath)
                ) {
                  warnInvalidWebOutput();
                }
              }
            }
          }
        );
      } else {
        // This MUST run last since it's the fallback.
        middleware.use(
          new HistoryFallbackMiddleware(manifestMiddleware.getHandler().internal).getHandler()
        );
      }
    }
    // Extend the close method to ensure that we clean up the local info.
    const originalClose = server.close.bind(server);

    server.close = (callback?: (err?: Error) => void) => {
      return originalClose((err?: Error) => {
        this.instance = null;
        this.metro = null;
        callback?.(err);
      });
    };

    this.metro = metro;
    return {
      server,
      location: {
        // The port is the main thing we want to send back.
        port: options.port,
        // localhost isn't always correct.
        host: 'localhost',
        // http is the only supported protocol on native.
        url: `http://localhost:${options.port}`,
        protocol: 'http',
      },
      middleware,
      messageSocket,
    };
  }

  public async waitForTypeScriptAsync(): Promise<boolean> {
    if (!this.instance) {
      throw new Error('Cannot wait for TypeScript without a running server.');
    }

    return new Promise<boolean>((resolve) => {
      if (!this.metro) {
        // This can happen when the run command is used and the server is already running in another
        // process. In this case we can't wait for the TypeScript check to complete because we don't
        // have access to the Metro server.
        debug('Skipping TypeScript check because Metro is not running (headless).');
        return resolve(false);
      }

      const off = metroWatchTypeScriptFiles({
        projectRoot: this.projectRoot,
        server: this.instance!.server,
        metro: this.metro,
        tsconfig: true,
        throttle: true,
        eventTypes: ['change', 'add'],
        callback: async () => {
          // Run once, this prevents the TypeScript project prerequisite from running on every file change.
          off();
          const { TypeScriptProjectPrerequisite } = await import(
            '../../doctor/typescript/TypeScriptProjectPrerequisite.js'
          );

          try {
            const req = new TypeScriptProjectPrerequisite(this.projectRoot);
            await req.bootstrapAsync();
            resolve(true);
          } catch (error: any) {
            // Ensure the process doesn't fail if the TypeScript check fails.
            // This could happen during the install.
            Log.log();
            Log.error(
              chalk.red`Failed to automatically setup TypeScript for your project. Try restarting the dev server to fix.`
            );
            Log.exception(error);
            resolve(false);
          }
        },
      });
    });
  }

  public async startTypeScriptServices() {
    return startTypescriptTypeGenerationAsync({
      server: this.instance?.server,
      metro: this.metro,
      projectRoot: this.projectRoot,
    });
  }

  protected getConfigModuleIds(): string[] {
    return ['./metro.config.js', './metro.config.json', './rn-cli.config.js'];
  }

  private pendingRouteOperations = new Map<
    string,
    Promise<{ src: string; filename: string } | null>
  >();

  // API Routes

  // Bundle the API Route with Metro and return the string contents to be evaluated in the server.
  private async bundleApiRoute(
    filePath: string
  ): Promise<{ src: string; filename: string } | null | undefined> {
    if (this.pendingRouteOperations.has(filePath)) {
      return this.pendingRouteOperations.get(filePath);
    }
    const bundleAsync = async () => {
      try {
        debug('Bundle API route:', this.instanceMetroOptions.routerRoot, filePath);
        return await this.ssrLoadModuleContents(filePath);
      } catch (error: any) {
        if (error instanceof Error) {
          await logMetroErrorAsync({ error, projectRoot: this.projectRoot });
        }
        throw error;
      } finally {
        // pendingRouteOperations.delete(filepath);
      }
    };
    const route = bundleAsync();

    this.pendingRouteOperations.set(filePath, route);
    return route;
  }

  private async ssrImportApiRoute(
    filePath: string
  ): Promise<null | Record<string, Function> | Response> {
    // TODO: Cache the evaluated function.
    try {
      const apiRoute = await this.bundleApiRoute(filePath);

      if (!apiRoute?.src) {
        return null;
      }
      return evalMetroNoHandling(this.projectRoot, apiRoute.src, apiRoute.filename);
    } catch (error) {
      // Format any errors that were thrown in the global scope of the evaluation.
      if (error instanceof Error) {
        try {
          const htmlServerError = await getErrorOverlayHtmlAsync({
            error,
            projectRoot: this.projectRoot,
            routerRoot: this.getExpoLineOptions().routerRoot!,
          });

          return new Response(htmlServerError, {
            status: 500,
            headers: {
              'Content-Type': 'text/html',
            },
          });
        } catch (internalError) {
          debug('Failed to generate Metro server error UI for API Route error:', internalError);
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  private invalidateApiRouteCache() {
    this.pendingRouteOperations.clear();
  }
}

export function getDeepLinkHandler(projectRoot: string): DeepLinkHandler {
  return async ({ runtime }) => {
    if (runtime === 'expo') return;
    const { exp } = getConfig(projectRoot);
    await logEventAsync('dev client start command', {
      status: 'started',
      ...getDevClientProperties(projectRoot, exp),
    });
  };
}

/**
 * Returns a request handler for http that serves the response using Remix.
 */
export function createRequestHandler(
  projectRoot: string,
  handleRequest: (request: Request) => Promise<Response>
): RequestHandler {
  return async (req: ServerRequest, res: ServerResponse, next: ServerNext) => {
    if (!req?.url || !req.method) {
      return next();
    }
    // These headers (added by other middleware) break the browser preview of RSC.
    res.removeHeader('X-Content-Type-Options');
    res.removeHeader('Cache-Control');
    res.removeHeader('Expires');
    res.removeHeader('Surrogate-Control');

    try {
      const request = convertRequest(req, res);

      const response = await handleRequest(request);

      return await respond(res, response);
    } catch (error: unknown) {
      if (error instanceof MetroNodeError) {
        await logMetroError(projectRoot, { error });

        // Forward the Metro server to the client.
        // TODO: Cut out the middleman (metro dev server).

        return await respond(res, Response.json(error.rawObject, { status: 500 }));
      }

      if (error instanceof Error) {
        return await respond(
          res,
          new Response('Internal Server Error: ' + error.message, {
            status: 500,
            headers: {
              'Content-Type': 'text/plain',
            },
          })
        );
      } else if (error instanceof Response) {
        return await respond(res, error);
      }
      // http doesn't support async functions, so we have to pass along the
      // error manually using next().
      // @ts-expect-error
      next(error);
    }
  };
}

function isSupportedRequestMethod(method: string): method is 'GET' | 'POST' {
  return method === 'GET' || method === 'POST';
}
function notAllowed(): never {
  throw new Response('Method Not Allowed', {
    status: 405,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

function winterNext(): never {
  // eslint-disable-next-line no-throw-literal
  throw undefined;
}

const pathname2pathSpec = (pathname: string): PathSpec =>
  pathname
    .split('/')
    .filter(Boolean)
    .map((name) => ({ type: 'literal', name }));

const pathSpec2pathname = (pathSpec: PathSpec): string => {
  if (pathSpec.some(({ type }) => type !== 'literal')) {
    throw new Error('Cannot convert pathSpec to pathname: ' + JSON.stringify(pathSpec));
  }
  return '/' + pathSpec.map(({ name }) => name!).join('/');
};

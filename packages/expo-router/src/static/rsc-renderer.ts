/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from 'chalk';
import type { ReactNode } from 'react';
import { renderToReadableStream, decodeReply } from 'react-server-dom-webpack/server.edge';

import { setRenderContext, type EntriesDev, type EntriesPrd } from '../rsc/server';
import { streamToString } from '../rsc/stream';

const debug = require('debug')('expo:rsc');

export interface RenderContext<T = unknown> {
  rerender: (input: string, searchParams?: URLSearchParams) => void;
  context: T;
}

const resolveClientEntryForPrd = (id: string, config: ResolvedConfig) => {
  if (!id.startsWith('@id/')) {
    throw new Error('Unexpected client entry in PRD: ' + id);
  }
  return config.basePath + id.slice('@id/'.length);
};

type ResolvedConfig = any;

import { createElement } from 'react';
import { createFromReadableStream } from 'react-server-dom-webpack/client.edge';
export async function renderRsc(
  opts: {
    // TODO:
    config: ResolvedConfig;

    // Done
    input: string;
    searchParams: URLSearchParams;
    method: 'GET' | 'POST';
    context: Record<string, unknown> | undefined;
    body?: ReadableStream | undefined;
    contentType?: string | undefined;
    moduleIdCallback?: (module: {
      id: string;
      chunks: string[];
      name: string;
      async: boolean;
    }) => void;

    // Others
    // serverRoot: string;
    // serverUrl: URL;
    // onReload: () => void;
    resolveClientEntry: (id: string) => { id: string; url: string };
  } & (
    | { isExporting: true; entries: EntriesDev }
    | {
        isExporting: false;
        entries: EntriesDev;
        customImport: (fileURL: string) => Promise<unknown>;
      }
  )

  // moduleMap: WebpackManifest
): Promise<ReadableStream> {
  const {
    entries,
    // elements,
    searchParams,
    // isExporting,
    // url,
    // serverRoot,
    method,
    input,
    body,
    contentType,

    // serverUrl,
    // onReload,
    moduleIdCallback,
    context,
  } = opts;

  const {
    default: { renderEntries },
    loadModule,
  } = entries as (EntriesDev & { loadModule: undefined }) | EntriesPrd;

  const resolveClientEntry = opts.resolveClientEntry;

  const runWithRenderContext = async <T>(
    renderContext: Parameters<typeof setRenderContext>[0],
    fn: () => T
  ): Promise<Awaited<T>> =>
    new Promise<Awaited<T>>((resolve, reject) => {
      createFromReadableStream(
        renderToReadableStream(
          createElement((async () => {
            console.log('[RSC]: setRenderContext', renderContext, 'for input:', input);
            setRenderContext(renderContext);
            resolve(await fn());
          }) as any),
          {}
        ),
        {
          ssrManifest: { moduleMap: null, moduleLoading: null },
        }
      ).catch(reject);
    });

  const wrapWithContext = (
    context: Record<string, unknown> | undefined,
    elements: Record<string, ReactNode>,
    value?: unknown
  ) => {
    const renderContext = {
      context: context || {},
      rerender: () => {
        throw new Error('Cannot rerender');
      },
    };
    const elementEntries: [string, unknown][] = Object.entries(elements).map(([k, v]) => [
      k,
      createElement(() => {
        setRenderContext(renderContext);
        return v as ReactNode; // XXX lie the type
      }),
    ]);
    if (value !== undefined) {
      elementEntries.push(['_value', value]);
    }
    return Object.fromEntries(elementEntries);
  };

  const renderWithContext = async (
    context: Record<string, unknown> | undefined,
    input: string,
    searchParams: URLSearchParams
  ) => {
    const renderContext = {
      context: context || {},
      rerender: () => {
        throw new Error('Cannot rerender');
      },
    };
    const elements = await runWithRenderContext(renderContext, () =>
      renderEntries(input, searchParams)
    );
    if (elements === null) {
      const err = new Error('No function component found');
      (err as any).statusCode = 404; // HACK our convention for NotFound
      throw err;
    }
    if (Object.keys(elements).some((key) => key.startsWith('_'))) {
      throw new Error('"_" prefix is reserved');
    }
    return wrapWithContext(context, elements);
  };

  const renderWithContextWithAction = async (
    context: Record<string, unknown> | undefined,
    actionFn: () => unknown
  ) => {
    let elementsPromise: Promise<Record<string, ReactNode>> = Promise.resolve({});
    let rendered = false;
    const renderContext = {
      context: context || {},
      rerender: async (input: string, searchParams = new URLSearchParams()) => {
        if (rendered) {
          throw new Error('already rendered');
        }
        elementsPromise = Promise.all([elementsPromise, renderEntries(input, searchParams)]).then(
          ([oldElements, newElements]) => ({
            ...oldElements,
            // FIXME we should actually check if newElements is null and send an error
            ...newElements,
          })
        );
      },
    };
    const actionValue = await runWithRenderContext(renderContext, actionFn);
    const elements = await elementsPromise;
    rendered = true;
    if (Object.keys(elements).some((key) => key.startsWith('_'))) {
      throw new Error('"_" prefix is reserved');
    }
    return wrapWithContext(context, elements, actionValue);
  };

  // const render = async (
  //   renderContext: RenderContext,
  //   input: string,
  //   searchParams: URLSearchParams
  // ) => {
  //   const elements = await renderEntries.call(renderContext, input, searchParams);
  //   if (elements === null) {
  //     const err = new Error('No function component found');
  //     (err as any).statusCode = 404; // HACK our convention for NotFound
  //     throw err;
  //   }
  //   if (Object.keys(elements).some((key) => key.startsWith('_'))) {
  //     throw new Error('"_" prefix is reserved');
  //   }
  //   return elements;
  // };

  const bundlerConfig = new Proxy(
    {},
    {
      get(_target, encodedId: string) {
        // console.log('Get manifest entry:', encodedId);
        const [
          // File is the on-disk location of the module, this is injected during the "use client" transformation (babel).
          file,
          // The name of the import (e.g. "default" or "")
          name,
        ] = encodedId.split('#') as [string, string];

        // We'll augment the file path with the incoming RSC request which will forward the metro props required to make a cache hit, e.g. platform=web&...
        // This is similar to how we handle lazy bundling.
        const id = resolveClientEntry(file);
        // console.log('Returning server module:', id, 'for', encodedId);
        moduleIdCallback?.({ id: id.url, chunks: [id.url], name, async: true });
        return { id: id.id, chunks: [id.id], name, async: true };
      },
    }
  );

  if (method === 'POST') {
    // TODO(Bacon): Fix Server action ID generation
    const rsfId = decodeURIComponent(input);
    // const rsfId = decodeURIComponent(decodeInput(input));
    let args: unknown[] = [];
    let bodyStr = '';
    if (body) {
      bodyStr = await streamToString(body);
    }
    if (typeof contentType === 'string' && contentType.startsWith('multipart/form-data')) {
      // XXX This doesn't support streaming unlike busboy
      const formData = parseFormData(bodyStr, contentType);
      args = await decodeReply(formData);
    } else if (bodyStr) {
      args = await decodeReply(bodyStr);
    }
    const [fileId, name] = rsfId.split('#') as [string, string];
    let mod: any;
    if (opts.isExporting === false) {
      // console.log('Loading module:', fileId, name);
      mod = await opts.customImport(fileId);
      // mod = await opts.customImport(resolveClientEntry(fileId).url);
      // console.log('Loaded module:', mod);
    } else {
      throw new Error('TODO: Make this work with Metro');
      if (!fileId.startsWith('@id/')) {
        throw new Error('Unexpected server entry in PRD');
      }
      mod = await loadModule!(fileId.slice('@id/'.length));
    }
    const fn = mod[name] || mod;
    // console.log('Target function:', fn);
    const elements = await renderWithContextWithAction(context, () => fn(...args));
    return renderToReadableStreamWithDebugging(elements, bundlerConfig);
  }

  // method === 'GET'
  const elements = await renderWithContext(context, input, searchParams);
  return renderToReadableStreamWithDebugging(elements, bundlerConfig);
}

// TODO is this correct? better to use a library?
const parseFormData = (body: string, contentType: string) => {
  const boundary = contentType.split('boundary=')[1];
  const parts = body.split(`--${boundary}`);
  const formData = new FormData();
  for (const part of parts) {
    if (part.trim() === '' || part === '--') continue;
    const [rawHeaders, content] = part.split('\r\n\r\n', 2);
    const headers = rawHeaders!.split('\r\n').reduce(
      (acc, currentHeader) => {
        const [key, value] = currentHeader.split(': ');
        acc[key!.toLowerCase()] = value!;
        return acc;
      },
      {} as Record<string, string>
    );
    const contentDisposition = headers['content-disposition'];
    const nameMatch = /name="([^"]+)"/.exec(contentDisposition!);
    const filenameMatch = /filename="([^"]+)"/.exec(contentDisposition!);
    if (nameMatch) {
      const name = nameMatch[1];
      if (filenameMatch) {
        const filename = filenameMatch[1];
        const type = headers['content-type'] || 'application/octet-stream';
        const blob = new Blob([content!], { type });
        formData.append(name!, blob, filename);
      } else {
        formData.append(name!, content!.trim());
      }
    }
  }
  return formData;
};

const decodeInput = (encodedInput: string) => {
  console.log('> decodeInput:', encodedInput);
  if (encodedInput === 'index.txt') {
    return '';
  }
  if (encodedInput?.endsWith('.txt')) {
    return encodedInput.slice(0, -'.txt'.length);
  }
  const err = new Error('Invalid encoded input');
  (err as any).statusCode = 400;
  throw err;
};

// TODO: Implement this in production exports.
export async function getBuildConfig(opts: {
  config: ResolvedConfig;
  entries: EntriesPrd;
  resolveClientEntry: (id: string) => { id: string; url: string };
}) {
  const { config, entries } = opts;

  const {
    default: { getBuildConfig },
  } = entries;
  if (!getBuildConfig) {
    console.warn(
      "getBuildConfig is undefined. It's recommended for optimization and sometimes required."
    );
    return [];
  }

  // const resolveClientEntry = isDev
  // ? opts.resolveClientEntry
  // : resolveClientEntryForPrd;

  const unstable_collectClientModules = async (input: string): Promise<string[]> => {
    const idSet = new Set<string>();
    const readable = await renderRsc({
      config,
      input,
      searchParams: new URLSearchParams(),
      method: 'GET',
      context: undefined,
      moduleIdCallback: ({ id }) => idSet.add(id),
      isExporting: true,
      resolveClientEntry: opts.resolveClientEntry,
      // resolveClientEntry: (id) => {
      //   const entry = resolveClientEntryForPrd(id, config);
      //   return { id: entry, url: entry };
      //   // throw new Error('TODO: Implement resolveClientEntry');
      // },
      entries,
    });
    await new Promise<void>((resolve, reject) => {
      const writable = new WritableStream({
        close() {
          resolve();
        },
        abort(reason) {
          reject(reason);
        },
      });
      readable.pipeTo(writable);
    });
    return Array.from(idSet);
  };

  const output = await getBuildConfig(unstable_collectClientModules);
  return output;
}

export type GetSsrConfigArgs = {
  config: ResolvedConfig;
  pathname: string;
  searchParams: URLSearchParams;
};

type GetSsrConfigOpts =
  | { isDev: false; entries: EntriesPrd }
  | {
      isDev: true;
      entries: EntriesDev;
      resolveClientEntry: (id: string) => string;
    };

export async function getSsrConfig(args: GetSsrConfigArgs, opts: GetSsrConfigOpts) {
  const { config, pathname, searchParams } = args;
  const { isDev, entries } = opts;

  const resolveClientEntry = isDev ? opts.resolveClientEntry : resolveClientEntryForPrd;

  const {
    default: { getSsrConfig },
    // loadModule,
  } = entries as (EntriesDev & { loadModule: undefined }) | EntriesPrd;
  // const { renderToReadableStream } = await loadModule!('react-server-dom-webpack/server.edge').then(
  //   (m: any) => m.default
  // );

  const ssrConfig = await getSsrConfig?.(pathname, { searchParams });
  if (!ssrConfig) {
    return null;
  }
  const bundlerConfig = new Proxy(
    {},
    {
      get(_target, encodedId: string) {
        const [file, name] = encodedId.split('#') as [string, string];
        const id = resolveClientEntry(file, config);
        return { id, chunks: [id], name, async: true };
      },
    }
  );
  return {
    ...ssrConfig,
    body: renderToReadableStream(ssrConfig.body, bundlerConfig),
  };
}

// Custom:

function renderToReadableStreamWithDebugging(...args: Parameters<typeof renderToReadableStream>) {
  const stream = renderToReadableStream(...args);
  if (debug.enabled) {
    return withDebugLogging(stream);
  }
  return stream;
}

function withDebugLogging(stream: ReadableStream) {
  const textDecoder = new TextDecoder();

  // Wrap the stream and log chunks to the terminal.
  return new ReadableStream({
    start(controller) {
      stream.pipeTo(
        new WritableStream({
          write(chunk) {
            console.log(chalk`{dim [rsc]}`, textDecoder.decode(chunk));
            controller.enqueue(chunk);
          },
          close() {
            controller.close();
          },
          abort(reason) {
            controller.error(reason);
          },
        })
      );
    },
  });
}

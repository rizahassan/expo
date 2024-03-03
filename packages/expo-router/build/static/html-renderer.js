"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderHtml = void 0;
const server_1 = require("rsc-html-stream/server");
const utils_1 = require("./utils");
const path_1 = require("../rsc/path");
const stream_1 = require("../rsc/stream");
// const [
//   {
//     default: { createElement },
//   },
//   {
//     default: { renderToReadableStream },
//   },
//   {
//     default: { createFromReadableStream },
//   },
//   { ServerRoot },
// ] = await Promise.all([
//   loadClientModule('react') as Promise<{ default: typeof ReactType }>,
//   loadClientModule('rd-server') as Promise<{ default: typeof RDServerType }>,
//   loadClientModule('rsdw-client') as Promise<{
//     default: typeof RSDWClientType;
//   }>,
//   loadClientModule('waku-client') as Promise<typeof WakuClientType>,
// ]);
// HACK for react-server-dom-webpack without webpack
globalThis.__webpack_module_loading__ ||= new Map();
globalThis.__webpack_module_cache__ ||= new Map();
globalThis.__webpack_chunk_load__ ||= async (id) => globalThis.__webpack_module_loading__.get(id);
globalThis.__webpack_require__ ||= (id) => globalThis.__webpack_module_cache__.get(id);
const moduleLoading = globalThis.__webpack_module_loading__;
const moduleCache = globalThis.__webpack_module_cache__;
const fakeFetchCode = `
Promise.resolve(new Response(new ReadableStream({
  start(c) {
    const d = (self.__FLIGHT_DATA ||= []);
    const t = new TextEncoder();
    const f = (s) => c.enqueue(typeof s === 'string' ? t.encode(s) : s);
    d.forEach(f);
    d.push = f;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => c.close());
    } else {
      c.close();
    }
  }
})))
`
    .split('\n')
    .map((line) => line.trim())
    .join('');
const injectScript = (urlForFakeFetch, mainJsPath // for DEV only, pass `''` for PRD
) => {
    const modifyHead = (data) => {
        const matchPrefetched = data.match(
        // HACK This is very brittle
        /(.*<script[^>]*>\nglobalThis\.__WAKU_PREFETCHED__ = {\n)(.*?)(\n};.*)/s);
        if (matchPrefetched) {
            data = matchPrefetched[1] + `  '${urlForFakeFetch}': ${fakeFetchCode},` + matchPrefetched[3];
        }
        const closingHeadIndex = data.indexOf('</head>');
        if (closingHeadIndex === -1) {
            throw new Error('closing head not found');
        }
        let code = '';
        if (!matchPrefetched) {
            code += `
globalThis.__WAKU_PREFETCHED__ = {
  '${urlForFakeFetch}': ${fakeFetchCode},
};
`;
        }
        if (code) {
            data =
                data.slice(0, closingHeadIndex) +
                    `<script type="module" async>${code}</script>` +
                    data.slice(closingHeadIndex);
        }
        return data;
    };
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let headSent = false;
    let data = '';
    return new TransformStream({
        transform(chunk, controller) {
            if (!(chunk instanceof Uint8Array)) {
                throw new Error('Unknown chunk type');
            }
            data += decoder.decode(chunk);
            if (!headSent) {
                if (!/<\/head><body[^>]*>/.test(data)) {
                    return;
                }
                headSent = true;
                data = modifyHead(data);
                if (mainJsPath) {
                    data += `<script src="${mainJsPath}" async type="module"></script>`;
                }
            }
            controller.enqueue(encoder.encode(data));
            data = '';
        },
    });
};
// HACK for now, do we want to use HTML parser?
const rectifyHtml = () => {
    const pending = [];
    const decoder = new TextDecoder();
    let timer;
    return new TransformStream({
        transform(chunk, controller) {
            if (!(chunk instanceof Uint8Array)) {
                throw new Error('Unknown chunk type');
            }
            pending.push(chunk);
            if (/<\/\w+>$/.test(decoder.decode(chunk))) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    controller.enqueue((0, stream_1.concatUint8Arrays)(pending.splice(0)));
                });
            }
        },
        flush(controller) {
            clearTimeout(timer);
            if (pending.length) {
                controller.enqueue((0, stream_1.concatUint8Arrays)(pending.splice(0)));
            }
        },
    });
};
const buildHtml = (createElement, head, body) => createElement('html', null, createElement('head', { dangerouslySetInnerHTML: { __html: head } }), createElement('body', { 'data-hydrate': true }, body));
const renderHtml = async (opts) => {
    const { config, pathname, searchParams, htmlHead, renderRscForHtml, getSsrConfigForHtml, loadClientModule, isDev, } = opts;
    const [{ default: { createElement }, }, { default: { renderToReadableStream }, }, { default: { createFromReadableStream }, }, { ServerRoot },] = await Promise.all([
        loadClientModule('react'),
        loadClientModule('rd-server'),
        loadClientModule('rsdw-client'),
        loadClientModule('waku-client'),
    ]);
    const ssrConfig = await getSsrConfigForHtml?.(pathname, searchParams);
    if (!ssrConfig) {
        return null;
    }
    let stream;
    try {
        stream = await renderRscForHtml(ssrConfig.input, ssrConfig.searchParams || searchParams);
    }
    catch (e) {
        if ((0, utils_1.hasStatusCode)(e) && e.statusCode === 404) {
            return null;
        }
        throw e;
    }
    const moduleMap = new Proxy({}, {
        get(_target, filePath) {
            return new Proxy({}, {
                get(_target, name) {
                    const file = filePath.slice(config.basePath.length);
                    // TODO too long, we need to refactor this logic
                    if (isDev) {
                        const filePath = file.startsWith('@fs/')
                            ? file.slice('@fs'.length)
                            : (0, path_1.joinPath)(opts.rootDir, file);
                        const wakuDist = (0, path_1.joinPath)((0, path_1.fileURLToFilePath)(import.meta.url), '../../..');
                        if (filePath.startsWith(wakuDist)) {
                            const id = 'waku' + filePath.slice(wakuDist.length).replace(/\.\w+$/, '');
                            if (!moduleLoading.has(id)) {
                                moduleLoading.set(id, Promise.resolve(`${id}`).then(s => __importStar(require(s))).then((m) => {
                                    moduleCache.set(id, m);
                                }));
                            }
                            return { id, chunks: [id], name };
                        }
                        const id = (0, path_1.filePathToFileURL)(filePath);
                        if (!moduleLoading.has(id)) {
                            moduleLoading.set(id, opts.loadServerFile(id).then((m) => {
                                moduleCache.set(id, m);
                            }));
                        }
                        return { id, chunks: [id], name };
                    }
                    // !isDev
                    const id = file;
                    if (!moduleLoading.has(id)) {
                        moduleLoading.set(id, opts.loadModule((0, path_1.joinPath)(config.ssrDir, id)).then((m) => {
                            moduleCache.set(id, m);
                        }));
                    }
                    return { id, chunks: [id], name };
                },
            });
        },
    });
    const [stream1, stream2] = stream.tee();
    const elements = createFromReadableStream(stream1, {
        ssrManifest: { moduleMap, moduleLoading: null },
    });
    const body = createFromReadableStream(ssrConfig.body, {
        ssrManifest: { moduleMap, moduleLoading: null },
    });
    const readable = (await renderToReadableStream(buildHtml(createElement, htmlHead, createElement(ServerRoot, { elements }, body)), {
        onError(err) {
            console.error(err);
        },
    }))
        .pipeThrough(rectifyHtml())
        .pipeThrough(injectScript(config.basePath + config.rscPath + '/' + (0, utils_1.encodeInput)(ssrConfig.input), isDev ? `${config.basePath}${config.srcDir}/${config.mainJs}` : ''))
        .pipeThrough((0, server_1.injectRSCPayload)(stream2));
    return readable;
};
exports.renderHtml = renderHtml;
//# sourceMappingURL=html-renderer.js.map
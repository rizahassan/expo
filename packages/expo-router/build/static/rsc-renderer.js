"use strict";
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSsrConfig = exports.getBuildConfig = exports.renderRsc = void 0;
const chalk_1 = __importDefault(require("chalk"));
const server_edge_1 = require("react-server-dom-webpack/server.edge");
const os_1 = __importDefault(require("../../os"));
const stream_1 = require("../rsc/stream");
const debug = require('debug')('expo:rsc');
const resolveClientEntryForPrd = (id, config) => {
    if (!id.startsWith('@id/')) {
        throw new Error('Unexpected client entry in PRD: ' + id);
    }
    return config.basePath + id.slice('@id/'.length);
};
async function renderRsc(opts
// moduleMap: WebpackManifest
) {
    const { entries, 
    // elements,
    searchParams, 
    // isExporting,
    // url,
    // serverRoot,
    method, input, body, contentType, 
    // serverUrl,
    // onReload,
    moduleIdCallback, context, } = opts;
    const { default: { renderEntries }, loadModule, } = entries;
    const resolveClientEntry = opts.resolveClientEntry;
    const render = async (renderContext, input, searchParams) => {
        const elements = await renderEntries.call(renderContext, input, searchParams);
        if (elements === null) {
            const err = new Error('No function component found');
            err.statusCode = 404; // HACK our convention for NotFound
            throw err;
        }
        if (Object.keys(elements).some((key) => key.startsWith('_'))) {
            throw new Error('"_" prefix is reserved');
        }
        return elements;
    };
    const bundlerConfig = new Proxy({}, {
        get(_target, encodedId) {
            // console.log('Get manifest entry:', encodedId);
            const [
            // File is the on-disk location of the module, this is injected during the "use client" transformation (babel).
            file, 
            // The name of the import (e.g. "default" or "")
            name,] = encodedId.split('#');
            // We'll augment the file path with the incoming RSC request which will forward the metro props required to make a cache hit, e.g. platform=web&...
            // This is similar to how we handle lazy bundling.
            const id = resolveClientEntry(file);
            // console.log('Returning server module:', id, 'for', encodedId);
            moduleIdCallback?.({ id: id.url, chunks: [id.url], name, async: true });
            return { id: id.id, chunks: [id.id], name, async: true };
        },
    });
    if (method === 'POST') {
        // TODO(Bacon): Fix Server action ID generation
        const rsfId = decodeURIComponent(input);
        // const rsfId = decodeURIComponent(decodeInput(input));
        let args = [];
        let bodyStr = '';
        if (body) {
            bodyStr = await (0, stream_1.streamToString)(body);
        }
        if (typeof contentType === 'string' && contentType.startsWith('multipart/form-data')) {
            // XXX This doesn't support streaming unlike busboy
            const formData = parseFormData(bodyStr, contentType);
            args = await (0, server_edge_1.decodeReply)(formData);
        }
        else if (bodyStr) {
            args = await (0, server_edge_1.decodeReply)(bodyStr);
        }
        const [fileId, name] = rsfId.split('#');
        let mod;
        if (opts.isExporting === false) {
            // console.log('Loading module:', fileId, name);
            mod = await opts.customImport(resolveClientEntry(fileId).url);
            // console.log('Loaded module:', mod);
        }
        else {
            throw new Error('TODO: Make this work with Metro');
            if (!fileId.startsWith('@id/')) {
                throw new Error('Unexpected server entry in PRD');
            }
            mod = await loadModule(fileId.slice('@id/'.length));
        }
        const fn = mod[name] || mod;
        // console.log('Target function:', fn);
        let elements = Promise.resolve({});
        let rendered = false;
        // TODO: Define context
        // const context = {};
        const rerender = (input, searchParams = new URLSearchParams()) => {
            if (rendered) {
                throw new Error('already rendered');
            }
            const renderContext = { rerender, context };
            elements = Promise.all([elements, render(renderContext, input, searchParams)]).then(([oldElements, newElements]) => ({
                ...oldElements,
                ...newElements,
            }));
        };
        const renderContext = { rerender, context };
        const data = await fn.apply(renderContext, args);
        const resolvedElements = await elements;
        rendered = true;
        return (0, server_edge_1.renderToReadableStream)({ ...resolvedElements, _value: data }, bundlerConfig);
    }
    // method === 'GET'
    const renderContext = {
        rerender: () => {
            throw new Error('Cannot rerender');
        },
        context,
    };
    const elements = await render(renderContext, input, searchParams);
    const stream = (0, server_edge_1.renderToReadableStream)(elements, bundlerConfig);
    // Logging is very useful for native platforms where the network tab isn't always available.
    if (debug.enabled) {
        return withDebugLogging(stream);
    }
    return stream;
}
exports.renderRsc = renderRsc;
function withDebugLogging(stream) {
    const textDecoder = new TextDecoder();
    // Wrap the stream and log chunks to the terminal.
    return new ReadableStream({
        start(controller) {
            stream.pipeTo(new WritableStream({
                write(chunk) {
                    console.log((0, chalk_1.default) `{dim ${os_1.default} [rsc]}`, textDecoder.decode(chunk));
                    controller.enqueue(chunk);
                },
                close() {
                    controller.close();
                },
                abort(reason) {
                    controller.error(reason);
                },
            }));
        },
    });
}
// TODO is this correct? better to use a library?
const parseFormData = (body, contentType) => {
    const boundary = contentType.split('boundary=')[1];
    const parts = body.split(`--${boundary}`);
    const formData = new FormData();
    for (const part of parts) {
        if (part.trim() === '' || part === '--')
            continue;
        const [rawHeaders, content] = part.split('\r\n\r\n', 2);
        const headers = rawHeaders.split('\r\n').reduce((acc, currentHeader) => {
            const [key, value] = currentHeader.split(': ');
            acc[key.toLowerCase()] = value;
            return acc;
        }, {});
        const contentDisposition = headers['content-disposition'];
        const nameMatch = /name="([^"]+)"/.exec(contentDisposition);
        const filenameMatch = /filename="([^"]+)"/.exec(contentDisposition);
        if (nameMatch) {
            const name = nameMatch[1];
            if (filenameMatch) {
                const filename = filenameMatch[1];
                const type = headers['content-type'] || 'application/octet-stream';
                const blob = new Blob([content], { type });
                formData.append(name, blob, filename);
            }
            else {
                formData.append(name, content.trim());
            }
        }
    }
    return formData;
};
const decodeInput = (encodedInput) => {
    console.log('> decodeInput:', encodedInput);
    if (encodedInput === 'index.txt') {
        return '';
    }
    if (encodedInput?.endsWith('.txt')) {
        return encodedInput.slice(0, -'.txt'.length);
    }
    const err = new Error('Invalid encoded input');
    err.statusCode = 400;
    throw err;
};
// TODO: Implement this in production exports.
async function getBuildConfig(opts) {
    const { config, entries } = opts;
    const { default: { getBuildConfig }, } = entries;
    if (!getBuildConfig) {
        console.warn("getBuildConfig is undefined. It's recommended for optimization and sometimes required.");
        return [];
    }
    // const resolveClientEntry = isDev
    // ? opts.resolveClientEntry
    // : resolveClientEntryForPrd;
    const unstable_collectClientModules = async (input) => {
        const idSet = new Set();
        const readable = await renderRsc({
            config,
            input,
            searchParams: new URLSearchParams(),
            method: 'GET',
            context: null,
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
        await new Promise((resolve, reject) => {
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
exports.getBuildConfig = getBuildConfig;
async function getSsrConfig(args, opts) {
    const { config, pathname, searchParams } = args;
    const { isDev, entries } = opts;
    const resolveClientEntry = isDev ? opts.resolveClientEntry : resolveClientEntryForPrd;
    const { default: { getSsrConfig },
    // loadModule,
     } = entries;
    // const { renderToReadableStream } = await loadModule!('react-server-dom-webpack/server.edge').then(
    //   (m: any) => m.default
    // );
    const ssrConfig = await getSsrConfig?.(pathname, { searchParams });
    if (!ssrConfig) {
        return null;
    }
    const bundlerConfig = new Proxy({}, {
        get(_target, encodedId) {
            const [file, name] = encodedId.split('#');
            const id = resolveClientEntry(file, config);
            return { id, chunks: [id], name, async: true };
        },
    });
    return {
        ...ssrConfig,
        body: (0, server_edge_1.renderToReadableStream)(ssrConfig.body, bundlerConfig),
    };
}
exports.getSsrConfig = getSsrConfig;
//# sourceMappingURL=rsc-renderer.js.map
"use strict";
// Based on waku: https://github.com/dai-shi/waku/blob/f9111ed7d96c95d7e128b37e8f7ae2d80122218e/packages/waku/src/lib/middleware/rsc.ts#L1
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRscMiddleware = exports.decodeInput = void 0;
const decodeInput = (encodedInput) => {
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
exports.decodeInput = decodeInput;
// Production / Development API Route for handling RSC. Must be applied to the RSC paths, e.g. `/RSC/[...slug]+api.tsx`
function getRscMiddleware(options) {
    // (globalThis as any).__WAKU_PRIVATE_ENV__ = options.env || {};
    // const configPromise = resolveConfig(options.config || {});
    // const entriesPromise =
    //   options.cmd === 'start'
    //     ? options.loadEntries()
    //     : ('Error: loadEntries are not available' as never);
    let rscPathPrefix = options.rscPath;
    if (rscPathPrefix !== '/' && !rscPathPrefix.endsWith('/')) {
        rscPathPrefix += '/';
    }
    async function getOrPostAsync(req) {
        const url = new URL(req.url);
        const { method } = req;
        if (method !== 'GET' && method !== 'POST') {
            throw new Error(`Unsupported method '${method}'`);
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
        const engine = url.searchParams.get('transform.engine');
        // TODO: Dev Server only?
        if (engine && !['hermes'].includes(engine)) {
            return new Response(`Query parameter "transform.engine" is an unsupported value: ${engine}`, {
                status: 500,
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
        }
        let encodedInput = url.pathname.replace(
        // TODO: baseUrl support
        rscPathPrefix, '');
        //      const input = decodeInput(url.pathname.slice(options.baseUrl.length));
        try {
            encodedInput = (0, exports.decodeInput)(encodedInput);
        }
        catch {
            return new Response(`Invalid encoded input: "${encodedInput}"`, {
                status: 400,
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
        }
        try {
            const args = {
                config: options.config,
                platform,
                engine: engine,
                input: encodedInput,
                searchParams: url.searchParams,
                method,
                // context: ctx.context,
                body: req.body,
                contentType: req.headers.get('Content-Type') ?? '',
            };
            console.log('args', args);
            const readable = await options.renderRsc(args);
            //   const readable = await (ctx.devServer
            //     ? ctx.devServer.renderRscWithWorker(args)
            //     : renderRsc(args, { isDev: false, entries }));
            return new Response(readable, {
                headers: {
                    // Set headers for RSC
                    // 'Content-Type': 'application/json; charset=UTF-8',
                    // https://dev.to/one-beyond/react-server-components-without-any-frameworks-5a8p#:~:text=The%20RSC%20format%20is%20a,elements%20the%20client%20will%20render.
                    // 'Content-Type': 'text/x-component',
                    // The response is a streamed text file
                    'Content-Type': 'text/plain',
                },
            });
        }
        catch (err) {
            if (err instanceof Response) {
                return err;
            }
            //   if (hasStatusCode(err)) {
            //     ctx.res.status = err.statusCode;
            //   } else {
            //     console.info('Cannot process RSC', err);
            //     ctx.res.status = 500;
            //   }
            return new Response(`Unexpected server error rendering RSC: ` + err.message, {
                status: 'statusCode' in err ? err.statusCode : 500,
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
        }
    }
    return {
        GET: getOrPostAsync,
        POST: getOrPostAsync,
    };
}
exports.getRscMiddleware = getRscMiddleware;
//# sourceMappingURL=rsc.js.map
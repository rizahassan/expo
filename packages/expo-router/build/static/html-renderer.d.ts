import { EntriesPrd } from '../rsc/server';
type ResolvedConfig = any;
export declare const renderHtml: (opts: {
    config: ResolvedConfig;
    pathname: string;
    searchParams: URLSearchParams;
    htmlHead: string;
    renderRscForHtml: (input: string, searchParams: URLSearchParams) => Promise<ReadableStream>;
    getSsrConfigForHtml: (pathname: string, searchParams: URLSearchParams) => Promise<{
        input: string;
        searchParams?: URLSearchParams | undefined;
        body: ReadableStream;
    } | null>;
    loadClientModule: (key: string) => Promise<unknown>;
} & ({
    isDev: false;
    loadModule: EntriesPrd['loadModule'];
} | {
    isDev: true;
    rootDir: string;
    loadServerFile: (fileURL: string) => Promise<unknown>;
})) => Promise<ReadableStream | null>;
export {};
//# sourceMappingURL=html-renderer.d.ts.map
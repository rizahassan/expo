type ResolvedConfig = any;
export type RenderRscArgs = {
    config: ResolvedConfig;
    input: string;
    searchParams: URLSearchParams;
    platform: string;
    engine?: 'hermes' | null;
    method: 'GET' | 'POST';
    body?: ReadableStream | null;
    contentType?: string | undefined;
    moduleIdCallback?: ((id: string) => void) | undefined;
};
export declare const decodeInput: (encodedInput: string) => string;
export declare function getRscMiddleware(options: {
    config: ResolvedConfig;
    baseUrl: string;
    rscPath: string;
    renderRsc: (args: RenderRscArgs) => Promise<ReadableStream<any>>;
}): {
    GET: (req: Request) => Promise<Response>;
    POST: (req: Request) => Promise<Response>;
};
export {};

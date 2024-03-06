/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type EntriesDev, type EntriesPrd } from '../rsc/server';
export interface RenderContext<T = unknown> {
    rerender: (input: string, searchParams?: URLSearchParams) => void;
    context: T;
}
type ResolvedConfig = any;
export declare function renderRsc(opts: {
    config: ResolvedConfig;
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
    resolveClientEntry: (id: string) => {
        id: string;
        url: string;
    };
} & ({
    isExporting: true;
    entries: EntriesDev;
} | {
    isExporting: false;
    entries: EntriesDev;
    customImport: (fileURL: string) => Promise<unknown>;
})): Promise<ReadableStream>;
export declare function getBuildConfig(opts: {
    config: ResolvedConfig;
    entries: EntriesPrd;
    resolveClientEntry: (id: string) => {
        id: string;
        url: string;
    };
}): Promise<Iterable<{
    pathname: string | import("../rsc/path").PathSpec;
    isStatic?: boolean | undefined;
    entries?: Iterable<{
        input: string;
        skipPrefetch?: boolean | undefined;
        isStatic?: boolean | undefined;
    }> | undefined;
    customCode?: string | undefined;
    context?: Record<string, unknown> | undefined;
}>>;
export type GetSsrConfigArgs = {
    config: ResolvedConfig;
    pathname: string;
    searchParams: URLSearchParams;
};
type GetSsrConfigOpts = {
    isDev: false;
    entries: EntriesPrd;
} | {
    isDev: true;
    entries: EntriesDev;
    resolveClientEntry: (id: string) => string;
};
export declare function getSsrConfig(args: GetSsrConfigArgs, opts: GetSsrConfigOpts): Promise<{
    body: any;
    input: string;
    searchParams?: URLSearchParams | undefined;
} | null>;
export {};
//# sourceMappingURL=rsc-renderer.d.ts.map
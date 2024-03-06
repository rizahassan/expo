import type { ReactNode } from 'react';
import type { PathSpec } from './path';
type Config = any;
type Elements = Record<string, ReactNode>;
export type RenderEntries = (input: string, searchParams: URLSearchParams) => Promise<Elements | null>;
export type GetBuildConfig = (unstable_collectClientModules: (input: string) => Promise<string[]>) => Promise<Iterable<{
    pathname: string | PathSpec;
    isStatic?: boolean;
    entries?: Iterable<{
        input: string;
        skipPrefetch?: boolean;
        isStatic?: boolean;
    }>;
    customCode?: string;
    context?: Record<string, unknown>;
}>>;
export type GetSsrConfig = (pathname: string, options: {
    searchParams: URLSearchParams;
}) => Promise<{
    input: string;
    searchParams?: URLSearchParams;
    body: ReactNode;
} | null>;
export declare function defineEntries(renderEntries: RenderEntries, getBuildConfig?: GetBuildConfig, getSsrConfig?: GetSsrConfig): {
    renderEntries: RenderEntries;
    getBuildConfig: GetBuildConfig | undefined;
    getSsrConfig: GetSsrConfig | undefined;
};
export type EntriesDev = {
    default: ReturnType<typeof defineEntries>;
};
export type EntriesPrd = EntriesDev & {
    loadConfig: () => Promise<Config>;
    loadModule: (id: string) => Promise<unknown>;
    dynamicHtmlPaths: [pathSpec: PathSpec, htmlHead: string][];
    publicIndexHtml: string;
};
export declare function getEnv(key: string): string | undefined;
type RenderContext<RscContext extends Record<string, unknown> = Record<string, unknown>> = {
    rerender: (input: string, searchParams?: URLSearchParams) => void;
    context: RscContext;
};
/**
 * This is an internal function and not for public use.
 */
export declare const setRenderContext: (renderContext: RenderContext) => void;
export declare function rerender(input: string, searchParams?: URLSearchParams): void;
export declare function getContext<RscContext extends Record<string, unknown> = Record<string, unknown>>(): RscContext;
export {};
//# sourceMappingURL=server.d.ts.map
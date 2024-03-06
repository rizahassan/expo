"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContext = exports.rerender = exports.setRenderContext = exports.getEnv = exports.defineEntries = void 0;
const react_1 = require("react");
function defineEntries(renderEntries, getBuildConfig, getSsrConfig) {
    return { renderEntries, getBuildConfig, getSsrConfig };
}
exports.defineEntries = defineEntries;
function getEnv(key) {
    // HACK we may want to use a server-side context or something
    return globalThis.__WAKU_PRIVATE_ENV__[key];
}
exports.getEnv = getEnv;
const os_1 = __importDefault(require("expo-router/os"));
// TODO(EvanBacon): This can leak between platforms and runs.
// We need to share this module between the server action module and the renderer module, per platform, and invalidate on refreshes.
function getGlobalCacheForPlatform() {
    if (!globalThis.__EXPO_RSC_CACHE__) {
        globalThis.__EXPO_RSC_CACHE__ = new Map();
    }
    if (globalThis.__EXPO_RSC_CACHE__.has(os_1.default)) {
        console.log('[RSC]: REUSE:', globalThis.__EXPO_RSC_CACHE__.get(os_1.default));
        return globalThis.__EXPO_RSC_CACHE__.get(os_1.default);
    }
    const serverCache = (0, react_1.cache)(() => []);
    globalThis.__EXPO_RSC_CACHE__.set(os_1.default, serverCache);
    return serverCache;
}
const getRenderContextHolder = getGlobalCacheForPlatform();
/**
 * This is an internal function and not for public use.
 */
const setRenderContext = (renderContext) => {
    const holder = getRenderContextHolder();
    holder[0] = renderContext;
};
exports.setRenderContext = setRenderContext;
function rerender(input, searchParams) {
    const holder = getRenderContextHolder();
    if (!holder[0]) {
        throw new Error('[Bug] No render context found');
    }
    holder[0].rerender(input, searchParams);
}
exports.rerender = rerender;
function getContext() {
    const holder = getRenderContextHolder();
    if (!holder[0]) {
        throw new Error('[Bug] No render context found');
    }
    return holder[0].context;
}
exports.getContext = getContext;
//# sourceMappingURL=server.js.map
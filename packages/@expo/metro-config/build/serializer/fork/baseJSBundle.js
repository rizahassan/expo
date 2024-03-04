"use strict";
/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork with bundle splitting and better source map support.
 * https://github.com/facebook/metro/blob/bbdd7d7c5e6e0feb50a9967ffae1f723c1d7c4e8/packages/metro/src/DeltaBundler/Serializers/baseJSBundle.js#L1
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseJSBundleWithDependencies = exports.baseJSBundle = exports.getBaseUrlOption = exports.getSplitChunksOption = exports.getPlatformOption = void 0;
var jsc_safe_url_1 = require("jsc-safe-url");
var CountingSet_1 = __importDefault(require("metro/src/lib/CountingSet"));
var countLines_1 = __importDefault(require("metro/src/lib/countLines"));
var getAppendScripts_1 = __importDefault(require("metro/src/lib/getAppendScripts"));
var processModules_1 = require("./processModules");
function getPlatformOption(graph, options) {
    var _a, _b;
    if (((_a = graph.transformOptions) === null || _a === void 0 ? void 0 : _a.platform) != null) {
        return graph.transformOptions.platform;
    }
    if (!options.sourceUrl) {
        return null;
    }
    var sourceUrl = (0, jsc_safe_url_1.isJscSafeUrl)(options.sourceUrl)
        ? (0, jsc_safe_url_1.toNormalUrl)(options.sourceUrl)
        : options.sourceUrl;
    var url = new URL(sourceUrl, 'https://expo.dev');
    return (_b = url.searchParams.get('platform')) !== null && _b !== void 0 ? _b : null;
}
exports.getPlatformOption = getPlatformOption;
function getSplitChunksOption(graph, options) {
    // Only enable when the entire bundle is being split, and only run on web.
    return !options.includeAsyncPaths && getPlatformOption(graph, options) === 'web';
}
exports.getSplitChunksOption = getSplitChunksOption;
function getBaseUrlOption(graph, options) {
    var _a, _b;
    var baseUrl = (_b = (_a = graph.transformOptions) === null || _a === void 0 ? void 0 : _a.customTransformOptions) === null || _b === void 0 ? void 0 : _b.baseUrl;
    if (typeof baseUrl === 'string') {
        // This tells us that the value came over a URL and may be encoded.
        var mayBeEncoded = options.serializerOptions == null;
        var option = mayBeEncoded ? decodeURIComponent(baseUrl) : baseUrl;
        return option.replace(/\/+$/, '') + '/';
    }
    return '/';
}
exports.getBaseUrlOption = getBaseUrlOption;
function baseJSBundle(entryPoint, preModules, graph, options) {
    var _a;
    var platform = getPlatformOption(graph, options);
    if (platform == null) {
        throw new Error('platform could not be determined for Metro bundle');
    }
    return baseJSBundleWithDependencies(entryPoint, preModules, __spreadArray([], __read(graph.dependencies.values()), false), __assign(__assign({}, options), { baseUrl: getBaseUrlOption(graph, options), splitChunks: getSplitChunksOption(graph, options), platform: platform, skipWrapping: !!((_a = options.serializerOptions) === null || _a === void 0 ? void 0 : _a.skipWrapping), computedAsyncModulePaths: null }));
}
exports.baseJSBundle = baseJSBundle;
function baseJSBundleWithDependencies(entryPoint, preModules, dependencies, options) {
    var e_1, _a;
    var _b;
    try {
        for (var dependencies_1 = __values(dependencies), dependencies_1_1 = dependencies_1.next(); !dependencies_1_1.done; dependencies_1_1 = dependencies_1.next()) {
            var module_1 = dependencies_1_1.value;
            options.createModuleId(module_1.path);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (dependencies_1_1 && !dependencies_1_1.done && (_a = dependencies_1.return)) _a.call(dependencies_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var processModulesOptions = {
        filter: options.processModuleFilter,
        createModuleId: options.createModuleId,
        dev: options.dev,
        includeAsyncPaths: options.includeAsyncPaths,
        projectRoot: options.projectRoot,
        serverRoot: options.serverRoot,
        sourceUrl: options.sourceUrl,
        platform: options.platform,
        baseUrl: options.baseUrl,
        splitChunks: options.splitChunks,
        skipWrapping: options.skipWrapping,
        computedAsyncModulePaths: options.computedAsyncModulePaths,
    };
    // Do not prepend polyfills or the require runtime when only modules are requested
    if (options.modulesOnly) {
        preModules = [];
    }
    var preCode = (0, processModules_1.processModules)(preModules, processModulesOptions)
        .map(function (_a) {
        var _b = __read(_a, 2), code = _b[1];
        return code.src;
    })
        .join('\n');
    var modules = __spreadArray([], __read(dependencies), false).sort(function (a, b) {
        return options.createModuleId(a.path) - options.createModuleId(b.path);
    });
    var sourceMapUrl = ((_b = options.serializerOptions) === null || _b === void 0 ? void 0 : _b.includeSourceMaps) === false ? undefined : options.sourceMapUrl;
    var modulesWithAnnotations = (0, getAppendScripts_1.default)(entryPoint, __spreadArray(__spreadArray([], __read(preModules), false), __read(modules), false), {
        asyncRequireModulePath: options.asyncRequireModulePath,
        createModuleId: options.createModuleId,
        getRunModuleStatement: options.getRunModuleStatement,
        inlineSourceMap: options.inlineSourceMap,
        runBeforeMainModule: options.runBeforeMainModule,
        runModule: options.runModule,
        shouldAddToIgnoreList: options.shouldAddToIgnoreList,
        sourceMapUrl: sourceMapUrl,
        // This directive doesn't make a lot of sense in the context of a large single bundle that represent
        // multiple files. It's usually used for things like TypeScript where you want the file name to appear with a
        // different extension. Since it's unclear to me (Bacon) how it is used on native, I'm only disabling in web.
        sourceUrl: options.platform === 'web' ? undefined : options.sourceUrl,
    });
    // If the `debugId` annotation is available and we aren't inlining the source map, add it to the bundle.
    // NOTE: We may want to move this assertion up further.
    var hasExternalMaps = !options.inlineSourceMap && !!sourceMapUrl;
    if (hasExternalMaps && options.debugId != null) {
        var code = "//# debugId=".concat(options.debugId);
        modulesWithAnnotations.push({
            path: 'debug-id-annotation',
            dependencies: new Map(),
            getSource: function () { return Buffer.from(''); },
            inverseDependencies: new CountingSet_1.default(),
            output: [
                {
                    type: 'js/script/virtual',
                    data: {
                        code: code,
                        lineCount: (0, countLines_1.default)(code),
                        map: [],
                    },
                },
            ],
        });
    }
    var postCode = (0, processModules_1.processModules)(modulesWithAnnotations, processModulesOptions)
        .map(function (_a) {
        var _b = __read(_a, 2), code = _b[1];
        return code.src;
    })
        .join('\n');
    var mods = (0, processModules_1.processModules)(__spreadArray([], __read(dependencies), false), processModulesOptions).map(function (_a) {
        var _b = __read(_a, 2), module = _b[0], code = _b[1];
        return [
            options.createModuleId(module.path),
            code,
        ];
    });
    return {
        pre: preCode,
        post: postCode,
        modules: mods.map(function (_a) {
            var _b = __read(_a, 2), id = _b[0], code = _b[1];
            return [
                id,
                typeof code === 'number' ? code : code.src,
            ];
        }),
    };
}
exports.baseJSBundleWithDependencies = baseJSBundleWithDependencies;
//# sourceMappingURL=baseJSBundle.js.map
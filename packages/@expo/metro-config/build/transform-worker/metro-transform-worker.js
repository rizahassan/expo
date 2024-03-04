"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheKey = exports.transform = void 0;
/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the Metro transformer worker, but with additional transforms moved to `babel-preset-expo` and modifications made for web support.
 * https://github.com/facebook/metro/blob/412771475c540b6f85d75d9dcd5a39a6e0753582/packages/metro-transform-worker/src/index.js#L1
 */
var core_1 = require("@babel/core");
var generator_1 = __importDefault(require("@babel/generator"));
var babylon = __importStar(require("@babel/parser"));
var types = __importStar(require("@babel/types"));
var JsFileWrapping_1 = __importDefault(require("metro/src/ModuleGraph/worker/JsFileWrapping"));
var collectDependencies_1 = __importStar(require("metro/src/ModuleGraph/worker/collectDependencies"));
var generateImportNames_1 = __importDefault(require("metro/src/ModuleGraph/worker/generateImportNames"));
var countLines_1 = __importDefault(require("metro/src/lib/countLines"));
var metro_cache_1 = require("metro-cache");
var metro_cache_key_1 = __importDefault(require("metro-cache-key"));
var metro_source_map_1 = require("metro-source-map");
var metro_transform_plugins_1 = __importDefault(require("metro-transform-plugins"));
var getMinifier_1 = __importDefault(require("metro-transform-worker/src/utils/getMinifier"));
var node_assert_1 = __importDefault(require("node:assert"));
var assetTransformer = __importStar(require("./asset-transformer"));
var resolveOptions_1 = require("./resolveOptions");
// asserts non-null
function nullthrows(x, message) {
    (0, node_assert_1.default)(x != null, message);
    return x;
}
function getDynamicDepsBehavior(inPackages, filename) {
    switch (inPackages) {
        case 'reject':
            return 'reject';
        case 'throwAtRuntime':
            return /(?:^|[/\\])node_modules[/\\]/.test(filename) ? inPackages : 'reject';
        default:
            throw new Error("invalid value for dynamic deps behavior: `".concat(inPackages, "`"));
    }
}
var minifyCode = function (config, projectRoot, filename, code, source, map, reserved) {
    if (reserved === void 0) { reserved = []; }
    return __awaiter(void 0, void 0, void 0, function () {
        var sourceMap, minify, minified, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sourceMap = (0, metro_source_map_1.fromRawMappings)([
                        {
                            code: code,
                            source: source,
                            map: map,
                            // functionMap is overridden by the serializer
                            functionMap: null,
                            path: filename,
                            // isIgnored is overriden by the serializer
                            isIgnored: false,
                        },
                    ]).toMap(undefined, {});
                    minify = (0, getMinifier_1.default)(config.minifierPath);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, minify({
                            code: code,
                            map: sourceMap,
                            filename: filename,
                            reserved: reserved,
                            config: config.minifierConfig,
                        })];
                case 2:
                    minified = _a.sent();
                    return [2 /*return*/, {
                            code: minified.code,
                            map: minified.map ? (0, metro_source_map_1.toBabelSegments)(minified.map).map(metro_source_map_1.toSegmentTuple) : [],
                        }];
                case 3:
                    error_1 = _a.sent();
                    if (error_1.constructor.name === 'JS_Parse_Error') {
                        throw new Error("".concat(error_1.message, " in file ").concat(filename, " at ").concat(error_1.line, ":").concat(error_1.col));
                    }
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
};
var disabledDependencyTransformer = {
    transformSyncRequire: function () { },
    transformImportCall: function () { },
    transformPrefetch: function () { },
    transformIllegalDynamicRequire: function () { },
};
var InvalidRequireCallError = /** @class */ (function (_super) {
    __extends(InvalidRequireCallError, _super);
    function InvalidRequireCallError(innerError, filename) {
        var _this = _super.call(this, "".concat(filename, ":").concat(innerError.message)) || this;
        _this.innerError = innerError;
        _this.filename = filename;
        return _this;
    }
    return InvalidRequireCallError;
}(Error));
function transformJS(file, _a) {
    var _b;
    var config = _a.config, options = _a.options, projectRoot = _a.projectRoot;
    return __awaiter(this, void 0, void 0, function () {
        var ast, _c, importDefault, importAll, directives, plugins, babelPluginOpts, clearProgramScopePlugin, dependencyMapName, dependencies, wrappedAst, opts, reserved, minify, result, map, code, output;
        var _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    ast = (_b = file.ast) !== null && _b !== void 0 ? _b : babylon.parse(file.code, { sourceType: 'unambiguous' });
                    _c = (0, generateImportNames_1.default)(ast), importDefault = _c.importDefault, importAll = _c.importAll;
                    directives = ast.program.directives;
                    if (ast.program.sourceType === 'module' &&
                        directives != null &&
                        directives.findIndex(function (d) { return d.value.value === 'use strict'; }) === -1) {
                        directives.push(types.directive(types.directiveLiteral('use strict')));
                    }
                    plugins = [];
                    babelPluginOpts = __assign(__assign({}, options), { inlineableCalls: [importDefault, importAll], importDefault: importDefault, importAll: importAll });
                    // NOTE(EvanBacon): This is effectively a replacement for the `@babel/plugin-transform-modules-commonjs`
                    // plugin that's running in `@@react-native/babel-preset`, but with shared names for inlining requires.
                    if (options.experimentalImportSupport === true) {
                        plugins.push([metro_transform_plugins_1.default.importExportPlugin, babelPluginOpts]);
                    }
                    // NOTE(EvanBacon): This can basically never be safely enabled because it doesn't respect side-effects and
                    // has no ability to respect side-effects because the transformer hasn't collected all dependencies yet.
                    if (options.inlineRequires) {
                        plugins.push([
                            metro_transform_plugins_1.default.inlineRequiresPlugin,
                            __assign(__assign({}, babelPluginOpts), { ignoredRequires: options.nonInlinedRequires }),
                        ]);
                    }
                    // NOTE(EvanBacon): We apply this conditionally in `babel-preset-expo` with other AST transforms.
                    // plugins.push([metroTransformPlugins.inlinePlugin, babelPluginOpts]);
                    // TODO: This MUST be run even though no plugins are added, otherwise the babel runtime generators are broken.
                    if (plugins.length) {
                        ast = nullthrows(
                        // @ts-expect-error
                        (0, core_1.transformFromAstSync)(ast, '', {
                            ast: true,
                            babelrc: false,
                            code: false,
                            configFile: false,
                            comments: true,
                            filename: file.filename,
                            plugins: plugins,
                            sourceMaps: false,
                            // NOTE(kitten): This was done to wipe the paths/scope caches, which the `constantFoldingPlugin` needs to work,
                            // but has been replaced with `programPath.scope.crawl()`.
                            // Old Note from Metro:
                            // > Not-Cloning the input AST here should be safe because other code paths above this call
                            // > are mutating the AST as well and no code is depending on the original AST.
                            // > However, switching the flag to false caused issues with ES Modules if `experimentalImportSupport` isn't used https://github.com/facebook/metro/issues/641
                            // > either because one of the plugins is doing something funky or Babel messes up some caches.
                            // > Make sure to test the above mentioned case before flipping the flag back to false.
                            cloneInputAst: false,
                        }).ast);
                    }
                    if (!options.dev) {
                        clearProgramScopePlugin = {
                            visitor: {
                                Program: {
                                    enter: function (path) {
                                        path.scope.crawl();
                                    },
                                },
                            },
                        };
                        // Run the constant folding plugin in its own pass, avoiding race conditions
                        // with other plugins that have exit() visitors on Program (e.g. the ESM
                        // transform).
                        ast = nullthrows(
                        // @ts-expect-error
                        (0, core_1.transformFromAstSync)(ast, '', {
                            ast: true,
                            babelrc: false,
                            code: false,
                            configFile: false,
                            comments: true,
                            filename: file.filename,
                            plugins: [
                                clearProgramScopePlugin,
                                [metro_transform_plugins_1.default.constantFoldingPlugin, babelPluginOpts],
                            ],
                            sourceMaps: false,
                            // NOTE(kitten): In Metro, this is also false, but only works because the prior run of `transformFromAstSync` was always
                            // running with `cloneInputAst: true`.
                            // This isn't needed anymore since `clearProgramScopePlugin` re-crawls the AST’s scope instead.
                            cloneInputAst: false,
                        }).ast);
                    }
                    dependencyMapName = '';
                    // If the module to transform is a script (meaning that is not part of the
                    // dependency graph and it code will just be prepended to the bundle modules),
                    // we need to wrap it differently than a commonJS module (also, scripts do
                    // not have dependencies).
                    if (file.type === 'js/script') {
                        dependencies = [];
                        wrappedAst = JsFileWrapping_1.default.wrapPolyfill(ast);
                    }
                    else {
                        try {
                            opts = {
                                asyncRequireModulePath: config.asyncRequireModulePath,
                                dependencyTransformer: config.unstable_disableModuleWrapping === true
                                    ? disabledDependencyTransformer
                                    : undefined,
                                dynamicRequires: getDynamicDepsBehavior(config.dynamicDepsInPackages, file.filename),
                                inlineableCalls: [importDefault, importAll],
                                keepRequireNames: options.dev,
                                allowOptionalDependencies: config.allowOptionalDependencies,
                                dependencyMapName: config.unstable_dependencyMapReservedName,
                                unstable_allowRequireContext: config.unstable_allowRequireContext,
                            };
                            (_d = (0, collectDependencies_1.default)(ast, opts), ast = _d.ast, dependencies = _d.dependencies, dependencyMapName = _d.dependencyMapName);
                        }
                        catch (error) {
                            if (error instanceof collectDependencies_1.InvalidRequireCallError) {
                                throw new InvalidRequireCallError(error, file.filename);
                            }
                            throw error;
                        }
                        if (config.unstable_disableModuleWrapping === true) {
                            wrappedAst = ast;
                        }
                        else {
                            // TODO: Replace this with a cheaper transform that doesn't require AST.
                            (wrappedAst = JsFileWrapping_1.default.wrapModule(ast, importDefault, importAll, dependencyMapName, config.globalPrefix).ast);
                        }
                    }
                    reserved = [];
                    if (config.unstable_dependencyMapReservedName != null) {
                        reserved.push(config.unstable_dependencyMapReservedName);
                    }
                    minify = (0, resolveOptions_1.shouldMinify)(options);
                    if (minify &&
                        file.inputFileSize <= config.optimizationSizeLimit &&
                        !config.unstable_disableNormalizePseudoGlobals) {
                        // NOTE(EvanBacon): Simply pushing this function will mutate the AST, so it must run before the `generate` step!!
                        reserved.push.apply(reserved, __spreadArray([], __read(metro_transform_plugins_1.default.normalizePseudoGlobals(wrappedAst, {
                            reservedNames: reserved,
                        })), false));
                    }
                    result = (0, generator_1.default)(wrappedAst, {
                        comments: true,
                        compact: config.unstable_compactOutput,
                        filename: file.filename,
                        retainLines: false,
                        sourceFileName: file.filename,
                        sourceMaps: true,
                    }, file.code);
                    map = result.rawMappings ? result.rawMappings.map(metro_source_map_1.toSegmentTuple) : [];
                    code = result.code;
                    if (!minify) return [3 /*break*/, 2];
                    return [4 /*yield*/, minifyCode(config, projectRoot, file.filename, result.code, file.code, map, reserved)];
                case 1:
                    (_e = _f.sent(), map = _e.map, code = _e.code);
                    _f.label = 2;
                case 2:
                    output = [
                        {
                            data: {
                                code: code,
                                lineCount: (0, countLines_1.default)(code),
                                map: map,
                                functionMap: file.functionMap,
                            },
                            type: file.type,
                        },
                    ];
                    return [2 /*return*/, {
                            dependencies: dependencies,
                            output: output,
                        }];
            }
        });
    });
}
/** Transforms an asset file. */
function transformAsset(file, context) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, assetRegistryPath, assetPlugins, result, jsFile;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = context.config, assetRegistryPath = _a.assetRegistryPath, assetPlugins = _a.assetPlugins;
                    return [4 /*yield*/, assetTransformer.transform(getBabelTransformArgs(file, context), assetRegistryPath, assetPlugins)];
                case 1:
                    result = _b.sent();
                    jsFile = __assign(__assign({}, file), { type: 'js/module/asset', ast: result.ast, functionMap: null });
                    return [2 /*return*/, transformJS(jsFile, context)];
            }
        });
    });
}
/**
 * Transforms a JavaScript file with Babel before processing the file with
 * the generic JavaScript transformation.
 */
function transformJSWithBabel(file, context) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function () {
        var babelTransformerPath, transformer, transformResult, jsFile;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    babelTransformerPath = context.config.babelTransformerPath;
                    transformer = require(babelTransformerPath);
                    return [4 /*yield*/, transformer.transform(
                        // functionMapBabelPlugin populates metadata.metro.functionMap
                        getBabelTransformArgs(file, context, [metro_source_map_1.functionMapBabelPlugin]))];
                case 1:
                    transformResult = _e.sent();
                    jsFile = __assign(__assign({}, file), { ast: transformResult.ast, functionMap: (_d = (_c = (_b = (_a = transformResult.metadata) === null || _a === void 0 ? void 0 : _a.metro) === null || _b === void 0 ? void 0 : _b.functionMap) !== null && _c !== void 0 ? _c : 
                        // Fallback to deprecated explicitly-generated `functionMap`
                        transformResult.functionMap) !== null && _d !== void 0 ? _d : null });
                    return [4 /*yield*/, transformJS(jsFile, context)];
                case 2: return [2 /*return*/, _e.sent()];
            }
        });
    });
}
function transformJSON(file, _a) {
    var options = _a.options, config = _a.config, projectRoot = _a.projectRoot;
    return __awaiter(this, void 0, void 0, function () {
        var code, map, minify, jsType, output;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    code = config.unstable_disableModuleWrapping === true
                        ? JsFileWrapping_1.default.jsonToCommonJS(file.code)
                        : JsFileWrapping_1.default.wrapJson(file.code, config.globalPrefix);
                    map = [];
                    minify = (0, resolveOptions_1.shouldMinify)(options);
                    if (!minify) return [3 /*break*/, 2];
                    return [4 /*yield*/, minifyCode(config, projectRoot, file.filename, code, file.code, map)];
                case 1:
                    (_b = _c.sent(), map = _b.map, code = _b.code);
                    _c.label = 2;
                case 2:
                    if (file.type === 'asset') {
                        jsType = 'js/module/asset';
                    }
                    else if (file.type === 'script') {
                        jsType = 'js/script';
                    }
                    else {
                        jsType = 'js/module';
                    }
                    output = [
                        {
                            data: { code: code, lineCount: (0, countLines_1.default)(code), map: map, functionMap: null },
                            type: jsType,
                        },
                    ];
                    return [2 /*return*/, {
                            dependencies: [],
                            output: output,
                        }];
            }
        });
    });
}
function getBabelTransformArgs(file, _a, plugins) {
    var _b;
    var options = _a.options, config = _a.config, projectRoot = _a.projectRoot;
    if (plugins === void 0) { plugins = []; }
    var _ = options.inlineRequires, babelTransformerOptions = __rest(options, ["inlineRequires"]);
    return {
        filename: file.filename,
        options: __assign(__assign({}, babelTransformerOptions), { enableBabelRCLookup: config.enableBabelRCLookup, enableBabelRuntime: config.enableBabelRuntime, hermesParser: config.hermesParser, projectRoot: projectRoot, publicPath: config.publicPath, globalPrefix: config.globalPrefix, platform: (_b = babelTransformerOptions.platform) !== null && _b !== void 0 ? _b : null }),
        plugins: plugins,
        src: file.code,
    };
}
function transform(config, projectRoot, filename, data, options) {
    return __awaiter(this, void 0, void 0, function () {
        var context, sourceCode, unstable_dependencyMapReservedName, position, jsonFile, file_1, file;
        return __generator(this, function (_a) {
            context = {
                config: config,
                projectRoot: projectRoot,
                options: options,
            };
            sourceCode = data.toString('utf8');
            unstable_dependencyMapReservedName = config.unstable_dependencyMapReservedName;
            if (unstable_dependencyMapReservedName != null) {
                position = sourceCode.indexOf(unstable_dependencyMapReservedName);
                if (position > -1) {
                    throw new SyntaxError('Source code contains the reserved string `' +
                        unstable_dependencyMapReservedName +
                        '` at character offset ' +
                        position);
                }
            }
            if (filename.endsWith('.json')) {
                jsonFile = {
                    filename: filename,
                    inputFileSize: data.length,
                    code: sourceCode,
                    type: options.type,
                };
                return [2 /*return*/, transformJSON(jsonFile, context)];
            }
            if (options.type === 'asset') {
                file_1 = {
                    filename: filename,
                    inputFileSize: data.length,
                    code: sourceCode,
                    type: options.type,
                };
                return [2 /*return*/, transformAsset(file_1, context)];
            }
            file = {
                filename: filename,
                inputFileSize: data.length,
                code: sourceCode,
                type: options.type === 'script' ? 'js/script' : 'js/module',
                functionMap: null,
            };
            return [2 /*return*/, transformJSWithBabel(file, context)];
        });
    });
}
exports.transform = transform;
function getCacheKey(config) {
    var babelTransformerPath = config.babelTransformerPath, minifierPath = config.minifierPath, remainingConfig = __rest(config, ["babelTransformerPath", "minifierPath"]);
    var filesKey = (0, metro_cache_key_1.default)(__spreadArray([
        require.resolve(babelTransformerPath),
        require.resolve(minifierPath),
        require.resolve('metro-transform-worker/src/utils/getMinifier'),
        require.resolve('./asset-transformer'),
        require.resolve('metro/src/ModuleGraph/worker/generateImportNames'),
        require.resolve('metro/src/ModuleGraph/worker/JsFileWrapping')
    ], __read(metro_transform_plugins_1.default.getTransformPluginCacheKeyFiles()), false));
    var babelTransformer = require(babelTransformerPath);
    return [
        filesKey,
        (0, metro_cache_1.stableHash)(remainingConfig).toString('hex'),
        babelTransformer.getCacheKey ? babelTransformer.getCacheKey() : '',
    ].join('$');
}
exports.getCacheKey = getCacheKey;
//# sourceMappingURL=metro-transform-worker.js.map
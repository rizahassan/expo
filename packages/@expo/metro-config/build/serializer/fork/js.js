"use strict";
/**
 * Copyright © 2022 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the metro helper, but with bundle splitting support.
 * https://github.com/facebook/metro/blob/bbdd7d7c5e6e0feb50a9967ffae1f723c1d7c4e8/packages/metro/src/DeltaBundler/Serializers/helpers/js.js#L1
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isJsOutput = exports.isJsModule = exports.getJsOutput = exports.getModuleParams = exports.wrapModule = void 0;
var assert_1 = __importDefault(require("assert"));
var jsc_safe_url_1 = __importDefault(require("jsc-safe-url"));
var metro_transform_plugins_1 = require("metro-transform-plugins");
var path_1 = __importDefault(require("path"));
function wrapModule(module, options) {
    var output = getJsOutput(module);
    if (output.type.startsWith('js/script')) {
        return { src: output.data.code, paths: {} };
    }
    var _a = getModuleParams(module, options), params = _a.params, paths = _a.paths;
    var src = output.data.code;
    if (!options.skipWrapping) {
        src = metro_transform_plugins_1.addParamsToDefineCall.apply(void 0, __spreadArray([output.data.code], __read(params), false));
    }
    return { src: src, paths: paths };
}
exports.wrapModule = wrapModule;
function getModuleParams(module, options) {
    var moduleId = options.createModuleId(module.path);
    var paths = {};
    var hasPaths = false;
    var dependencyMapArray = Array.from(module.dependencies.values()).map(function (dependency) {
        var id = options.createModuleId(dependency.absolutePath);
        if (
        // NOTE(EvanBacon): Disabled this to ensure that paths are provided even when the entire bundle
        // is created. This is required for production bundle splitting.
        // options.includeAsyncPaths &&
        dependency.data.data.asyncType != null) {
            if (options.includeAsyncPaths) {
                if (options.sourceUrl) {
                    hasPaths = true;
                    // TODO: Only include path if the target is not in the bundle
                    // Construct a server-relative URL for the split bundle, propagating
                    // most parameters from the main bundle's URL.
                    var searchParams = new URL(jsc_safe_url_1.default.toNormalUrl(options.sourceUrl)).searchParams;
                    searchParams.set('modulesOnly', 'true');
                    searchParams.set('runModule', 'false');
                    var bundlePath = path_1.default.relative(options.serverRoot, dependency.absolutePath);
                    paths[id] =
                        '/' +
                            path_1.default.join(path_1.default.dirname(bundlePath), 
                            // Strip the file extension
                            path_1.default.basename(bundlePath, path_1.default.extname(bundlePath))) +
                            '.bundle?' +
                            searchParams.toString();
                }
            }
            else if (options.splitChunks && options.computedAsyncModulePaths != null) {
                hasPaths = true;
                // A template string that we'll match and replace later when we know the content hash for a given path.
                paths[id] = options.computedAsyncModulePaths[dependency.absolutePath];
            }
        }
        return id;
    });
    var params = [
        moduleId,
        hasPaths
            ? __assign(__assign({}, dependencyMapArray), { paths: paths }) : dependencyMapArray,
    ];
    if (options.dev) {
        // Add the relative path of the module to make debugging easier.
        // This is mapped to `module.verboseName` in `require.js`.
        params.push(path_1.default.relative(options.projectRoot, module.path));
    }
    return { params: params, paths: paths };
}
exports.getModuleParams = getModuleParams;
function getJsOutput(module) {
    var _a, _b;
    var jsModules = module.output.filter(function (_a) {
        var type = _a.type;
        return type.startsWith('js/');
    });
    (0, assert_1.default)(jsModules.length === 1, "Modules must have exactly one JS output, but ".concat((_a = module.path) !== null && _a !== void 0 ? _a : 'unknown module', " has ").concat(jsModules.length, " JS outputs."));
    var jsOutput = jsModules[0];
    (0, assert_1.default)(Number.isFinite(jsOutput.data.lineCount), "JS output must populate lineCount, but ".concat((_b = module.path) !== null && _b !== void 0 ? _b : 'unknown module', " has ").concat(jsOutput.type, " output with lineCount '").concat(jsOutput.data.lineCount, "'"));
    return jsOutput;
}
exports.getJsOutput = getJsOutput;
function isJsModule(module) {
    return module.output.filter(isJsOutput).length > 0;
}
exports.isJsModule = isJsModule;
function isJsOutput(output) {
    return output.type.startsWith('js/');
}
exports.isJsOutput = isJsOutput;
//# sourceMappingURL=js.js.map
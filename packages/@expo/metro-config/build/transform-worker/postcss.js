"use strict";
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
exports.getPostcssConfigHash = exports.resolvePostcssConfig = exports.pluginFactory = exports.transformPostCssModule = void 0;
/**
 * Copyright © 2023 650 Industries.
 * Copyright JS Foundation and other contributors
 *
 * https://github.com/webpack-contrib/postcss-loader/
 */
var json_file_1 = __importDefault(require("@expo/json-file"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var resolve_from_1 = __importDefault(require("resolve-from"));
var require_1 = require("./utils/require");
var CONFIG_FILE_NAME = 'postcss.config';
var debug = require('debug')('expo:metro:transformer:postcss');
function transformPostCssModule(projectRoot, _a) {
    var src = _a.src, filename = _a.filename;
    return __awaiter(this, void 0, void 0, function () {
        var inputConfig;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    inputConfig = resolvePostcssConfig(projectRoot);
                    if (!inputConfig) {
                        return [2 /*return*/, { src: src, hasPostcss: false }];
                    }
                    _b = {};
                    return [4 /*yield*/, processWithPostcssInputConfigAsync(projectRoot, {
                            inputConfig: inputConfig,
                            src: src,
                            filename: filename,
                        })];
                case 1: return [2 /*return*/, (_b.src = _c.sent(),
                        _b.hasPostcss = true,
                        _b)];
            }
        });
    });
}
exports.transformPostCssModule = transformPostCssModule;
function processWithPostcssInputConfigAsync(projectRoot, _a) {
    var src = _a.src, filename = _a.filename, inputConfig = _a.inputConfig;
    return __awaiter(this, void 0, void 0, function () {
        var _b, plugins, processOptions, postcss, processor, content;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, parsePostcssConfigAsync(projectRoot, {
                        config: inputConfig,
                        resourcePath: filename,
                    })];
                case 1:
                    _b = _c.sent(), plugins = _b.plugins, processOptions = _b.processOptions;
                    debug('options:', processOptions);
                    debug('plugins:', plugins);
                    postcss = require('postcss');
                    processor = postcss.default(plugins);
                    return [4 /*yield*/, processor.process(src, processOptions)];
                case 2:
                    content = (_c.sent()).content;
                    return [2 /*return*/, content];
            }
        });
    });
}
function parsePostcssConfigAsync(projectRoot, _a) {
    var _b, _c, _d;
    var file = _a.resourcePath, _e = _a.config, _f = _e === void 0 ? {} : _e, inputPlugins = _f.plugins, map = _f.map, parser = _f.parser, stringifier = _f.stringifier, syntax = _f.syntax, config = __rest(_f, ["plugins", "map", "parser", "stringifier", "syntax"]);
    return __awaiter(this, void 0, void 0, function () {
        var factory, plugins, processOptions, _g, error_1, _h, error_2, _j, error_3;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    factory = pluginFactory();
                    factory(inputPlugins);
                    plugins = __spreadArray([], __read(factory()), false).map(function (item) {
                        var _a = __read(item, 2), plugin = _a[0], options = _a[1];
                        if (typeof plugin === 'string') {
                            return loadPlugin(projectRoot, plugin, options, file);
                        }
                        return plugin;
                    });
                    if (config.from) {
                        config.from = path_1.default.resolve(projectRoot, config.from);
                    }
                    if (config.to) {
                        config.to = path_1.default.resolve(projectRoot, config.to);
                    }
                    processOptions = {
                        from: file,
                        to: file,
                        map: false,
                    };
                    if (!(typeof parser === 'string')) return [3 /*break*/, 4];
                    _k.label = 1;
                case 1:
                    _k.trys.push([1, 3, , 4]);
                    _g = processOptions;
                    return [4 /*yield*/, (0, require_1.tryRequireThenImport)((_b = resolve_from_1.default.silent(projectRoot, parser)) !== null && _b !== void 0 ? _b : parser)];
                case 2:
                    _g.parser = _k.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _k.sent();
                    if (error_1 instanceof Error) {
                        throw new Error("Loading PostCSS \"".concat(parser, "\" parser failed: ").concat(error_1.message, "\n\n(@").concat(file, ")"));
                    }
                    throw error_1;
                case 4:
                    if (!(typeof stringifier === 'string')) return [3 /*break*/, 8];
                    _k.label = 5;
                case 5:
                    _k.trys.push([5, 7, , 8]);
                    _h = processOptions;
                    return [4 /*yield*/, (0, require_1.tryRequireThenImport)((_c = resolve_from_1.default.silent(projectRoot, stringifier)) !== null && _c !== void 0 ? _c : stringifier)];
                case 6:
                    _h.stringifier = _k.sent();
                    return [3 /*break*/, 8];
                case 7:
                    error_2 = _k.sent();
                    if (error_2 instanceof Error) {
                        throw new Error("Loading PostCSS \"".concat(stringifier, "\" stringifier failed: ").concat(error_2.message, "\n\n(@").concat(file, ")"));
                    }
                    throw error_2;
                case 8:
                    if (!(typeof syntax === 'string')) return [3 /*break*/, 12];
                    _k.label = 9;
                case 9:
                    _k.trys.push([9, 11, , 12]);
                    _j = processOptions;
                    return [4 /*yield*/, (0, require_1.tryRequireThenImport)((_d = resolve_from_1.default.silent(projectRoot, syntax)) !== null && _d !== void 0 ? _d : syntax)];
                case 10:
                    _j.syntax = _k.sent();
                    return [3 /*break*/, 12];
                case 11:
                    error_3 = _k.sent();
                    throw new Error("Loading PostCSS \"".concat(syntax, "\" syntax failed: ").concat(error_3.message, "\n\n(@").concat(file, ")"));
                case 12:
                    if (map === true) {
                        // https://github.com/postcss/postcss/blob/master/docs/source-maps.md
                        processOptions.map = { inline: true };
                    }
                    return [2 /*return*/, { plugins: plugins, processOptions: processOptions }];
            }
        });
    });
}
function loadPlugin(projectRoot, plugin, options, file) {
    try {
        debug('load plugin:', plugin);
        // e.g. `tailwindcss`
        var loadedPlugin = require((0, resolve_from_1.default)(projectRoot, plugin));
        if (loadedPlugin.default) {
            loadedPlugin = loadedPlugin.default;
        }
        if (!options || !Object.keys(options).length) {
            return loadedPlugin;
        }
        return loadedPlugin(options);
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error("Loading PostCSS \"".concat(plugin, "\" plugin failed: ").concat(error.message, "\n\n(@").concat(file, ")"));
        }
        throw error;
    }
}
function pluginFactory() {
    var listOfPlugins = new Map();
    return function (plugins) {
        var e_1, _a, e_2, _b;
        if (typeof plugins === 'undefined') {
            return listOfPlugins;
        }
        if (Array.isArray(plugins)) {
            try {
                for (var plugins_1 = __values(plugins), plugins_1_1 = plugins_1.next(); !plugins_1_1.done; plugins_1_1 = plugins_1.next()) {
                    var plugin = plugins_1_1.value;
                    if (Array.isArray(plugin)) {
                        var _c = __read(plugin, 2), name_1 = _c[0], options = _c[1];
                        if (typeof name_1 !== 'string') {
                            throw new Error("PostCSS plugin must be a string, but \"".concat(name_1, "\" was found. Please check your configuration."));
                        }
                        listOfPlugins.set(name_1, options);
                    }
                    else if (plugin && typeof plugin === 'function') {
                        listOfPlugins.set(plugin, undefined);
                    }
                    else if (plugin &&
                        Object.keys(plugin).length === 1 &&
                        (typeof plugin[Object.keys(plugin)[0]] === 'object' ||
                            typeof plugin[Object.keys(plugin)[0]] === 'boolean') &&
                        plugin[Object.keys(plugin)[0]] !== null) {
                        var _d = __read(Object.keys(plugin), 1), name_2 = _d[0];
                        var options = plugin[name_2];
                        if (options === false) {
                            listOfPlugins.delete(name_2);
                        }
                        else {
                            listOfPlugins.set(name_2, options);
                        }
                    }
                    else if (plugin) {
                        listOfPlugins.set(plugin, undefined);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (plugins_1_1 && !plugins_1_1.done && (_a = plugins_1.return)) _a.call(plugins_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        else {
            var objectPlugins = Object.entries(plugins);
            try {
                for (var objectPlugins_1 = __values(objectPlugins), objectPlugins_1_1 = objectPlugins_1.next(); !objectPlugins_1_1.done; objectPlugins_1_1 = objectPlugins_1.next()) {
                    var _e = __read(objectPlugins_1_1.value, 2), name_3 = _e[0], options = _e[1];
                    if (options === false) {
                        listOfPlugins.delete(name_3);
                    }
                    else {
                        listOfPlugins.set(name_3, options);
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (objectPlugins_1_1 && !objectPlugins_1_1.done && (_b = objectPlugins_1.return)) _b.call(objectPlugins_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
        return listOfPlugins;
    };
}
exports.pluginFactory = pluginFactory;
function resolvePostcssConfig(projectRoot) {
    // TODO: Maybe support platform-specific postcss config files in the future.
    var jsConfigPath = path_1.default.join(projectRoot, CONFIG_FILE_NAME + '.js');
    if (fs_1.default.existsSync(jsConfigPath)) {
        debug('load file:', jsConfigPath);
        return (0, require_1.requireUncachedFile)(jsConfigPath);
    }
    var jsonConfigPath = path_1.default.join(projectRoot, CONFIG_FILE_NAME + '.json');
    if (fs_1.default.existsSync(jsonConfigPath)) {
        debug('load file:', jsonConfigPath);
        return json_file_1.default.read(jsonConfigPath, { json5: true });
    }
    return null;
}
exports.resolvePostcssConfig = resolvePostcssConfig;
function getPostcssConfigHash(projectRoot) {
    // TODO: Maybe recurse plugins and add versions to the hash in the future.
    var stableHash = require('metro-cache').stableHash;
    var jsConfigPath = path_1.default.join(projectRoot, CONFIG_FILE_NAME + '.js');
    if (fs_1.default.existsSync(jsConfigPath)) {
        return stableHash(fs_1.default.readFileSync(jsConfigPath, 'utf8')).toString('hex');
    }
    var jsonConfigPath = path_1.default.join(projectRoot, CONFIG_FILE_NAME + '.json');
    if (fs_1.default.existsSync(jsonConfigPath)) {
        return stableHash(fs_1.default.readFileSync(jsonConfigPath, 'utf8')).toString('hex');
    }
    return null;
}
exports.getPostcssConfigHash = getPostcssConfigHash;
//# sourceMappingURL=postcss.js.map
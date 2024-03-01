'use client';
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSkipMeta = exports.SkipMetaProvider = void 0;
// Emulates the document window <meta> tag used for adding skip meta to the document.
// -> meta[name="expo-should-skip"]
const React = __importStar(require("react"));
const SkipMetaContext = React.createContext(null);
function SkipMetaProvider({ children }) {
    const [history, setHistory] = React.useState([]);
    const current = history[history.length - 1];
    return (<SkipMetaContext.Provider value={{
            current,
            push(skip) {
                setHistory((h) => [...h, skip]);
            },
            pop(skip) {
                setHistory((h) => h.slice(0, h.indexOf(skip)));
            },
        }}>
      {children}
    </SkipMetaContext.Provider>);
}
exports.SkipMetaProvider = SkipMetaProvider;
function useSkipMeta() {
    const skipMeta = React.useContext(SkipMetaContext);
    if (!skipMeta) {
        throw new Error('Missing SkipMeta React provider');
    }
    return skipMeta;
}
exports.useSkipMeta = useSkipMeta;
//# sourceMappingURL=SkipContext.js.map
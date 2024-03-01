// import { createElement } from 'react';
// import type { ShouldSkip } from './common.js';
// export const ShouldSkipComponent = ({ shouldSkip }: { shouldSkip: ShouldSkip }) =>
//   createElement('meta', {
//     name: 'expo-should-skip',
//     content: JSON.stringify(shouldSkip),
//   });
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShouldSkipComponent = void 0;
const react_1 = require("react");
const SkipContext_1 = require("./SkipContext");
const ShouldSkipComponent = ({ shouldSkip }) => {
    const { push, pop } = (0, SkipContext_1.useSkipMeta)();
    (0, react_1.useEffect)(() => {
        push(shouldSkip);
        return () => pop(shouldSkip);
    }, [shouldSkip]);
    return null;
};
exports.ShouldSkipComponent = ShouldSkipComponent;
//# sourceMappingURL=should-skip.web.js.map
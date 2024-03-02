"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShouldSkipComponent = void 0;
const react_1 = require("react");
const ShouldSkipComponent = ({ shouldSkip }) => (0, react_1.createElement)('meta', {
    name: 'expo-should-skip',
    content: JSON.stringify(shouldSkip),
});
exports.ShouldSkipComponent = ShouldSkipComponent;
// 'use client';
// import { useEffect } from 'react';
// import { useSkipMeta } from './SkipContext';
// import type { ShouldSkip } from './common';
// export const ShouldSkipComponent = ({ shouldSkip }: { shouldSkip: ShouldSkip }) => {
//   const { push, pop } = useSkipMeta();
//   useEffect(() => {
//     push(shouldSkip);
//     return () => pop(shouldSkip);
//   }, [shouldSkip]);
//   return null;
// };
//# sourceMappingURL=should-skip.web.js.map
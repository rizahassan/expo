import { createElement } from 'react';

import type { ShouldSkip } from './common.js';

export const ShouldSkipComponent = ({ shouldSkip }: { shouldSkip: ShouldSkip }) =>
  createElement('meta', {
    name: 'expo-should-skip',
    content: JSON.stringify(shouldSkip),
  });

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

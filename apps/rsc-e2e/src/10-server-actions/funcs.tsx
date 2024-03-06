'use server';

import { getContext, rerender } from 'expo-router/server';

export const greet = (name: string) => `Hello ${name} from server!`;

// module state on server
// The entire function context is rebuilt each time the function is called (in development) so we have to use globalThis.
// NOTE: This leaks across platforms.
// globalThis.counter ??= 0;
// console.log('[RSC]: [USER SPACE]: ', getContext().counter, new Error().stack);

export const getCounter = () => {
  console.log('RSC -> Render -> getCounter', getContext());
  return getContext().counter;
};

export const increment = () => {
  getContext().counter ??= 0;
  getContext().counter += 1;
  rerender('/');
};

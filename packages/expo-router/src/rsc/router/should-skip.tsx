'use client';

import { useEffect } from 'react';

import { useSkipMeta } from './SkipContext';
import type { ShouldSkip } from './common';

export const ShouldSkipComponent = ({ shouldSkip }: { shouldSkip: ShouldSkip }) => {
  const { push, pop } = useSkipMeta();

  useEffect(() => {
    push(shouldSkip);
    return () => pop(shouldSkip);
  }, [shouldSkip]);

  return null;
};

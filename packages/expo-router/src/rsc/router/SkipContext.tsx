'use client';

// Emulates the document window <meta> tag used for adding skip meta to the document.
// -> meta[name="expo-should-skip"]
import * as React from 'react';

import { ShouldSkip } from './common';

const SkipMetaContext = React.createContext<{
  current: ShouldSkip;
  push: (skip: ShouldSkip) => void;
  pop: (skip: ShouldSkip) => void;
} | null>(null);

export function SkipMetaProvider({ children }: { children: React.ReactElement }) {
  const [history, setHistory] = React.useState<ShouldSkip[]>([]);
  const current = history[history.length - 1];

  return (
    <SkipMetaContext.Provider
      value={{
        current,
        push(skip) {
          setHistory((h) => [...h, skip]);
        },
        pop(skip) {
          setHistory((h) => h.slice(0, h.indexOf(skip)));
        },
      }}>
      {children}
    </SkipMetaContext.Provider>
  );
}

export function useSkipMeta() {
  const skipMeta = React.useContext(SkipMetaContext);
  if (!skipMeta) {
    throw new Error('Missing SkipMeta React provider');
  }
  return skipMeta;
}

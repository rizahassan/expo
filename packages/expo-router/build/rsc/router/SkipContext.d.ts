import * as React from 'react';
import { ShouldSkip } from './common';
export declare function SkipMetaProvider({ children }: {
    children: React.ReactElement;
}): React.JSX.Element;
export declare function useSkipMeta(): {
    current: ShouldSkip;
    push: (skip: ShouldSkip) => void;
    pop: (skip: ShouldSkip) => void;
};
//# sourceMappingURL=SkipContext.d.ts.map
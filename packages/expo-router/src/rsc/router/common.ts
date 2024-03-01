export type RouteProps = {
  path: string;
  searchParams: URLSearchParams;
};

export function getComponentIds(path: string): readonly string[] {
  const pathItems = path.split('/').filter(Boolean);
  const idSet = new Set<string>();
  for (let index = 0; index <= pathItems.length; ++index) {
    const id = [...pathItems.slice(0, index), 'layout'].join('/');
    idSet.add(id);
  }
  idSet.add([...pathItems, 'page'].join('/'));
  return Array.from(idSet);
}

export function getInputString(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error('Path should start with `/`');
  }
  return path.slice(1);
}

export function parseInputString(input: string): string {
  return '/' + input;
}

export const PARAM_KEY_SKIP = 'expo_router_skip';

// It starts with "/" to avoid conflicing with normal component ids.
export const SHOULD_SKIP_ID = '/SHOULD_SKIP';

// The key is componentId
export type ShouldSkip = Record<
  string,
  {
    path?: boolean; // if we compare path
    keys?: string[]; // searchParams keys to compare
  }
>;

export const getSkipList = (
  shouldSkip: ShouldSkip,
  componentIds: readonly string[],
  props: RouteProps,
  cached: Record<string, RouteProps>
): string[] => {
  // // TODO: Implement skip list somehow
  // return [];

  // const ele: any = document.querySelector('meta[name="expo-should-skip"]');
  // if (!ele) {
  //   return [];
  // }
  // const shouldSkip: ShouldSkip = JSON.parse(ele.content);
  return componentIds.filter((id) => {
    const prevProps = cached[id];
    if (!prevProps) {
      return false;
    }
    const shouldCheck = shouldSkip?.[id];
    if (!shouldCheck) {
      return false;
    }
    if (shouldCheck.path && props.path !== prevProps.path) {
      return false;
    }
    if (
      shouldCheck.keys?.some(
        (key) => props.searchParams.get(key) !== prevProps.searchParams.get(key)
      )
    ) {
      return false;
    }
    return true;
  });
};

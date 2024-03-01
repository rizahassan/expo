"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSkipList = exports.SHOULD_SKIP_ID = exports.PARAM_KEY_SKIP = exports.parseInputString = exports.getInputString = exports.getComponentIds = void 0;
function getComponentIds(path) {
    const pathItems = path.split('/').filter(Boolean);
    const idSet = new Set();
    for (let index = 0; index <= pathItems.length; ++index) {
        const id = [...pathItems.slice(0, index), 'layout'].join('/');
        idSet.add(id);
    }
    idSet.add([...pathItems, 'page'].join('/'));
    return Array.from(idSet);
}
exports.getComponentIds = getComponentIds;
function getInputString(path) {
    if (!path.startsWith('/')) {
        throw new Error('Path should start with `/`');
    }
    return path.slice(1);
}
exports.getInputString = getInputString;
function parseInputString(input) {
    return '/' + input;
}
exports.parseInputString = parseInputString;
exports.PARAM_KEY_SKIP = 'expo_router_skip';
// It starts with "/" to avoid conflicing with normal component ids.
exports.SHOULD_SKIP_ID = '/SHOULD_SKIP';
const getSkipList = (shouldSkip, componentIds, props, cached) => {
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
        if (shouldCheck.keys?.some((key) => props.searchParams.get(key) !== prevProps.searchParams.get(key))) {
            return false;
        }
        return true;
    });
};
exports.getSkipList = getSkipList;
//# sourceMappingURL=common.js.map
"use strict";
// import { enableScreens, NativeScreen } from 'react-native-screens';
// enableScreens(false);
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const react_1 = __importDefault(require("react"));
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const exports_1 = require("./exports");
const client_1 = require("./rsc/router/client");
const Try_1 = require("./views/Try");
const WindowLocationContext_1 = require("./rsc/router/WindowLocationContext");
const SkipContext_1 = require("./rsc/router/SkipContext");
// Add root error recovery.
function RootErrorBoundary(props) {
    react_1.default.useEffect(() => {
        function refetchRoute() {
            if (props.error) {
                props.retry();
            }
        }
        // TODO: Only strip when not connected to a dev server.
        if (process.env.NODE_ENV === 'development') {
            globalThis.__WAKU_RSC_RELOAD_LISTENERS__ ||= [];
            const index = globalThis.__WAKU_RSC_RELOAD_LISTENERS__.indexOf(globalThis.__WAKU_REFETCH_ROUTE__);
            if (index !== -1) {
                globalThis.__WAKU_RSC_RELOAD_LISTENERS__.splice(index, 1, refetchRoute);
            }
            else {
                globalThis.__WAKU_RSC_RELOAD_LISTENERS__.unshift(refetchRoute);
            }
            globalThis.__WAKU_REFETCH_ROUTE__ = refetchRoute;
        }
    }, [props.error, props.retry]);
    return <exports_1.ErrorBoundary error={props.error} retry={props.retry}/>;
}
// Must be exported or Fast Refresh won't update the context
function App() {
    return (<WindowLocationContext_1.LocationContext>
      <SkipContext_1.SkipMetaProvider>
        <react_native_safe_area_context_1.SafeAreaProvider initialMetrics={{
            frame: { x: 0, y: 0, width: 0, height: 0 },
            insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}>
          <Try_1.Try catch={RootErrorBoundary}>
            <client_1.Router />
          </Try_1.Try>
        </react_native_safe_area_context_1.SafeAreaProvider>
      </SkipContext_1.SkipMetaProvider>
    </WindowLocationContext_1.LocationContext>);
}
exports.App = App;
//# sourceMappingURL=qualified-entry.js.map
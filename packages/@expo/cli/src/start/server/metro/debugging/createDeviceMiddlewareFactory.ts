import { NetworkResponseMiddleware } from './deviceMiddlewares/NetworkResponse';
import { PageReloadMiddleware } from './deviceMiddlewares/PageReload';
import { VscodeDebuggerGetPossibleBreakpointsMiddleware } from './deviceMiddlewares/VscodeDebuggerGetPossibleBreakpoints';
import { VscodeDebuggerSetBreakpointByUrlMiddleware } from './deviceMiddlewares/VscodeDebuggerSetBreakpointByUrl';
import { VscodeRuntimeCallFunctionOnMiddleware } from './deviceMiddlewares/VscodeRuntimeCallFunctionOn';
import { VscodeRuntimeGetPropertiesMiddleware } from './deviceMiddlewares/VscodeRuntimeGetProperties';
import { type DeviceMiddleware, DebuggerMetadata, DeviceMetadata } from './deviceMiddlewares/types';
import { type MetroBundlerDevServer } from '../MetroBundlerDevServer';

// TODO: use `@react-native/dev-middleware` type
export function createDeviceMiddlewareFactory(
  metroBundler: MetroBundlerDevServer
): (
  deviceInfo: DeviceMetadata
) => Pick<InstanceType<typeof DeviceMiddleware>, 'handleDeviceMessage' | 'handleDebuggerMessage'> {
  return (deviceInfo: DeviceMetadata) => {
    const middlewares = [
      // Generic handlers
      new NetworkResponseMiddleware(deviceInfo),
      new PageReloadMiddleware(deviceInfo, metroBundler),
      // Vscode-specific handlers
      new VscodeDebuggerGetPossibleBreakpointsMiddleware(deviceInfo),
      new VscodeDebuggerSetBreakpointByUrlMiddleware(deviceInfo),
      new VscodeRuntimeGetPropertiesMiddleware(deviceInfo),
      new VscodeRuntimeCallFunctionOnMiddleware(deviceInfo),
    ].filter((middleware) => middleware.isEnabled());

    return {
      handleDeviceMessage(message: any, info: DebuggerMetadata) {
        return middlewares.some(
          (middleware) => middleware.handleDeviceMessage?.(message, info) ?? false
        );
      },
      handleDebuggerMessage(message: any, info: DebuggerMetadata) {
        return middlewares.some(
          (middleware) => middleware.handleDebuggerMessage?.(message, info) ?? false
        );
      },
    };
  };
}

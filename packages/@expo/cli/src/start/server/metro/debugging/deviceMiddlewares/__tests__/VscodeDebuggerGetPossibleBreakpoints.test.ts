import {
  type DebuggerGetPossibleBreakpoints,
  VscodeDebuggerGetPossibleBreakpointsMiddleware,
} from '../VscodeDebuggerGetPossibleBreakpoints';
import { type DebuggerRequest, type DeviceMetadata } from '../types';
import { getDebuggerType } from '../utils';

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  getDebuggerType: jest.fn(() => 'unknown'),
}));

it('does not respond on non-vscode debugger type', () => {
  const device = {} as DeviceMetadata;
  const handler = new VscodeDebuggerGetPossibleBreakpointsMiddleware(device);
  const message: DebuggerRequest<DebuggerGetPossibleBreakpoints> = {
    id: 420,
    method: 'Debugger.getPossibleBreakpoints',
    params: {
      start: { lineNumber: 13, columnNumber: 37, scriptId: '1337' },
    },
  };

  // Should not stop propagation for non-vscode debugger type
  expect(handler.handleDebuggerMessage(message, {})).toBe(false);
});

it('responds to `Debugger.getPossibleBreakpoints` with empty `locations`', () => {
  jest.mocked(getDebuggerType).mockReturnValue('vscode');

  const device = {} as DeviceMetadata;
  const handler = new VscodeDebuggerGetPossibleBreakpointsMiddleware(device);
  const socket = { send: jest.fn() };

  const message: DebuggerRequest<DebuggerGetPossibleBreakpoints> = {
    id: 420,
    method: 'Debugger.getPossibleBreakpoints',
    params: {
      start: { lineNumber: 13, columnNumber: 37, scriptId: '1337' },
    },
  };

  // Should stop propagation when handled
  expect(handler.handleDebuggerMessage(message, { socket })).toBe(true);
  // Should send a response with empty locations
  expect(socket.send).toBeCalledWith(
    JSON.stringify({
      id: 420,
      result: { locations: [] },
    })
  );
});

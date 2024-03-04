import { PageReloadMiddleware } from '../PageReload';
import { type DeviceMetadata } from '../types';

it('broadcasts reload message', () => {
  const device = {} as DeviceMetadata;
  const bundler = { broadcastMessage: jest.fn() };
  const handler = new PageReloadMiddleware(device, bundler as any);
  const socket = { send: jest.fn() };

  expect(
    handler.handleDebuggerMessage(
      {
        id: 420,
        method: 'Page.reload',
        params: { ignoreCache: false },
      },
      { socket }
    )
  ).toBe(true);

  expect(bundler.broadcastMessage).toBeCalledWith('reload');
  expect(socket.send).toBeCalledWith(JSON.stringify({ id: 420 }));
});

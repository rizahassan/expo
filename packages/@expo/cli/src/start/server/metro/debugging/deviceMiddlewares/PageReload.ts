import type { Protocol } from 'devtools-protocol';

import { CdpMessage, DebuggerMetadata, DebuggerRequest, DeviceMiddleware } from './types';
import { MetroBundlerDevServer } from '../../MetroBundlerDevServer';

export class PageReloadMiddleware implements DeviceMiddleware {
  constructor(private readonly metroBundler: MetroBundlerDevServer) {}

  handleDebuggerMessage(message: DebuggerRequest<PageReload>, { socket }: DebuggerMetadata) {
    if (message.method === 'Page.reload') {
      this.metroBundler.broadcastMessage('reload');
      socket.send(JSON.stringify({ id: message.id }));
      return true;
    }

    return false;
  }
}

/** @see https://chromedevtools.github.io/devtools-protocol/1-2/Page/#method-reload */
export type PageReload = CdpMessage<'Page.reload', Protocol.Page.ReloadRequest, never>;

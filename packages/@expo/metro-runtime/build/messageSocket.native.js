"use strict";
/* eslint-env browser */
Object.defineProperty(exports, "__esModule", { value: true });
function createWebSocketConnection(path = '/message') {
    const getDevServer = require('react-native/Libraries/Core/Devtools/getDevServer');
    const devServer = getDevServer();
    if (!devServer.bundleLoadedFromServer) {
        throw new Error('Cannot create devtools websocket connections in embedded environments.');
    }
    const devServerUrl = new URL(devServer.url);
    const serverScheme = devServerUrl.protocol === 'https:' ? 'wss' : 'ws';
    const WebSocket = require('react-native/Libraries/WebSocket/WebSocket');
    return new WebSocket(`${serverScheme}://${devServerUrl.host}${path}`);
}
createWebSocketConnection().onmessage = (message) => {
    const data = JSON.parse(String(message.data));
    switch (data.method) {
        case 'sendDevCommand':
            switch (data.params.name) {
                case 'rsc-reload':
                    //   if (data.params.platform === OS) {
                    globalThis.__WAKU_RSC_RELOAD_LISTENERS__?.forEach((l) => l());
                    //   } else {
                    //     console.warn('FAKE: RSC reload is only supported on web');
                    //   }
                    break;
            }
            break;
        // NOTE: All other cases are handled in the native runtime.
    }
};
//# sourceMappingURL=messageSocket.native.js.map
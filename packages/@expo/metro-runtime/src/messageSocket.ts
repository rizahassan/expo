/* eslint-env browser */

// Setup websocket messages for reloading the page from the command line.
// This is normally setup on the native client.

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const messageSocket = new WebSocket(`${protocol}://${window.location.host}/message`);
messageSocket.onmessage = (message) => {
  const data = JSON.parse(String(message.data));
  switch (data.method) {
    case 'sendDevCommand':
      switch (data.params.name) {
        case 'reload':
          window.location.reload();
          break;
        case 'rsc-reload':
          // if (data.params.platform === 'web') {
          globalThis.__WAKU_RSC_RELOAD_LISTENERS__?.forEach((l) => l());
          // } else {
          //   console.warn('FAKE: RSC reload is only supported on web');
          // }
          break;
      }
      break;
    case 'reload':
      window.location.reload();
      break;
    case 'devMenu':
      // no-op
      break;
  }
};

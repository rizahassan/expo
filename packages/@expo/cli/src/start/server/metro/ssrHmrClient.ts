/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Based on this but with SSR support:
 * https://github.com/facebook/react-native/blob/086714b02b0fb838dee5a66c5bcefe73b53cf3df/Libraries/Utilities/HMRClient.js
 */

const pendingEntryPoints: string[] = [];

type HMRClientType = {
  send: (msg: string) => void;
  isEnabled: () => boolean;
  disable: () => void;
  enable: () => void;
  hasPendingUpdates: () => boolean;
};

let hmrClient: HMRClientType | null = null;
let hmrUnavailableReason: string | null = null;
let currentCompileErrorMessage: string | null = null;
let didConnect: boolean = false;

function assert(foo: any, msg: string): asserts foo {
  if (!foo) throw new Error(msg);
}

/**
 * HMR Client that receives from the server HMR updates and propagates them
 * runtime to reflects those changes.
 */
export const HMRClient = {
  enable() {
    if (hmrUnavailableReason !== null) {
      // If HMR became unavailable while you weren't using it,
      // explain why when you try to turn it on.
      // This is an error (and not a warning) because it is shown
      // in response to a direct user action.
      throw new Error(hmrUnavailableReason);
    }

    assert(hmrClient, 'Expected HMRClient.setup() call at startup.');

    // We use this for internal logging only.
    // It doesn't affect the logic.
    hmrClient.send(JSON.stringify({ type: 'log-opt-in' }));

    // When toggling Fast Refresh on, we might already have some stashed updates.
    // Since they'll get applied now, we'll show a banner.
    const hasUpdates = hmrClient!.hasPendingUpdates();

    if (hasUpdates) {
      //   LoadingView.showMessage('Refreshing...', 'refresh');
    }
    try {
      hmrClient.enable();
    } finally {
      if (hasUpdates) {
        // LoadingView.hide();
      }
    }

    // There could be a compile error while Fast Refresh was off,
    // but we ignored it at the time. Show it now.
    showCompileError();
  },

  disable() {
    assert(hmrClient, 'Expected HMRClient.setup() call at startup.');
    hmrClient.disable();
  },

  registerBundle(requestUrl: string) {
    assert(hmrClient, 'Expected HMRClient.setup() call at startup.');
    pendingEntryPoints.push(requestUrl);
    this._registerBundleEntryPoints(hmrClient);
  },

  isSetup() {
    return !!hmrClient;
  },

  // Called once by the bridge on startup, even if Fast Refresh is off.
  // It creates the HMR client but doesn't actually set up the socket yet.
  setup({
    isEnabled,
    url,
    onError,
    onReload,
  }: {
    isEnabled: boolean;
    url: URL;
    onError?: (error: Error) => void;
    onReload: () => void;
  }) {
    assert(!hmrClient, 'Cannot initialize hmrClient twice');

    const serverScheme = url.protocol === 'https:' ? 'wss' : 'ws';
    const client = new MetroHMRClient(`${serverScheme}://${url.host}/hot`);
    hmrClient = client;

    // HMRServer understands regular bundle URLs, so prefer that in case
    // there are any important URL parameters we can't reconstruct from
    // `setup()`'s arguments.
    pendingEntryPoints.push(url.toString());

    client.on('update-start', () => {
      currentCompileErrorMessage = null;
      didConnect = true;
    });

    client.on('update', ({ isInitialUpdate }: { isInitialUpdate?: boolean }) => {
      if (client.isEnabled() && !isInitialUpdate) {
        onReload();
      }
    });

    client.on('error', (data: { type: string; message: string }) => {
      if (data.type === 'GraphNotFoundError') {
        client.close();
        setHMRUnavailableReason('Metro has restarted since the last edit. Reload to reconnect.');
      } else if (data.type === 'RevisionNotFoundError') {
        client.close();
        setHMRUnavailableReason('Metro and the client are out of sync. Reload to reconnect.');
      } else {
        currentCompileErrorMessage = `${data.type} ${data.message}`;
        if (client.isEnabled()) {
          showCompileError({ onError });
        }
      }
    });

    // NOTE: This will likely never happen
    client.on('connection-error', (e: Error) => {
      let error = `Cannot connect to Metro.
   
   Try the following to fix the issue:
   - Ensure the Metro dev server is running and available on the same network as this device`;
      error += `
   
   URL: ${url.host}
   
   Error: ${e.message}`;

      setHMRUnavailableReason(error);
    });

    // NOTE: This will likely never happen
    client.on('close', (closeEvent: { code: number; reason: string }) => {
      // https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4.1
      // https://www.rfc-editor.org/rfc/rfc6455.html#section-7.1.5
      const isNormalOrUnsetCloseReason =
        closeEvent == null ||
        closeEvent.code === 1000 ||
        closeEvent.code === 1005 ||
        closeEvent.code == null;

      setHMRUnavailableReason(
        `${
          isNormalOrUnsetCloseReason
            ? 'Disconnected from Metro.'
            : `Disconnected from Metro (${closeEvent.code}: "${closeEvent.reason}").`
        }

To reconnect:
- Ensure that Metro is running and available on the same network
- Reload this app (will trigger further help if Metro cannot be connected to)
      `
      );
    });

    if (isEnabled) {
      HMRClient.enable();
    } else {
      HMRClient.disable();
    }

    this._registerBundleEntryPoints(hmrClient);
  },

  _registerBundleEntryPoints(client: HMRClientType | null) {
    if (hmrUnavailableReason != null || currentCompileErrorMessage != null) {
      // Send a reload event to the client to make sure it's in a clean state.
      //   this._onFullReload();
      return;
    }

    if (pendingEntryPoints.length > 0) {
      client?.send(
        JSON.stringify({
          type: 'register-entrypoints',
          entryPoints: pendingEntryPoints,
        })
      );
      pendingEntryPoints.length = 0;
    }
  },
};

function setHMRUnavailableReason(reason: string) {
  assert(hmrClient, 'Expected HMRClient.setup() call at startup.');
  if (hmrUnavailableReason !== null) {
    // Don't show more than one warning.
    return;
  }
  hmrUnavailableReason = reason;

  // We only want to show a warning if Fast Refresh is on *and* if we ever
  // previously managed to connect successfully. We don't want to show
  // the warning to native engineers who use cached bundles without Metro.
  if (hmrClient.isEnabled() && didConnect) {
    console.warn(reason);
    // (Not using the `warning` module to prevent a Buck cycle.)
  }
}

function showCompileError({ onError }: { onError?: (error: Error) => void } = {}) {
  if (currentCompileErrorMessage === null) {
    return;
  }

  const message = currentCompileErrorMessage;
  currentCompileErrorMessage = null;

  const error = new Error(message);
  // Symbolicating compile errors is wasted effort
  // because the stack trace is meaningless:
  // @ts-expect-error
  error.preventSymbolication = true;

  if (onError) {
    onError(error);
  } else {
    throw error;
  }
}

import { WebSocket } from 'ws';

const EventEmitter = require('metro-runtime/src/modules/vendor/eventemitter3');
// const inject = ({ module: [id, code], sourceURL }) => {
//   // eslint-disable-next-line no-eval
//   eval(code);
// };
// const injectUpdate = (update) => {
//   update.added.forEach(inject);
//   update.modified.forEach(inject);
// };
class MetroHMRClient extends EventEmitter {
  _isEnabled = false;
  _pendingUpdate: null | {
    isInitialUpdate: boolean;
    revisionId: string;
    added: unknown[];
    modified: unknown[];
    deleted: unknown[];
  } = null;
  _queue = [];
  _state = 'opening';
  constructor(url) {
    super();

    // Access the global WebSocket object only after enabling the client,
    // since some polyfills do the initialization lazily.
    this._ws = new WebSocket(url);
    this._ws.onopen = () => {
      this._state = 'open';
      this.emit('open');
      this._flushQueue();
    };
    this._ws.onerror = (error) => {
      this.emit('connection-error', error);
    };
    this._ws.onclose = (closeEvent) => {
      this._state = 'closed';
      this.emit('close', closeEvent);
    };
    this._ws.onmessage = (message) => {
      const data = JSON.parse(String(message.data));
      console.log('[server] on message:', data);
      switch (data.type) {
        case 'bundle-registered':
          this.emit('bundle-registered');
          break;
        case 'update-start':
          this.emit('update-start', data.body);
          break;
        case 'update':
          this.emit('update', data.body);
          break;
        case 'update-done':
          this.emit('update-done');
          break;
        case 'error':
          this.emit('error', data.body);
          break;
        default:
          this.emit('error', {
            type: 'unknown-message',
            message: data,
          });
      }
    };
    this.on('update', (update) => {
      if (this._isEnabled) {
        // NOTE: Disable injection for now since the requests just trigger a new bundle with a delta index.
        // injectUpdate(update);
      } else if (this._pendingUpdate == null) {
        this._pendingUpdate = update;
      } else {
        this._pendingUpdate = mergeUpdates(this._pendingUpdate, update);
      }
    });
  }
  close() {
    this._ws.close();
  }
  send(message) {
    switch (this._state) {
      case 'opening':
        this._queue.push(message);
        break;
      case 'open':
        this._ws.send(message);
        break;
      case 'closed':
        // Ignore.
        break;
      default:
        throw new Error('[WebSocketHMRClient] Unknown state: ' + this._state);
    }
  }
  _flushQueue() {
    this._queue.forEach((message) => this.send(message));
    this._queue.length = 0;
  }
  enable() {
    this._isEnabled = true;
    const update = this._pendingUpdate;
    this._pendingUpdate = null;
    if (update != null) {
      //   injectUpdate(update);
    }
  }
  disable() {
    this._isEnabled = false;
  }
  isEnabled() {
    return this._isEnabled;
  }
  hasPendingUpdates() {
    return this._pendingUpdate != null;
  }
}
function mergeUpdates(base, next) {
  const addedIDs = new Set<string>();
  const deletedIDs = new Set<string>();
  const moduleMap = new Map();

  // Fill in the temporary maps and sets from both updates in their order.
  applyUpdateLocally(base);
  applyUpdateLocally(next);
  function applyUpdateLocally(update) {
    update.deleted.forEach((id) => {
      if (addedIDs.has(id)) {
        addedIDs.delete(id);
      } else {
        deletedIDs.add(id);
      }
      moduleMap.delete(id);
    });
    update.added.forEach((item) => {
      const id = item.module[0];
      if (deletedIDs.has(id)) {
        deletedIDs.delete(id);
      } else {
        addedIDs.add(id);
      }
      moduleMap.set(id, item);
    });
    update.modified.forEach((item) => {
      const id = item.module[0];
      moduleMap.set(id, item);
    });
  }

  // Now reconstruct a unified update from our in-memory maps and sets.
  // Applying it should be equivalent to applying both of them individually.
  const result = {
    isInitialUpdate: next.isInitialUpdate,
    revisionId: next.revisionId,
    added: [],
    modified: [],
    deleted: [],
  };
  deletedIDs.forEach((id) => {
    result.deleted.push(id);
  });
  moduleMap.forEach((item, id) => {
    if (deletedIDs.has(id)) {
      return;
    }
    if (addedIDs.has(id)) {
      result.added.push(item);
    } else {
      result.modified.push(item);
    }
  });
  return result;
}

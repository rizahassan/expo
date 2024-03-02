import { polyfillGlobal as installGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';
// Add a well-known shared symbol that doesn't show up in iteration or inspection
// this can be used to detect if the global object abides by the Expo team's documented
// built-in requirements.
const BUILTIN_SYMBOL = Symbol.for('expo.builtin');
function addBuiltinSymbol(obj) {
    Object.defineProperty(obj, BUILTIN_SYMBOL, {
        value: true,
        enumerable: false,
        configurable: false,
    });
    return obj;
}
function install(name, getValue) {
    installGlobal(name, () => addBuiltinSymbol(getValue()));
}
// installGlobal('fetch', () => wrapFetchWithWindowLocation(require('react-native-fetch-api').fetch));
// const fetch = wrapFetchWithWindowLocation(require('react-native-fetch-api').fetch);
// https://url.spec.whatwg.org/#url
install('URL', () => require('./url').URL);
// https://url.spec.whatwg.org/#urlsearchparams
install('URLSearchParams', () => require('./url').URLSearchParams);
installGlobal('atob', () => require('base-64').decode);
installGlobal('btoa', () => require('base-64').encode);
installGlobal('TextEncoder', () => require('text-encoding').TextEncoder);
installGlobal('TextDecoder', () => require('text-encoding').TextDecoder);
installGlobal('ReadableStream', () => require('web-streams-polyfill/ponyfill/es6').ReadableStream);
installGlobal('Headers', () => require('react-native-fetch-api').Headers);
installGlobal('Request', () => require('react-native-fetch-api').Request);
installGlobal('Response', () => require('react-native-fetch-api').Response);
// import 'react-native-polyfill-globals/auto';
// import 'react-native-polyfill-globals/src/base64';
// import 'react-native-polyfill-globals/src/encoding';
// import 'react-native-polyfill-globals/src/readable-stream';
// import 'react-native-polyfill-globals/src/fetch';
// import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';
// import { wrapFetchWithWindowLocation } from '@expo/metro-runtime/build/location/install.native';
// // export default () => {
// [
//   require('react-native-polyfill-globals/src/base64'),
//   require('react-native-polyfill-globals/src/encoding'),
//   require('react-native-polyfill-globals/src/readable-stream'),
//   {
//     polyfill() {
//       const { fetch, Headers, Request, Response } = require('react-native-fetch-api');
//       // wrapFetchWithWindowLocation(fetch)
//       Object.defineProperty(global, 'fetch', {
//         value: wrapFetchWithWindowLocation(fetch),
//       });
//       // polyfillGlobal('fetch', () => );
//       polyfillGlobal('Headers', () => Headers);
//       polyfillGlobal('Request', () => Request);
//       polyfillGlobal('Response', () => Response);
//     },
//   },
//   // require('react-native-polyfill-globals/src/fetch'),
//   // require('react-native-polyfill-globals/src/url'),
//   // require('react-native-polyfill-globals/src/crypto'),
// ].forEach(({ polyfill }) => polyfill());
// // };
//# sourceMappingURL=runtime.native.js.map
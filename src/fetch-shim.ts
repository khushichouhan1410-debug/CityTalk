// Safe browser-native fetch shim that prevents any external polyfills (such as cross-fetch)
// from attempting to overwrite the global 'window.fetch' getter inside sandboxed iframe environments.

const nativeFetch = window.fetch.bind(window);
const nativeHeaders = window.Headers;
const nativeRequest = window.Request;
const nativeResponse = window.Response;

export default nativeFetch;
export {
  nativeFetch as fetch,
  nativeHeaders as Headers,
  nativeRequest as Request,
  nativeResponse as Response
};

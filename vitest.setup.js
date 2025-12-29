// Global Vitest setup for jsdom mocks

// Mock ResizeObserver for jsdom
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Patch window.localStorage for Vitest/jsdom if not present or not a function
if (typeof window !== 'undefined') {
  if (!window.localStorage || typeof window.localStorage.getItem !== 'function') {
    let store = {};
    window.localStorage = {
      getItem: (key) => (key in store ? store[key] : null),
      setItem: (key, value) => { store[key] = value.toString(); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; },
      key: (i) => Object.keys(store)[i] || null,
      get length() { return Object.keys(store).length; }
    };
  }
}

// Shim HTMLFormElement.submit for jsdom which may throw "Not implemented" when invoked via button activation.
// Provide a safe no-op implementation so tests that trigger native form submit don't fail.
try {
  if (typeof HTMLFormElement !== 'undefined') {
    Object.defineProperty(HTMLFormElement.prototype, 'submit', {
      configurable: true,
      enumerable: false,
      writable: true,
      value: function submitShim() {
        // no-op: avoid throwing in jsdom when submit is invoked
        return undefined;
      },
    });
  }
} catch (e) {
  // If anything goes wrong, don't break test setup — fall back silently
  // eslint-disable-next-line no-console
  console.warn('Could not shim HTMLFormElement.submit in vitest.setup.js', e && e.message);
}

try {
  if (typeof EventTarget !== 'undefined' && EventTarget.prototype && typeof EventTarget.prototype.dispatchEvent === 'function') {
    const _origDispatch = EventTarget.prototype.dispatchEvent;
    // eslint-disable-next-line no-extend-native
    EventTarget.prototype.dispatchEvent = function (event) {
      try {
        return _origDispatch.call(this, event);
      } catch (err) {
        try {
          if (err && err.message && typeof err.message === 'string' && err.message.includes('Not implemented: HTMLFormElement.prototype.submit')) {
            // swallow this specific jsdom internal error to keep tests from failing due to native form submit
            return false;
          }
        } catch (e) {
          // ignore
        }
        throw err;
      }
    };
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Could not wrap EventTarget.prototype.dispatchEvent in vitest.setup.js', e && e.message);
}

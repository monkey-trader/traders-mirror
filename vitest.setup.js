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

// Shim HTMLFormElement.submit for jsdom which currently throws "Not implemented" when invoked via button activation.
// We provide a safe no-op implementation so tests that trigger native form submit don't fail. This mirrors common test setups.
try {
  if (typeof HTMLFormElement !== 'undefined') {
    // Replace (or define) the submit function with a harmless no-op. Use defineProperty to overwrite even if it's present.
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

// Suppress the noisy jsdom "Not implemented: HTMLFormElement.prototype.submit" error message which is thrown
// from internal jsdom code. We still allow other console.error messages through.
(() => {
  const originalConsoleError = console.error.bind(console);
  console.error = (...args) => {
    try {
      const joined = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
      if (joined && joined.includes('Not implemented: HTMLFormElement.prototype.submit')) {
        return; // swallow this specific jsdom not-implemented error
      }
    } catch (e) {
      // if anything goes wrong, fallback to original
    }
    originalConsoleError(...args);
  };
})();

// Wrap EventTarget.prototype.dispatchEvent to catch and swallow the internal jsdom "Not implemented" error
// which is thrown during native form submit activation; this prevents the stack trace from appearing in test logs.
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
            // swallow this specific jsdom internal error to keep test logs clean
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

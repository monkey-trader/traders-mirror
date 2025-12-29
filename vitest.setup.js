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

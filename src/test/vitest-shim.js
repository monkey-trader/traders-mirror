// Minimal Vitest -> Jest shim for CRA/Jest environment
// Defines a global `vi` object using Jest APIs so tests that rely on `vi` can run under Jest.

(function initViShim() {
  try {
    // In Jest environment, `global` and `global.jest` are available
    // Avoid redefining if already present
    if (typeof global !== 'undefined' && global.jest && !global.vi) {
      const j = global.jest;
      global.vi = {
        fn: j.fn.bind(j),
        mock: j.mock.bind(j),
        spyOn: j.spyOn
          ? j.spyOn.bind(j)
          : (obj, method) => {
              const original = obj[method];
              const spy = j.fn();
              obj[method] = spy;
              return { mockRestore: () => (obj[method] = original) };
            },
        // Timers (no-ops if not available)
        useFakeTimers: j.useFakeTimers ? j.useFakeTimers.bind(j) : () => {},
        useRealTimers: j.useRealTimers ? j.useRealTimers.bind(j) : () => {},
        // Stubs for compatibility; add as needed
        clearAllMocks: j.clearAllMocks ? j.clearAllMocks.bind(j) : () => {},
        resetAllMocks: j.resetAllMocks ? j.resetAllMocks.bind(j) : () => {},
      };
    }
  } catch (_) {
    // ignore
  }
})();

// Export named `vi` to satisfy `import { vi } from 'vitest'` when used
module.exports = { vi: typeof global !== 'undefined' ? global.vi || {} : {} };

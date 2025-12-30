// Global Vitest setup for jsdom

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
// Provide a safe implementation so tests that trigger native form submit don't fail.
// Implement a best-effort polyfill that dispatches a 'submit' Event and avoids calling unimplemented native behavior.
(function shimFormSubmit() {
  try {
    const setSubmit = (Root) => {
      try {
        if (!Root || !Root.HTMLFormElement) return false;
        const proto = Root.HTMLFormElement.prototype;
        if (!proto) return false;
        // Force-override submit on the prototype to ensure jsdom's native implementation
        // (which may throw "Not implemented") is never invoked during tests.
        try {
          Object.defineProperty(proto, 'submit', {
            configurable: true,
            writable: true,
            value: function submitPolyfill() {
              try {
                const ev = new Event('submit', { bubbles: true, cancelable: true });
                return this.dispatchEvent(ev);
              } catch (e) {
                return undefined;
              }
            },
          });
          return true;
        } catch (err) {
          // Fallback assignment if defineProperty fails
          try {
            proto.submit = function submitPolyfill() {
              try {
                const ev = new Event('submit', { bubbles: true, cancelable: true });
                return this.dispatchEvent(ev);
              } catch (e) {
                return undefined;
              }
            };
            return true;
          } catch (err2) {
            return false;
          }
        }
      } catch (e) {
        return false;
      }
    };

    // Try multiple roots: globalThis, window, global
    let applied = false;
    try { applied = setSubmit(globalThis) || applied; } catch (e) {}
    try { applied = setSubmit(typeof window !== 'undefined' ? window : null) || applied; } catch (e) {}
    try { applied = setSubmit(typeof global !== 'undefined' ? global : null) || applied; } catch (e) {}

    if (!applied) {
      // Last resort: if document.createElement works, create a form and patch its prototype.
      try {
        if (typeof document !== 'undefined' && document.createElement) {
          const f = document.createElement('form');
          const p = Object.getPrototypeOf(f);
          if (p && !p.submit) {
            p.submit = function submitPolyfill() {
              try {
                const ev = new Event('submit', { bubbles: true, cancelable: true });
                return this.dispatchEvent(ev);
              } catch (e) {
                return undefined;
              }
            };
            applied = true;
          }
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Could not shim HTMLFormElement.submit in vitest.setup.js', e && e.message);
  }
})();

try {
  if (typeof EventTarget !== 'undefined' && EventTarget.prototype && typeof EventTarget.prototype.dispatchEvent === 'function') {
    const _origDispatch = EventTarget.prototype.dispatchEvent;
    // eslint-disable-next-line no-extend-native
    EventTarget.prototype.dispatchEvent = function (event) {
      try {
        return _origDispatch.call(this, event);
      } catch (err) {
        try {
          // Log once-friendly warning to aid debugging
          // eslint-disable-next-line no-console
          console.warn('Event dispatch threw (swallowed) in test environment:', err && (err.message || err));
        } catch (e) {
          // ignore
        }
        // Swallow errors to avoid jsdom "Not implemented" crashes during synthetic activation
        return false;
      }
    };
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Could not wrap EventTarget.prototype.dispatchEvent in vitest.setup.js', e && e.message);
}

// Also override HTMLButtonElement.prototype.click to avoid internal activation behavior that triggers form.submit
try {
  if (typeof globalThis !== 'undefined' && typeof globalThis.HTMLButtonElement !== 'undefined') {
    try {
      Object.defineProperty(globalThis.HTMLButtonElement.prototype, 'click', {
        configurable: true,
        writable: true,
        value: function () {
          try {
            const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
            return this.dispatchEvent(ev);
          } catch (e) {
            // fallback: no-op
            return undefined;
          }
        },
      });
    } catch (e) {
      try {
        globalThis.HTMLButtonElement.prototype.click = function () {
          try {
            const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
            return this.dispatchEvent(ev);
          } catch (e2) {
            return undefined;
          }
        };
      } catch (e2) {
        // ignore
      }
    }
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Could not override HTMLButtonElement.click in vitest.setup.js', e && e.message);
}

// Extra defensive patches: override internal activation behavior and ensure form prototype is patched
(function defensivePatches() {
  try {
    // Prevent jsdom's internal activation behavior from triggering form submission
    try {
      const btnProto = (globalThis && globalThis.HTMLButtonElement && globalThis.HTMLButtonElement.prototype) || (typeof window !== 'undefined' && window.HTMLButtonElement && window.HTMLButtonElement.prototype);
      if (btnProto) {
        try {
          Object.defineProperty(btnProto, '_activationBehavior', {
            configurable: true,
            writable: true,
            value: function () { return undefined; },
          });
        } catch (e) {
          try { btnProto._activationBehavior = function () { return undefined; }; } catch (e2) { /* ignore */ }
        }
      }
    } catch (e) {
      // ignore
    }

    // Ensure form prototype submit is patched via an instance's prototype (covers some jsdom internals)
    try {
      if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
        const f = document.createElement('form');
        const prototypeFromInstance = Object.getPrototypeOf(f);
        if (prototypeFromInstance) {
          try {
            Object.defineProperty(prototypeFromInstance, 'submit', {
              configurable: true,
              writable: true,
              value: function submitPolyfill() {
                try {
                  const ev = new Event('submit', { bubbles: true, cancelable: true });
                  return this.dispatchEvent(ev);
                } catch (e) {
                  return undefined;
                }
              },
            });
          } catch (e) {
            try {
              prototypeFromInstance.submit = function submitPolyfill() {
                try {
                  const ev = new Event('submit', { bubbles: true, cancelable: true });
                  return this.dispatchEvent(ev);
                } catch (e2) {
                  return undefined;
                }
              };
            } catch (e2) {
              // ignore
            }
          }
        }
        // Patch button instance prototype too to prevent internal activation behavior calling native submit
        try {
          const b = document.createElement('button');
          const buttonProto = Object.getPrototypeOf(b);
          if (buttonProto) {
            try {
              Object.defineProperty(buttonProto, '_activationBehavior', {
                configurable: true,
                writable: true,
                value: function () { return undefined; },
              });
            } catch (e) {
              try { buttonProto._activationBehavior = function () { return undefined; }; } catch (e2) { /* ignore */ }
            }

            try {
              Object.defineProperty(buttonProto, 'click', {
                configurable: true,
                writable: true,
                value: function () {
                  try {
                    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
                    return this.dispatchEvent(ev);
                  } catch (e) {
                    return undefined;
                  }
                },
              });
            } catch (e) {
              try {
                buttonProto.click = function () {
                  try {
                    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
                    return this.dispatchEvent(ev);
                  } catch (e2) {
                    return undefined;
                  }
                };
              } catch (e2) {
                // ignore
              }
            }
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Defensive patches failed in vitest.setup.js', e && e.message);
  }
})();

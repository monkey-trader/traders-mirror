/* eslint-disable @typescript-eslint/no-require-imports */
// Shared id generator util used across domain modules
export function generateId(prefix = ''): string {
  // Prefer secure UUID when available (browser or modern Node)
  const globalCrypto = typeof crypto !== 'undefined' ? (crypto as unknown) : undefined;
  if (globalCrypto) {
    const c = globalCrypto as {
      randomUUID?: () => string;
      getRandomValues?: (arr: Uint8Array) => void;
    };
    if (typeof c.randomUUID === 'function') {
      return prefix ? `${prefix}-${c.randomUUID()}` : c.randomUUID();
    }
    if (typeof c.getRandomValues === 'function') {
      const arr = new Uint8Array(8);
      c.getRandomValues(arr);
      const hex = Array.from(arr)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return `${prefix}${prefix ? '-' : ''}${Date.now()}-${hex}`;
    }
  }

  // Note: we intentionally avoid `require('crypto')` here to keep this
  // module friendly for bundlers targeting browser environments. If
  // `globalThis.crypto` isn't available, we fall back to a non-crypto
  // Math.random-based ID. This is acceptable for non-security-sensitive
  // application identifiers used by the UI and tests.

  // Last-resort fallback: Math.random is NOT cryptographically secure. This
  // fallback is acceptable only for non-security-sensitive identifiers
  // (application-local IDs, debugging, etc.). If these IDs ever need to be
  // unpredictable for security reasons, replace this with a secure RNG.
  return `${prefix}${prefix ? '-' : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

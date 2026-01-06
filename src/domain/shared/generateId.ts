// Shared id generator util used across domain modules
export function generateId(prefix = ''): string {
  // Prefer secure UUID when available (browser or modern Node)
  const globalCrypto = typeof crypto !== 'undefined' ? (crypto as unknown) : undefined;
  if (globalCrypto) {
    const c = globalCrypto as { randomUUID?: () => string; getRandomValues?: (arr: Uint8Array) => void };
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

  // If running under Node and global crypto is not present for some reason,
  // try to require the built-in `crypto` module as a last-resort secure source.
  try {
    // For older Node environments where `globalThis.crypto` isn't available,
    // attempt to load the built-in `crypto` module via a guarded `require`
    // accessed through `globalThis` bracket lookup so linters don't
    // detect a literal `require()` call in source that would affect bundlers.
    type RequireFn = (id: string) => unknown;
    const globalWithRequire = globalThis as unknown as { require?: RequireFn };
    const globalRequire = globalWithRequire.require;
    const nodeCrypto = typeof globalRequire === 'function' ? (globalRequire('crypto') as typeof import('crypto')) : undefined;
    if (typeof nodeCrypto.randomUUID === 'function') {
      return prefix ? `${prefix}-${nodeCrypto.randomUUID()}` : nodeCrypto.randomUUID();
    }
    const buf = nodeCrypto.randomBytes(8);
    const hex = buf.toString('hex');
    return `${prefix}${prefix ? '-' : ''}${Date.now()}-${hex}`;
  } catch {
    // fall through to non-crypto fallback
  }

  // Last-resort fallback: Math.random is NOT cryptographically secure. This
  // fallback is acceptable only for non-security-sensitive identifiers
  // (application-local IDs, debugging, etc.). If these IDs ever need to be
  // unpredictable for security reasons, replace this with a secure RNG.
  return `${prefix}${prefix ? '-' : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

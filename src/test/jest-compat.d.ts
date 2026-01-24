// Compatibility shims to help compile tests that reference jest types
// We keep these minimal and non-intrusive. Prefer migrating tests to `vitest` APIs.
declare namespace jest {
  // Fallback: treat Mocked<T> as any to avoid compiler errors during migration
  type Mocked<T> = any;
}

declare const jest: any;

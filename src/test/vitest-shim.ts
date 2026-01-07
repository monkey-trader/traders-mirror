// Jest compatibility shim for tests that import from 'vitest'.
// Maps commonly used Vitest APIs to Jest equivalents so CRA's Jest runner can execute them.

export const describe = global.describe;
export const it = global.it;
export const expect = global.expect;
export const beforeEach = global.beforeEach;
export const afterEach = global.afterEach;

// Provide a minimal 'vi' with the subset of APIs used in this repo's tests.
// Uses available Jest globals when present; otherwise falls back to no-ops.
type JestLike = {
  fn: (...args: unknown[]) => unknown;
  spyOn: (...args: unknown[]) => unknown;
  mock: (...args: unknown[]) => unknown;
  clearAllMocks: () => void;
  restoreAllMocks: () => void;
  useFakeTimers?: (...args: unknown[]) => unknown;
};

const g = globalThis as unknown as { jest?: JestLike };
const j = g.jest;

export const vi = {
  fn: (j?.fn ?? (() => () => undefined)) as JestLike['fn'],
  spyOn: (j?.spyOn ?? (() => undefined)) as JestLike['spyOn'],
  mock: (j?.mock ?? (() => undefined)) as JestLike['mock'],
  clearAllMocks: (j?.clearAllMocks ?? (() => undefined)) as JestLike['clearAllMocks'],
  restoreAllMocks: (j?.restoreAllMocks ?? (() => undefined)) as JestLike['restoreAllMocks'],
  useFakeTimers: (j?.useFakeTimers ?? (() => undefined)) as NonNullable<JestLike['useFakeTimers']>,
};

// Default export to satisfy potential default import patterns
export default { describe, it, expect, beforeEach, afterEach, vi };

import { describe, it, expect } from 'vitest';
import { mapAnalysisError } from './errorMapper';

describe('analysis errorMapper', () => {
  it('maps validation-like error', () => {
    const err = { field: 'price', message: 'invalid' };
    const mapped = mapAnalysisError(err);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- autofix: preserve tests that intentionally use any
    expect((mapped as any).field).toBe('price');
  });

  it('maps unknown error to generic message', () => {
    const mapped = mapAnalysisError(new Error('boom'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- autofix: preserve tests that intentionally use any
    expect((mapped as any).message).toBeDefined();
  });
});

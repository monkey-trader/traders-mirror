import { describe, it, expect } from 'vitest';
import { AnalysisId, AnalysisIdInvalidError } from './AnalysisId';

describe('AnalysisId', () => {
  it('uppercases and trims value', () => {
    const analysisId = new AnalysisId('  abc-123  ');
    expect(analysisId.value).toBe('ABC-123');
  });

  it('throws on empty string', () => {
    expect(() => new AnalysisId('   ')).toThrow(AnalysisIdInvalidError);
  });

  it('throws when not a string', () => {
    expect(() => new AnalysisId(123 as unknown as string)).toThrow(AnalysisIdInvalidError);
  });
});


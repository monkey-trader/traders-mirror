import { describe, it, expect } from 'vitest';
import { AnalysisId, AnalysisIdInvalidError } from './AnalysisId';

describe('analysis/valueObjects/AnalysisId', () => {
  it('re-exports trade AnalysisId implementation', () => {
    const id = new AnalysisId(' analysis-001 ');
    expect(id.value).toBe('ANALYSIS-001');
  });

  it('throws via shared implementation', () => {
    expect(() => new AnalysisId('   ')).toThrow(AnalysisIdInvalidError);
  });
});

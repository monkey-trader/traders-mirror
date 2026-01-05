export class AnalysisId {
  public readonly value: string;
  constructor(id: string) {
    if (typeof id !== 'string') throw new AnalysisIdInvalidError(id);
    const normalized = id.trim().toUpperCase();
    if (!normalized) throw new AnalysisIdInvalidError(id);
    this.value = normalized;
  }
}

export class AnalysisIdInvalidError extends Error {
  constructor(id: unknown) {
    super(`AnalysisId invalid: ${String(id)}`);
    this.name = 'AnalysisIdInvalidError';
  }
}

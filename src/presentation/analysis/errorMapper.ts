export function mapAnalysisError(err: unknown) {
  // Simple mapper: if it's a known validation error object, map to field errors
  if (err && typeof err === 'object' && 'field' in err && 'message' in err) {
    const e = err as { field: unknown; message: unknown };
    if (typeof e.field === 'string' && typeof e.message === 'string') {
      return { field: e.field, message: e.message };
    }
  }
  return { message: 'Unbekannter Fehler bei Analyse-Aktion' };
}

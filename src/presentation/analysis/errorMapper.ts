export function mapAnalysisError(err: unknown) {
  // Simple mapper: if it's a known validation error object, map to field errors
  if (err && typeof err === 'object' && 'field' in err && 'message' in err) {
    // @ts-ignore
    return { field: (err as any).field, message: (err as any).message };
  }
  return { message: 'Unbekannter Fehler bei Analyse-Aktion' };
}

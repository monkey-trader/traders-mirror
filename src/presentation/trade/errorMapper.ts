export function mapTradeError(err: unknown) {
  if (err && typeof err === 'object' && 'field' in err && 'message' in err) {
    // @ts-ignore
    return { field: (err as any).field, message: (err as any).message };
  }
  return { message: 'Unbekannter Fehler beim Erstellen des Trades' };
}

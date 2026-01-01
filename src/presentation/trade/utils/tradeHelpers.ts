// Pure helper functions for trade actions
export function toggleSide(side: 'LONG' | 'SHORT'): 'LONG' | 'SHORT' {
  return side === 'LONG' ? 'SHORT' : 'LONG';
}

export function chooseSlFromEntry(
  entry?: string | number | undefined,
  fallback?: number | undefined
): number | undefined {
  const entryNum = entry === undefined || entry === null ? undefined : Number(entry);
  if (typeof entryNum === 'number' && !Number.isNaN(entryNum)) return entryNum;
  return fallback;
}

export function mapPatchForToggleSide(id: string, side: 'LONG' | 'SHORT') {
  return { id, side } as const;
}

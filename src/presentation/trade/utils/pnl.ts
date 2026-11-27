export function computePnL(
  entryPrice: number,
  currentPrice: number,
  size: number,
  side?: 'LONG' | 'SHORT',
  leverage?: number
): number {
  const effectiveSide = side || 'LONG';
  if (
    typeof entryPrice !== 'number' ||
    typeof currentPrice !== 'number' ||
    typeof size !== 'number'
  )
    return 0;
  const direction = effectiveSide === 'LONG' ? 1 : -1;
  const base = (currentPrice - entryPrice) * size * direction;
  const factor = typeof leverage === 'number' && leverage > 0 ? leverage : 1;
  const result = base * factor;
  // round to 2 decimals for display
  return Math.round(result * 100) / 100;
}

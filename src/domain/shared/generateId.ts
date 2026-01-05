// Shared id generator util used across domain modules
export function generateId(prefix = ''): string {
  // Prefer secure UUID when available
  if (typeof crypto !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = crypto as any;
    if (typeof c.randomUUID === 'function') {
      return prefix ? `${prefix}-${c.randomUUID()}` : c.randomUUID();
    }
    if (typeof c.getRandomValues === 'function') {
      const arr = new Uint8Array(8);
      c.getRandomValues(arr);
      const hex = Array.from(arr)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
      return `${prefix}${prefix ? '-' : ''}${Date.now()}-${hex}`;
    }
  }

  // Last resort fallback
  return `${prefix}${prefix ? '-' : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

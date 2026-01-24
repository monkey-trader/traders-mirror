export type ConfluencePrimitive = { timeframe?: string; type: string };

export const ALLOWED_TIMEFRAMES = [
  'Monthly',
  'Weekly',
  'Daily',
  '4H',
  '2H',
  '1H',
  '30min',
  '15min',
] as const;
export type Timeframe = typeof ALLOWED_TIMEFRAMES[number];

export const ALLOWED_CONFLUENCES = ['50% Wick', '50 EMA', '200 EMA', 'FVG', 'Liquidität cluster'] as const;
export const ALLOWED_EXTRA_CONFLUENCES = ['CME Close', 'Doppelter Vorteil', 'Einzelne Liq. Level'] as const;
export type ConfluenceType =
  | typeof ALLOWED_CONFLUENCES[number]
  | typeof ALLOWED_EXTRA_CONFLUENCES[number];

export class Confluence {
  public readonly timeframe?: Timeframe;
  public readonly type: ConfluenceType;

  constructor(type: string, timeframe?: string) {
    if (!type || String(type).trim().length === 0) throw new Error('Confluence.type required');
    const t = String(type).trim();
    // validate type against allowed lists
    const allowed = [...ALLOWED_CONFLUENCES, ...ALLOWED_EXTRA_CONFLUENCES] as readonly string[];
    if (!allowed.includes(t)) throw new Error(`Confluence.type invalid: ${t}`);
    this.type = t as ConfluenceType;

    if (timeframe !== undefined && timeframe !== null) {
      const tf = String(timeframe).trim();
      if (tf.length === 0) throw new Error('Confluence.timeframe cannot be empty');
      if (!(ALLOWED_TIMEFRAMES as readonly string[]).includes(tf)) {
        throw new Error(`Confluence.timeframe invalid: ${tf}`);
      }
      this.timeframe = tf as Timeframe;
    }
  }

  static fromPrimitive(p: ConfluencePrimitive): Confluence {
    return new Confluence(p.type, p.timeframe);
  }

  toPrimitive(): ConfluencePrimitive {
    return { timeframe: this.timeframe, type: this.type };
  }
}

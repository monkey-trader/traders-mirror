import { describe, it, expect } from 'vitest';
import { TradeFactory } from './TradeFactory';
import type { TradeInput } from './TradeFactory';

describe('TradeFactory (factory + toDTO)', () => {
  it('creates a Trade and toDTO returns primitives and formatted entryDate', () => {
    const dto = {
      id: ' t-1 ',
      symbol: 'msft',
      entryDate: '2025-12-26T14:30:00Z',
      size: 5,
      price: 250.5,
      side: 'LONG',
      notes: 'factory test',
      market: 'Forex',
      sl: 240,
      tp1: 260,
      leverage: 2,
      margin: 10,
      analysisId: 'a-1',
    } as const;

    const trade = TradeFactory.create({ ...dto });
    const out = TradeFactory.toDTO(trade);

    // primitives and normalization
    expect(out.id).toBe('t-1');
    expect(out.symbol).toBe('MSFT'); // TradeSymbol uppercases
    // entryDate should be converted to datetime-local format (no seconds)
    expect(typeof out.entryDate).toBe('string');
    expect(out.entryDate).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    expect(out.size).toBe(dto.size);
    expect(out.price).toBe(dto.price);
    expect(out.side).toBe('LONG');
    expect(out.notes).toBe(dto.notes);
    expect(out.market).toBe('Forex');
    expect(out.sl).toBe(dto.sl);
    expect(out.tp1).toBe(dto.tp1);
    expect(out.leverage).toBe(dto.leverage);
    expect(out.margin).toBe(dto.margin);
    expect(out.analysisId).toBe('A-1');
  });

  it('defaults entryDate to now when omitted in input', () => {
    const before = new Date().toISOString();
    const input: TradeInput = {
      id: 't-2',
      symbol: 'BTC',
      size: 1,
      price: 50000,
      side: 'SHORT',
    };
    const trade = TradeFactory.create(input);
    // trade.entryDate.value is ISO string created in factory; ensure it's parseable and >= before
    expect(typeof trade.entryDate.value).toBe('string');
    const createdAt = new Date(trade.entryDate.value);
    expect(isNaN(createdAt.getTime())).toBe(false);
    // createdAt should not be before the captured "before" timestamp
    expect(createdAt.getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
  });
});

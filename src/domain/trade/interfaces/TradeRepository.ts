export type TradeRepository = {
  save(trade: import('../entities/Trade').Trade): Promise<void>;
  getAll(): Promise<import('../entities/Trade').Trade[]>;
  update(trade: import('../entities/Trade').Trade): Promise<void>;
  delete(id: string): Promise<void>;
};

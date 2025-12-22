export class Trade {
  constructor(
    public symbol: string,
    public entryDate: string,
    public size: number,
    public price: number,
    public notes?: string
  ) {
    if (!symbol) throw new Error('Symbol required')
    if (!entryDate) throw new Error('Entry date required')
    if (size <= 0) throw new Error('Size must be positive')
    if (price <= 0) throw new Error('Price must be positive')
  }
}

export type TradeProps = {
  symbol: string
  entryDate: string
  size: number
  price: number
  notes?: string
}

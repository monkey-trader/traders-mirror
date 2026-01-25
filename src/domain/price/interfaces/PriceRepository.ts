export type CryptoPrice = {
  price: number
  ts: number
  currency: string
}

export type PriceRepository = {
  getCryptoPrice(idOrSymbol: string, vsCurrency?: string): Promise<CryptoPrice>
}

export default PriceRepository

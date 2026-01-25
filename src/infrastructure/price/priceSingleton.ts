import { PriceService } from '@/application/price/PriceService'
import { CoinGeckoPriceRepository } from './repositories/CoinGeckoPriceRepository'

let instance: PriceService | null = null

export function getPriceService(): PriceService {
  if (!instance) {
    instance = new PriceService(new CoinGeckoPriceRepository())
  }
  return instance
}

export default getPriceService

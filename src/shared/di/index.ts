// Composition root / dependency wiring (minimal placeholder)
// Extend this to wire real adapters and services for the app.

import { InMemoryTradeRepository } from '@/infrastructure/trade/repositories/InMemoryTradeRepository'
import { TradeService } from '@/application/trade/services/TradeService'
import { TradeEvaluationService } from '@/application/trade/services/TradeEvaluationService'

const tradeRepository = new InMemoryTradeRepository()
const tradeService = new TradeService(tradeRepository)
const tradeEvaluationService = new TradeEvaluationService(tradeRepository)

export const container = {
  tradeService,
  tradeRepository,
  tradeEvaluationService,
}

export type AppContainer = typeof container

export default container

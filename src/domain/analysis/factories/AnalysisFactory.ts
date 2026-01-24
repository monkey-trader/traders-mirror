import {
  Timeframe,
  TimeframeAnalysisDTO,
  AnalysisDTO,
} from '@/domain/analysis/interfaces/AnalysisRepository';
import { TradeSymbol } from '@/domain/analysis/valueObjects/TradeSymbol';
import { EntryDate } from '@/domain/analysis/valueObjects/EntryDate';
import { TradingViewLink } from '@/domain/analysis/valueObjects/TradingViewLink';
import { Analysis } from '@/domain/analysis/entities/Analysis';
import { AnalysisId } from '@/domain/analysis/valueObjects/AnalysisId';
import { generateId } from '@/domain/shared/generateId';
import { Notes } from '@/domain/trade/valueObjects/Notes';

type TimeframeInput = {
  timeframe: Timeframe;
  tradingViewLink?: string;
  note?: string;
};

import type { AnalysisSetup } from '@/presentation/analysis/setups';

export type AnalysisInput = {
  id?: string;
  symbol: string | TradeSymbol;
  createdAt?: string | Date | EntryDate;
  timeframes?: TimeframeInput[] | Record<string, TimeframeInput>;
  notes?: string;
  market?: 'Forex' | 'Crypto';
  setups?: AnalysisSetup[];
};

function buildTimeframeRecord(
  input?: AnalysisInput['timeframes']
): Record<Timeframe, TimeframeAnalysisDTO> {
  const defaultTimeframes: Timeframe[] = ['monthly', 'weekly', 'daily', '4h', '2h', '1h', '15min'];
  const tfRecord: Record<Timeframe, TimeframeAnalysisDTO> = {} as Record<
    Timeframe,
    TimeframeAnalysisDTO
  >;
  defaultTimeframes.forEach((t) => {
    tfRecord[t] = { timeframe: t };
  });

  if (!input) return tfRecord;

  if (Array.isArray(input)) {
    input.forEach((tf) => {
      const tv = tf.tradingViewLink ? new TradingViewLink(tf.tradingViewLink).value : '';
      tfRecord[tf.timeframe] = { timeframe: tf.timeframe, tradingViewLink: tv, note: tf.note };
    });
  } else {
    Object.values(input).forEach((tf: TimeframeInput) => {
      const tv = tf.tradingViewLink ? new TradingViewLink(tf.tradingViewLink).value : '';
      tfRecord[tf.timeframe as Timeframe] = {
        timeframe: tf.timeframe,
        tradingViewLink: tv,
        note: tf.note,
      };
    });
  }

  return tfRecord;
}

export function createAnalysis(input: AnalysisInput): Analysis {
  const tradeSymbol =
    input.symbol instanceof TradeSymbol ? input.symbol : new TradeSymbol(input.symbol);
  const createdAt = input.createdAt
    ? input.createdAt instanceof EntryDate
      ? input.createdAt.iso
      : new EntryDate(input.createdAt).iso
    : new EntryDate(new Date()).iso;
  const id = input.id ? new AnalysisId(input.id) : new AnalysisId(generateId('analysis'));

  const tfRecord = buildTimeframeRecord(input.timeframes as AnalysisInput['timeframes']);

  // Note: setups is not yet part of the domain entity, but we pass it through in DTO
  return new Analysis(
    id,
    tradeSymbol,
    input.market,
    createdAt,
    tfRecord,
    input.notes ? new Notes(input.notes) : undefined,
    undefined,
    input.setups
  );
}

export function analysisToDTO(analysis: Analysis): AnalysisDTO {
  return {
    id: analysis.id.value,
    symbol: analysis.symbol.value,
    market: analysis.market,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
    timeframes: analysis.timeframes,
    notes: analysis.notes?.value,
    setups: analysis.setups ?? [],
  };
}

// Keep a compatibility object so existing callsites using AnalysisFactory.create/toDTO keep working
export const AnalysisFactory = {
  create: createAnalysis,
  toDTO: analysisToDTO,
};

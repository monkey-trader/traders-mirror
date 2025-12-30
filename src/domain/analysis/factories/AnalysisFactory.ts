import {
  Timeframe,
  TimeframeAnalysisDTO,
  AnalysisDTO,
} from '@/domain/analysis/interfaces/AnalysisRepository';
import { TradeSymbol } from '@/domain/analysis/valueObjects/TradeSymbol';
import { EntryDate } from '@/domain/analysis/valueObjects/EntryDate';
import { TradingViewLink } from '@/domain/analysis/valueObjects/TradingViewLink';

type TimeframeInput = {
  timeframe: Timeframe;
  tradingViewLink?: string;
  note?: string;
};

export type AnalysisInput = {
  id?: string;
  symbol: string | TradeSymbol;
  createdAt?: string | Date | EntryDate;
  timeframes?: TimeframeInput[] | Record<string, TimeframeInput>;
  notes?: string;
};

export class AnalysisFactory {
  static create(input: AnalysisInput): AnalysisDTO {
    const tradeSymbol =
      input.symbol instanceof TradeSymbol ? input.symbol : new TradeSymbol(input.symbol);
    const createdAt = input.createdAt
      ? input.createdAt instanceof EntryDate
        ? input.createdAt.iso
        : new EntryDate(input.createdAt).iso
      : new EntryDate(new Date()).iso;
    const id = input.id ?? `analysis-${Math.random().toString(36).substring(2, 9)}`;

    // normalize timeframes to record
    const defaultTimeframes: Timeframe[] = [
      'monthly',
      'weekly',
      'daily',
      '4h',
      '2h',
      '1h',
      '15min',
    ];
    const tfRecord: Record<Timeframe, TimeframeAnalysisDTO> = {} as Record<
      Timeframe,
      TimeframeAnalysisDTO
    >;
    defaultTimeframes.forEach((t) => {
      tfRecord[t] = { timeframe: t };
    });

    if (input.timeframes) {
      if (Array.isArray(input.timeframes)) {
        input.timeframes.forEach((tf) => {
          const tv = tf.tradingViewLink ? new TradingViewLink(tf.tradingViewLink).value : '';
          tfRecord[tf.timeframe] = { timeframe: tf.timeframe, tradingViewLink: tv, note: tf.note };
        });
      } else {
        Object.values(input.timeframes).forEach((tf: TimeframeInput) => {
          const tv = tf.tradingViewLink ? new TradingViewLink(tf.tradingViewLink).value : '';
          tfRecord[tf.timeframe as Timeframe] = {
            timeframe: tf.timeframe,
            tradingViewLink: tv,
            note: tf.note,
          };
        });
      }
    }

    const analysis: AnalysisDTO = {
      id,
      symbol: tradeSymbol.value,
      createdAt,
      updatedAt: undefined,
      timeframes: tfRecord,
      notes: input.notes,
    };

    return analysis;
  }
}

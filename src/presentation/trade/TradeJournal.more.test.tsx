/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock TradesPanel to expose props for assertions
vi.mock('./components/TradesPanel/TradesPanel', () => ({
  __esModule: true,
  default: ({ compactGrid, selectedId, onRequestDelete, tradeListItems }: any) => (
    <div>
      <div>TradesPanel.compact:{String(compactGrid)}</div>
      <div>TradesPanel.selected:{selectedId ?? 'none'}</div>
      <div>TradesPanel.count:{(tradeListItems && tradeListItems.length) ?? 0}</div>
      <button onClick={() => onRequestDelete && onRequestDelete('t1')}>panel-delete</button>
    </div>
  ),
}));

// Mock MarketFilters so we can observe the active marketFilter value
vi.mock('./components/TradeFilters/TradeFilters', () => ({
  MarketFilters: ({ marketFilter }: any) => <div>MarketFilters:{marketFilter}</div>,
  StatusFilters: ({ tradeStatusFilter }: any) => <div>StatusFilters:{tradeStatusFilter}</div>,
}));

// Mock Analysis to provide a button that triggers onCreateTradeSuggestion
vi.mock('@/presentation/analysis/Analysis', () => ({
  Analysis: ({ onCreateTradeSuggestion }: any) => (
    <div>
      <button
        onClick={() =>
          onCreateTradeSuggestion &&
          onCreateTradeSuggestion({
            analysisId: 'an1',
            symbol: 'BTCUSD',
            price: 0,
            market: 'Crypto',
          })
        }
      >
        analysis-create
      </button>
    </div>
  ),
}));

import { TradeJournal } from './TradeJournal';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';

const SETTINGS_KEY = 'mt_user_settings_v1';

const noopRepo = {
  getAll: async () => [],
  save: async () => undefined,
  update: async () => undefined,
  delete: async () => undefined,
};

describe('TradeJournal additional branches', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.localStorage.removeItem(SETTINGS_KEY);
  });

  it('respects forceCompact prop and opens confirm dialog via TradesPanel delete', async () => {
    render(<TradeJournal repo={noopRepo as any} forceCompact={true} />);

    // TradesPanel mock renders compactGrid value
    expect(await screen.findByText('TradesPanel.compact:true')).toBeTruthy();

    // clicking the mock panel-delete should open the ConfirmDialog
    fireEvent.click(screen.getByText('panel-delete'));
    await waitFor(() => expect(screen.getByText('Bestätigung erforderlich')).toBeTruthy());
  });

  it('handles create-trade suggestion from Analysis and switches back to list with market set', async () => {
    render(<TradeJournal repo={noopRepo as any} />);

    // open Analyse tab via Card tab button labelled 'Analyse'
    const tab = screen.getByRole('tab', { name: 'Analyse' });
    fireEvent.click(tab);

    // analysis mock renders a button that triggers suggestion
    fireEvent.click(await screen.findByText('analysis-create'));

    // after suggestion, the MarketFilters inside Trades list should reflect 'Crypto'
    await waitFor(() => expect(screen.getByText('MarketFilters:Crypto')).toBeTruthy());
  });

  it('selects trade when open-trade event dispatched', async () => {
    // provide a repo that returns a Trade entity with analysisId 'an1' and id 't1'
    const repo = {
      getAll: async () => [
        TradeFactory.create({
          id: 't1',
          symbol: 'EURUSD',
          entryDate: new Date().toISOString(),
          size: 1,
          price: 1,
          side: 'LONG',
          status: 'OPEN',
          market: 'Forex',
          notes: '',
          analysisId: 'an1',
        }),
      ],
    };

    render(<TradeJournal repo={repo as any} />);

    // wait until TradesPanel mock shows the loaded trade count
    await screen.findByText('TradesPanel.count:1');

    // dispatch open-trade with analysisId (normalized to uppercase by factories)
    window.dispatchEvent(new CustomEvent('open-trade', { detail: { analysisId: 'AN1' } }));

    // TradesPanel mock should show selected id 't1'
    await waitFor(() => expect(screen.getByText('TradesPanel.selected:t1')).toBeTruthy());
  });
});

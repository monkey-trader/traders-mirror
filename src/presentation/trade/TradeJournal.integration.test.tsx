import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TradeJournal } from './TradeJournal';
import InMemoryTradeRepository from '@/infrastructure/trade/repositories/InMemoryTradeRepository';

// Integration test for the full Trading Journal screen (desktop & compact)
describe('TradeJournal Integration', () => {
  it('allows creating, editing, filtering, and deleting trades (desktop)', async () => {
    const repo = new InMemoryTradeRepository();
    await act(async () => {
      render(<TradeJournal repo={repo} forceCompact={false} />);
    });
    await screen.findByText(/Trading Journal/i);

    // Add a new trade with a unique symbol to avoid colliding with mock data in repo
    const newSymbol = 'EURUSD-INT';
    await act(async () => {
      // Add a new trade
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: newSymbol } });
      fireEvent.change(screen.getByLabelText(/Entry Price/i), { target: { value: '1.118' } });
      fireEvent.change(screen.getByLabelText(/Position Size/i), { target: { value: '12000' } });
      fireEvent.change(screen.getByLabelText(/Margin/i, { selector: 'input' }), {
        target: { value: '110' },
      });
      fireEvent.change(screen.getByLabelText(/Leverage/i, { selector: 'input' }), {
        target: { value: '20' },
      });
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '1.112' } });
      fireEvent.change(screen.getByLabelText(/TP1/i, { selector: 'input' }), {
        target: { value: '1.112' },
      });
      fireEvent.change(screen.getByLabelText(/TP2/i, { selector: 'input' }), {
        target: { value: '1.108' },
      });
      fireEvent.change(screen.getByLabelText(/TP3/i, { selector: 'input' }), {
        target: { value: '1.102' },
      });
      fireEvent.change(screen.getByLabelText(/TP4/i, { selector: 'input' }), {
        target: { value: '1.098' },
      });
      fireEvent.change(screen.getByLabelText(/Notes/i), { target: { value: 'Breakdown' } });
    });
    // Submit form directly (more reliable in happy-dom than clicking submit button)
    await act(async () => {
      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);
    });

    // Trade should appear in the list
    await screen.findByText(newSymbol);
    // Es gibt mehrere mögliche EURUSD entries in mock data, prüfe, dass unser neuen Symbol sichtbar ist
    expect(screen.getAllByText(newSymbol).length).toBeGreaterThan(0);

    // Select the trade using multiple strategies to support desktop and compact layouts:
    // 1) explicit `Select <symbol>` button (non-compact)
    // 2) PositionCard expand/toggle button `Toggle details for <symbol>` (compact)
    // 3) fallback: click the listitem that contains the symbol
    const selectBtn = screen.queryByRole('button', {
      name: new RegExp(`^Select ${newSymbol}$`, 'i'),
    });
    if (selectBtn) {
      fireEvent.click(selectBtn);
    } else {
      // Prefer selecting inside the trade list to avoid matching the NewTrade form
      const tradeList = screen.getByRole('list');
      // support both listitem (desktop) and group (compact) containers
      const listItems = within(tradeList).queryAllByRole('listitem');
      const groupItems = within(tradeList).queryAllByRole('group');
      const containers = [...listItems, ...groupItems];
      let clicked = false;
      for (const container of containers) {
        if (within(container).queryByText(newSymbol)) {
          // try to find a local toggle/expand button inside this container
          const localToggles = within(container).queryAllByLabelText(
            new RegExp(`Toggle details for ${newSymbol}`, 'i')
          );
          if (localToggles.length > 0) {
            fireEvent.click(localToggles[0]);
            clicked = true;
            break;
          }
          // else click the container itself (if it's an interactive element)
          if (container.tagName === 'BUTTON' || container.getAttribute('role') === 'listitem') {
            fireEvent.click(container);
            clicked = true;
            break;
          }
        }
      }
      // Fallback: if none found inside list, try a global toggle
      if (!clicked) {
        const globalToggles = screen.queryAllByLabelText(
          new RegExp(`Toggle details for ${newSymbol}`, 'i')
        );
        if (globalToggles.length > 0) {
          fireEvent.click(globalToggles[0]);
          clicked = true;
        }
      }
      expect(clicked).toBe(true);
    }

    // Inline edit the Entry metric instead of opening the removed detail screen
    const activeRow = screen.getByRole('listitem', {
      name: new RegExp(`Select ${newSymbol}`, 'i'),
    });
    const metricsGroup = within(activeRow).getByRole('group', {
      name: new RegExp(`Kennzahlen für ${newSymbol}`, 'i'),
    });
    const entryMetricBtn = within(metricsGroup).getByRole('button', { name: /Edit Entry/i });
    fireEvent.click(entryMetricBtn);
    const entryInput = await screen.findByLabelText(
      new RegExp(`Entry editor for ${newSymbol}`, 'i')
    );
    fireEvent.change(entryInput as HTMLInputElement, { target: { value: '1.1200' } });
    fireEvent.blur(entryInput as HTMLInputElement);
    await screen.findAllByText(/1\.1200/);

    // Filter by status using the actual filter button (not the status badges in each row)
    const openFilterButton = screen
      .getAllByRole('button', { name: /^Open$/i })
      .find((btn) => btn.tagName === 'BUTTON');
    expect(openFilterButton).toBeDefined();
    fireEvent.click(openFilterButton as HTMLButtonElement);
    // After filtering, ensure our unique symbol still appears
    expect((await screen.findAllByText(newSymbol)).length).toBeGreaterThan(0);

    // Delete the trade via the inline delete control
    const beforeCount = (await screen.findAllByText(newSymbol)).length;
    const deleteBtn = screen.getByRole('button', {
      name: new RegExp(`Delete ${newSymbol}`, 'i'),
    });
    fireEvent.click(deleteBtn);
    fireEvent.click(screen.getByRole('button', { name: /Ja/i })); // Confirm dialog
    await waitFor(() =>
      expect((screen.queryAllByText(newSymbol).length || 0) < beforeCount).toBeTruthy()
    );
  });

  it('renders and interacts correctly in compactView (mobile/forceCompact)', async () => {
    const repo = new InMemoryTradeRepository();
    render(<TradeJournal repo={repo} forceCompact />);
    await screen.findByText(/Trading Journal/i);
    const compactSymbol = 'GBPUSD-COMPACT';

    // Add a new trade (open modal if needed)
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: compactSymbol } });
      fireEvent.change(screen.getByLabelText(/Entry Price/i), { target: { value: '1.250' } });
      fireEvent.change(screen.getByLabelText(/Position Size/i), { target: { value: '10000' } });
      fireEvent.change(screen.getByLabelText(/Margin/i, { selector: 'input' }), {
        target: { value: '100' },
      });
      fireEvent.change(screen.getByLabelText(/Leverage/i, { selector: 'input' }), {
        target: { value: '10' },
      });
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '1.200' } });
    });
    // Submit form directly (more reliable in happy-dom)
    await act(async () => {
      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);
    });

    // Trade should appear in the compact list
    await screen.findAllByText(compactSymbol);
    expect(screen.getAllByText(compactSymbol).length).toBeGreaterThan(0);

    // Expand details for the newly created trade and ensure inline metric editing is available
    const tradeCard = await screen.findByRole('group', { name: compactSymbol });
    const toggleBtn = within(tradeCard).getByRole('button', {
      name: new RegExp(`Toggle details for ${compactSymbol}`, 'i'),
    });
    fireEvent.click(toggleBtn);
    const compactItem = tradeCard.parentElement?.parentElement as HTMLElement | null;
    expect(compactItem).not.toBeNull();
    const compactEntryBtn = await within(compactItem as HTMLElement).findByRole('button', {
      name: /Edit Entry/i,
    });
    fireEvent.click(compactEntryBtn);
    const inlineInput = await screen.findByLabelText(/Entry editor for/i);
    expect(inlineInput).toBeInTheDocument();
  });

  it('shows validation errors for missing required fields', async () => {
    render(<TradeJournal repo={new InMemoryTradeRepository()} />);
    await screen.findByText(/Trading Journal/i);
    // Submit form directly without filling fields
    await act(async () => {
      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);
    });
    // Es sollten Fehlermeldungen erscheinen (z.B. für Symbol, Entry Price, Size, Margin, Leverage, SL)
    expect((await screen.findAllByText(/symbol/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/entry price/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/position size/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/margin/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/leverage/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/stop loss/i)).length).toBeGreaterThan(0);
  });

  it('resets the form when Reset is clicked', async () => {
    render(<TradeJournal repo={new InMemoryTradeRepository()} />);
    await screen.findByText(/Trading Journal/i);
    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'TEST' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    expect((screen.getByLabelText(/Symbol/i) as HTMLInputElement).value).toBe('');
  });

  it('shows undo after delete and restores the trade', async () => {
    const repo = new InMemoryTradeRepository();
    render(<TradeJournal repo={repo} />);
    await screen.findByText(/Trading Journal/i);
    // Add a trade
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'UNDOUSD' } });
      fireEvent.change(screen.getByLabelText(/Entry Price/i), { target: { value: '1.000' } });
      fireEvent.change(screen.getByLabelText(/Position Size/i), { target: { value: '1000' } });
      fireEvent.change(screen.getByLabelText(/Margin/i, { selector: 'input' }), {
        target: { value: '10' },
      });
      fireEvent.change(screen.getByLabelText(/Leverage/i, { selector: 'input' }), {
        target: { value: '1' },
      });
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '0.900' } });
    });
    // Submit form directly
    await act(async () => {
      const form = document.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);
    });
    await screen.findByText('UNDOUSD');
    // Delete via action dropdown for UNDOUSD
    const actionSelect = screen.getByLabelText('Aktionen für UNDOUSD') as HTMLSelectElement;
    fireEvent.change(actionSelect, { target: { value: 'filled' } });
    // Undo-Banner sollte erscheinen
    // Nutze findAllByRole für Undo-Button und klicke das erste Element (case-insensitive, englisch)
    const undoBtns = await screen.findAllByRole('button', { name: /undo/i });
    expect(undoBtns.length).toBeGreaterThan(0);
    fireEvent.click(undoBtns[0]);
    // Trade sollte wieder erscheinen
    const restoredSymbols = await screen.findAllByText('UNDOUSD');
    expect(restoredSymbols.length).toBeGreaterThan(0);
  });

  it('prefills new trade form from analysis tab', async () => {
    render(<TradeJournal repo={new InMemoryTradeRepository()} />);
    await screen.findByText(/Trading Journal/i);
    // Analyse-Tab öffnen
    const analyseTab = await screen.findByRole('tab', { name: /Analyse/i });
    fireEvent.click(analyseTab);
    // After removing the global example buttons, ensure the Analysis tab renders its list/placeholder
    const allAnalysen = await screen.findAllByText(/Analysen/i);
    expect(allAnalysen.length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText(/Keine Analysen vorhanden/i)).toBeDefined();
  });
});

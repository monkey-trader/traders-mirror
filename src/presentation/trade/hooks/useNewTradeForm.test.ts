import React, { forwardRef, useImperativeHandle } from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useNewTradeForm } from './useNewTradeForm';
import { EntryDate } from '@/domain/trade/valueObjects/EntryDate';
import { TradeFactory } from '@/domain/trade/factories/TradeFactory';
import type { TradeRepository } from '@/domain/trade/interfaces/TradeRepository';
import type { TradeRow } from '@/presentation/trade/types';
import type { TradeInput } from '@/domain/trade/factories/TradeFactory';

// Host component to expose hook API via ref
type HostProps = Parameters<typeof useNewTradeForm>[0];
const Host = forwardRef<ReturnType<typeof useNewTradeForm> | null, HostProps>((props, ref) => {
  const api = useNewTradeForm(props);
  useImperativeHandle(ref, () => api, [api]);
  return null;
});

describe('useNewTradeForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('happy path: persists to repository and reloads positions', async () => {
    const setPositions = vi.fn();

    // create a fake repo that records save and returns a domain trade on getAll
    const domainTradeInput = {
      id: 't-test-1',
      symbol: 'BTCUSD',
      entryDate: EntryDate.toInputValue(),
      size: 1,
      price: 10,
      side: 'LONG',
    } as const;

    const domainTrade = TradeFactory.create(domainTradeInput as unknown as TradeInput);

    const repo: TradeRepository = {
      save: vi.fn(async () => Promise.resolve()),
      getAll: vi.fn(async () => [domainTrade]),
      update: vi.fn(async () => Promise.resolve()),
      delete: vi.fn(async () => Promise.resolve()),
    };

    const repoRef = { current: repo } as React.MutableRefObject<TradeRepository | null>;

    const ref = React.createRef<ReturnType<typeof useNewTradeForm> | null>();
    // render host and capture ref (no JSX in .ts file)
    await act(async () => {
      render(
        React.createElement(Host, {
          ref: ref,
          repoRef: repoRef,
          setPositions: setPositions as unknown as React.Dispatch<React.SetStateAction<TradeRow[]>>,
        } as React.ComponentPropsWithRef<typeof Host>)
      );
    });

    // wait for ref to be populated
    await waitFor(() => expect(ref.current).toBeDefined());

    // initial state: set form values via setForm
    await act(async () => {
      ref.current!.setForm({
        symbol: 'BTCUSD',
        entryDate: EntryDate.toInputValue(),
        size: 1,
        price: 10,
        side: 'LONG',
        status: 'OPEN',
        market: 'Crypto',
        notes: '',
        // ensure numeric fields for validation
        sl: 10,
        margin: 1,
        leverage: 1,
      });
    });

    // call handleAdd and wait for it to finish
    await act(async () => {
      await ref.current!.handleAdd();
    });

    // repo.save should have been called
    expect(repo.save as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled();

    // setPositions should be called with dto returned from repo.getAll
    expect(setPositions).toHaveBeenCalled();
    const calledWith = setPositions.mock.calls[0][0];
    // if setPositions received a function (setter), the hook calls setPositions(dto) directly
    // so ensure the argument is an array (dto list) in typical repo path
    expect(Array.isArray(calledWith) || typeof calledWith === 'function').toBeTruthy();
  });

  it('validation failure sets formErrors', async () => {
    const setPositions = vi.fn();
    const repoRef = { current: null } as React.MutableRefObject<TradeRepository | null>;
    const ref = React.createRef<ReturnType<typeof useNewTradeForm> | null>();
    await act(async () => {
      render(
        React.createElement(Host, {
          ref: ref,
          repoRef: repoRef,
          setPositions: setPositions as unknown as React.Dispatch<React.SetStateAction<TradeRow[]>>,
        } as React.ComponentPropsWithRef<typeof Host>)
      );
    });
    await waitFor(() => expect(ref.current).toBeDefined());

    // leave symbol empty to trigger validation
    await act(async () => {
      ref.current!.setForm({
        symbol: '',
        entryDate: EntryDate.toInputValue(),
        size: undefined,
        price: undefined,
        side: 'LONG',
        status: 'OPEN',
        market: 'Crypto',
        notes: '',
      });
    });

    await act(async () => {
      await ref.current!.handleAdd();
    });

    // after validation failure, formErrors should contain fields
    expect(ref.current!.formErrors).toBeDefined();
    const keys = Object.keys(ref.current!.formErrors || {});
    expect(keys.length).toBeGreaterThan(0);
  });
});

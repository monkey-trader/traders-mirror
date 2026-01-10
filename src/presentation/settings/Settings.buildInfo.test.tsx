import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Settings } from './Settings';

declare global {
  interface Window {
    __BUILD_INFO__?: { branch?: string; sha?: string; tag?: string; time?: string };
  }
}

const saveEnv = { ...process.env };

beforeEach(() => {
  // reset env and injected globals between tests
  for (const k of Object.keys(process.env)) {
    if (k.startsWith('REACT_APP_BUILD_') || k.startsWith('VITE_BUILD_'))
      delete (process.env as NodeJS.ProcessEnv)[k];
  }
  if (typeof window !== 'undefined')
    delete (window as Window & { __BUILD_INFO__?: unknown }).__BUILD_INFO__;
  // @ts-expect-error allow reassignment for tests
  global.fetch = vi.fn();
});

describe('Settings Build Info', () => {
  it('reads CRA env values', async () => {
    process.env.REACT_APP_BUILD_BRANCH = 'pr-branch';
    process.env.REACT_APP_BUILD_SHA = 'abcdef1234567';
    process.env.REACT_APP_BUILD_TAG = 'v1.2.3';
    process.env.REACT_APP_BUILD_TIME = '2026-01-01T00:00:00Z';

    render(<Settings />);

    expect(screen.getByText('pr-branch')).toBeTruthy();
    // commit shows first 7 chars
    expect(screen.getByText('abcdef1')).toBeTruthy();
    expect(screen.getByText('v1.2.3')).toBeTruthy();
    expect(screen.getByText('2026-01-01T00:00:00Z')).toBeTruthy();
  });

  it('falls back to window.__BUILD_INFO__ when env missing', async () => {
    (
      window as Window & {
        __BUILD_INFO__?: { branch?: string; sha?: string; tag?: string; time?: string };
      }
    ).__BUILD_INFO__ = {
      branch: 'win-branch',
      sha: '1234567abcdef',
      tag: 'win-tag',
      time: '2026-01-02T00:00:00Z',
    };

    render(<Settings />);

    expect(screen.getByText('win-branch')).toBeTruthy();
    expect(screen.getByText('1234567')).toBeTruthy();
    expect(screen.getByText('win-tag')).toBeTruthy();
    expect(screen.getByText('2026-01-02T00:00:00Z')).toBeTruthy();
  });

  it('fetches build-info.json when values missing', async () => {
    const json = async () => ({
      branch: 'fetched-branch',
      sha: 'deadbeef',
      tag: 'fetched-tag',
      time: '2026-01-03T00:00:00Z',
    });
    // @ts-expect-error mocked fetch
    global.fetch.mockResolvedValue({ ok: true, json });

    render(<Settings />);

    // Wait for fetched values to render
    expect(await screen.findByText('fetched-branch')).toBeTruthy();
    expect(await screen.findByText('deadbee')).toBeTruthy();
    expect(await screen.findByText('fetched-tag')).toBeTruthy();
    expect(await screen.findByText('2026-01-03T00:00:00Z')).toBeTruthy();
  });
});

afterAll(() => {
  // restore env to avoid side effects on other tests
  process.env = saveEnv;
});

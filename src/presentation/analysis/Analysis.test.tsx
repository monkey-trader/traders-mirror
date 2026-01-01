import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import Analysis from './Analysis';

describe('Analysis component', () => {
  it('renders without crashing and shows title', async () => {
    render(<Analysis />);
    expect(await screen.findByRole('heading', { name: /Marktanalyse/i })).toBeInTheDocument();
  });

  it('shows editor and list when no analysis is selected', async () => {
    render(<Analysis />);
    expect(await screen.findByText(/Analyse erstellen/i)).toBeInTheDocument();
    const allAnalysen = await screen.findAllByText(/Analysen/i);
    expect(allAnalysen.length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText(/Keine Analysen vorhanden/i)).toBeInTheDocument();
  });

  it('calls onCreateTradeSuggestion when Create Trade button is clicked', async () => {
    const mockFn = vi.fn();
    render(<Analysis onCreateTradeSuggestion={mockFn} />);
    const btn = await screen.findAllByRole('button', { name: /Create Trade/i });
    fireEvent.click(btn[0]);
    expect(mockFn).toHaveBeenCalled();
  });

  it('calls onCreateTradeSuggestion when Create example trade from analysis is clicked', async () => {
    const mockFn = vi.fn();
    render(<Analysis onCreateTradeSuggestion={mockFn} />);
    const btn = await screen.findAllByRole('button', {
      name: /Create example trade from analysis/i,
    });
    fireEvent.click(btn[0]);
    expect(mockFn).toHaveBeenCalled();
  });

  it('shows detail loader when selected is set', async () => {
    // Simulate deep-link event
    render(<Analysis />);
    const event = new CustomEvent('open-analysis', { detail: { id: 'test-id' } });
    window.dispatchEvent(event);
    expect(await screen.findByText(/Lädt Analyse/i)).toBeInTheDocument();
  });

  it('handles Delete all button and clears list', async () => {
    render(<Analysis />);
    window.confirm = vi.fn(() => true);
    const btn = await screen.findAllByRole('button', { name: /Delete all/i });
    fireEvent.click(btn[0]);
    const allAnalysen = await screen.findAllByText(/Analysen/i);
    expect(allAnalysen.length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText(/Keine Analysen vorhanden/i)).toBeInTheDocument();
  });

  it('renders compactView correctly', async () => {
    render(<Analysis compactView />);
    const container = await screen.findByRole('heading', { name: /Marktanalyse/i });
    expect(container.parentElement?.getAttribute('data-compact')).toBe('true');
  });
});

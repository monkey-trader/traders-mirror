import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Analysis from './Analysis';

describe('Analysis component', () => {
  it('renders without crashing and shows title', async () => {
    render(<Analysis />);
    expect(await screen.findByRole('heading', { name: /Marktanalyse/i })).toBeInTheDocument();
  });

  it('shows list and placeholder when no analysis is selected', async () => {
    render(<Analysis />);
    const allAnalysen = await screen.findAllByText(/Analysen/i);
    expect(allAnalysen.length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText(/Keine Analysen vorhanden/i)).toBeInTheDocument();
  });

  it('shows detail loader when selected is set', async () => {
    // Simulate deep-link event
    render(<Analysis />);
    const event = new CustomEvent('open-analysis', { detail: { id: 'test-id' } });
    window.dispatchEvent(event);
    expect(await screen.findByText(/Lädt Analyse/i)).toBeInTheDocument();
  });

  // Action buttons were removed from the Analysis UI; ensure list and placeholder still render
  it('does not render action buttons and shows list placeholder', async () => {
    render(<Analysis />);
    // Verify list placeholder exists
    expect(await screen.findByText(/Keine Analysen vorhanden/i)).toBeInTheDocument();
    // Ensure there is no Delete all button
    expect(screen.queryByRole('button', { name: /Delete all/i })).toBeNull();
  });

  it('renders compactView correctly', async () => {
    render(<Analysis compactView />);
    const container = await screen.findByRole('heading', { name: /Marktanalyse/i });
    expect(container.parentElement?.getAttribute('data-compact')).toBe('true');
  });
});

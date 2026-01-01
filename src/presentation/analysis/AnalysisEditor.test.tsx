import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisEditor } from './AnalysisEditor';

describe('AnalysisEditor', () => {
  it('renders form and submits', () => {
    const onSave = vi.fn();
    render(<AnalysisEditor onSave={onSave} />);
    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'EURUSD' } });
    fireEvent.click(screen.getByText(/Save/i));
    expect(onSave).toHaveBeenCalled();
  });
});

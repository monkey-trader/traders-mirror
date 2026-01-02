import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisEditor } from '@/presentation/analysis/AnalysisEditor';

describe('AnalysisEditor', () => {
  it('renders form and allows saving', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AnalysisEditor onSave={onSave} />);

    const symbol = screen.getByLabelText('Symbol') as HTMLInputElement;
    fireEvent.change(symbol, { target: { value: 'ETHUSD' } });

    const save = screen.getByText('Save');
    fireEvent.click(save);

    // onSave should be called with form values
    expect(onSave).toHaveBeenCalled();
  });
});

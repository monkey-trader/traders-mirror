import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest'
import { AnalysisEditor } from '@/presentation/analysis/AnalysisEditor';

describe('AnalysisEditor', () => {
  it('shows validation error when symbol is missing', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AnalysisEditor onSave={onSave} />);

    // click save without entering symbol
    fireEvent.click(screen.getByText('Save'))

    // validation from validation.ts uses German message
    await waitFor(() => expect(screen.getByText('Symbol ist erforderlich')).toBeTruthy())
    expect(onSave).not.toHaveBeenCalled()
  })

  it('calls onSave when form valid', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AnalysisEditor onSave={onSave} />);

    const symbol = screen.getByLabelText('Symbol') as HTMLInputElement;
    fireEvent.change(symbol, { target: { value: 'ETHUSD' } });

    fireEvent.click(screen.getByText('Save'))

    await waitFor(() => expect(onSave).toHaveBeenCalled())
  })
})

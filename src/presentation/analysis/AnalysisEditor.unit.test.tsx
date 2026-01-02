import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AnalysisEditor } from './AnalysisEditor'

describe('AnalysisEditor', () => {
  it('validates required symbol and shows error when submitting empty', async () => {
    const user = userEvent.setup()
    const { container } = render(<AnalysisEditor />)
    const saveBtn = screen.getByRole('button', { name: /Save|Speichern|Saving.../i })
    await user.click(saveBtn)
    // validation message should appear (German message from validateAll)
    expect(container.querySelector('#symbol-error')).not.toBeNull()
  })

  it('calls onSave with form values when valid', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<AnalysisEditor onSave={onSave} />)
    const symbolInput = screen.getByLabelText('Symbol')
    await user.type(symbolInput, 'BTCUSD')
    const saveBtn = screen.getByRole('button', { name: /Save|Speichern|Saving.../i })
    await user.click(saveBtn)
    // onSave should be called once
    expect(onSave).toHaveBeenCalled()
    const calledWith = onSave.mock.calls[0][0]
    expect(calledWith).toHaveProperty('symbol', 'BTCUSD')
    expect(calledWith).toHaveProperty('timeframes')
  })
})

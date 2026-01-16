import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ToastProvider, { useToast } from './ToastProvider'

function TestConsumer() {
  const { addToast } = useToast()
  return (
    <div>
      <button onClick={() => addToast('hello world', 'success')}>Add</button>
    </div>
  )
}

describe('ToastProvider', () => {
  // Use real timers here to avoid issues with async findByText
  beforeEach(() => {
    vi.useRealTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders toasts when addToast is called and allows dismiss', async () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    )

    // add toast
    fireEvent.click(screen.getByText('Add'))

    // toast should appear
    expect(await screen.findByText('hello world')).toBeInTheDocument()

    // click dismiss button
    const dismiss = screen.getByLabelText('Dismiss')
    fireEvent.click(dismiss)

    // wait for animation timeout (320ms + small buffer)
    await new Promise((r) => setTimeout(r, 350))

    expect(screen.queryByText('hello world')).not.toBeInTheDocument()
  })
})

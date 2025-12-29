import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, vi, expect } from 'vitest'
import { SideSelect, SideBadge } from './SideSelect'

describe('SideSelect', () => {
  it('calls onChange when select value changes and onBlur when blurred', () => {
    const onChange = vi.fn()
    const onBlur = vi.fn()
    render(<SideSelect value="LONG" onChange={onChange} ariaLabel="side" onBlur={onBlur} />)
    const sel = screen.getByLabelText('side') as HTMLSelectElement
    fireEvent.change(sel, { target: { value: 'SHORT' } })
    expect(onChange).toHaveBeenCalledWith('SHORT')
    fireEvent.blur(sel)
    expect(onBlur).toHaveBeenCalled()
  })

  it('renders badge when showBadge is true', () => {
    const onChange = vi.fn()
    const { container } = render(<SideSelect value="LONG" onChange={onChange} showBadge />)
    // the badge is rendered as a span with aria-hidden attribute
    const badgeSpan = container.querySelector('span[aria-hidden]')
    expect(badgeSpan).toBeTruthy()
    expect(badgeSpan?.textContent).toBe('LONG')
  })

  it('SideBadge responds to click and key events', () => {
    const onClick = vi.fn()
    render(<SideBadge value="SHORT" onClick={onClick} />)
    const badge = screen.getByText('SHORT')
    fireEvent.click(badge)
    expect(onClick).toHaveBeenCalled()
    // simulate Enter key
    fireEvent.keyDown(badge, { key: 'Enter' })
    expect(onClick).toHaveBeenCalled()
  })
})

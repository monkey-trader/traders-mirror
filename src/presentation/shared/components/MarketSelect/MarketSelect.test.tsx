import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, vi, expect } from 'vitest'
import MarketSelect from './MarketSelect'

describe('MarketSelect', () => {
  it('renders All/Forex/Crypto when showAll=true and calls onChange', () => {
    const onChange = vi.fn()
    render(<MarketSelect value="All" onChange={onChange} showAll />)
    expect(screen.getByText('All')).toBeDefined()
    expect(screen.getByText('Forex')).toBeDefined()
    expect(screen.getByText('Crypto')).toBeDefined()
    fireEvent.click(screen.getByText('Forex'))
    expect(onChange).toHaveBeenCalledWith('Forex')
  })

  it('does not render All when showAll=false and still calls onChange', () => {
    const onChange = vi.fn()
    render(<MarketSelect value="Forex" onChange={onChange} showAll={false} />)
    expect(screen.queryByText('All')).toBeNull()
    expect(screen.getByText('Forex')).toBeDefined()
    expect(screen.getByText('Crypto')).toBeDefined()
    fireEvent.click(screen.getByText('Crypto'))
    expect(onChange).toHaveBeenCalledWith('Crypto')
  })
})


import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from './SymbolAutocomplete.module.css'
import CoinGeckoPriceRepository from '@/infrastructure/price/repositories/CoinGeckoPriceRepository'

type Suggestion = { id: string; symbol: string; name: string; image?: string }

export type SymbolAutocompleteProps = {
  value: string
  onChange: (v: string) => void
  onSelect?: (s: Suggestion) => void
  disabled?: boolean
  placeholder?: string
  market?: string | null
  id?: string
}

const repo = new CoinGeckoPriceRepository()

export function SymbolAutocomplete({ value, onChange, onSelect, disabled, placeholder, market, id }: SymbolAutocompleteProps) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const suppressSearchRef = useRef(false)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)

  useEffect(() => setQuery(value || ''), [value])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  useEffect(() => {
    if (market && market.toLowerCase() !== 'crypto') {
      setSuggestions([])
      return
    }
    if ((query || '').trim().length < 1) {
      setSuggestions([])
      return
    }
    // If a selection just occurred, skip the immediate search to avoid
    // reopening the suggestion list. The flag is cleared on skip so
    // subsequent typing triggers searches normally.
    if (suppressSearchRef.current) {
      suppressSearchRef.current = false
      return
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await repo.searchCoins(query, 10)
        setSuggestions(res)
        setFocusedIndex(-1)
        setOpen(true)
      } catch {
        setSuggestions([])
      }
    }, 300)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query, market])

  const onPick = (s: Suggestion) => {
    // prevent the type-based effect from immediately re-searching and
    // reopening the suggestions after we programmatically set the query
    suppressSearchRef.current = true
    onChange(s.symbol.toUpperCase())
    setQuery(s.symbol.toUpperCase())
    setOpen(false)
    setFocusedIndex(-1)
    if (onSelect) onSelect(s)
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <input
        id={id}
        name={id ? `symbol_${id}` : 'symbol'}
        className={styles.input}
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === 'Esc') {
            setOpen(false)
            setSuggestions([])
            suppressSearchRef.current = true
            setFocusedIndex(-1)
            return
          }
          if (!open || suggestions.length === 0) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setFocusedIndex((idx) => (idx + 1) % suggestions.length)
            setOpen(true)
            return
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setFocusedIndex((idx) => (idx - 1 + suggestions.length) % suggestions.length)
            setOpen(true)
            return
          }
          if (e.key === 'Enter') {
            if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
              e.preventDefault()
              onPick(suggestions[focusedIndex])
            }
          }
        }}
        aria-activedescendant={open && focusedIndex >= 0 && suggestions[focusedIndex] ? `suggestion-${suggestions[focusedIndex].id}` : undefined}
        onFocus={() => {
          if (suggestions.length) setOpen(true)
        }}
      />

      {open && suggestions.length > 0 && (
        <div className={styles.suggestions} role="listbox">
          {suggestions.map((s, idx) => (
            <div
              key={s.id}
              id={`suggestion-${s.id}`}
              className={`${styles.item} ${idx === focusedIndex ? styles.focused : ''}`}
              role="option"
              aria-selected={idx === focusedIndex}
              onMouseDown={(ev) => ev.preventDefault()}
              onMouseEnter={() => setFocusedIndex(idx)}
              onClick={() => onPick(s)}
            >
              <span className={styles.icon} aria-hidden>
                {s.image ? <img src={s.image} alt={s.symbol} /> : <span style={{fontSize:12}}>{s.symbol.slice(0,2).toUpperCase()}</span>}
              </span>
              <div className={styles.label}>
                <span className={styles.symbol}>{s.symbol.toUpperCase()}</span>
                <span className={styles.name}>{s.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SymbolAutocomplete

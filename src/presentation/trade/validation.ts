// Validation helpers for the Trade form (presentation layer)
// Keeps UI validation logic isolated from the component to keep `TradeJournal.tsx` small.

import { t } from '@/presentation/i18n'

export type FormState = {
  symbol: string
  entryDate: string
  size: number
  price: number
  notes: string
}

export type FormErrors = Partial<Record<keyof FormState, string | null>>

const validateField = (name: keyof FormState, value: unknown): string | null => {
  if (name === 'symbol') {
    const v = String(value ?? '')
    if (!v || v.trim() === '') return t('symbolRequired')
    return null
  }

  if (name === 'entryDate') {
    const v = String(value ?? '')
    if (!v || v.trim() === '') return t('entryDateRequired')
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return t('invalidDate')
    return null
  }

  if (name === 'size') {
    const num = Number(value)
    if (!Number.isFinite(num)) return t('sizeNumber')
    if (num <= 0) return t('sizePositive')
    return null
  }

  if (name === 'price') {
    const num = Number(value)
    if (!Number.isFinite(num)) return t('priceNumber')
    if (num <= 0) return t('pricePositive')
    return null
  }

  return null
}

export const validateAll = (form: FormState): FormErrors => {
  return {
    symbol: validateField('symbol', form.symbol),
    entryDate: validateField('entryDate', form.entryDate),
    size: validateField('size', form.size),
    price: validateField('price', form.price),
    notes: null,
  }
}

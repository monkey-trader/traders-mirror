import type { AnalysisSuggestion } from './Analysis'

export type ValidationResult = { field?: string; message: string } | null

export function validateSuggestion(input: AnalysisSuggestion): ValidationResult[] {
  const errors: ValidationResult[] = []
  if (!input.symbol || input.symbol.trim().length === 0) {
    errors.push({ field: 'symbol', message: 'Symbol ist erforderlich' })
  }
  if (typeof input.price !== 'number' || Number.isNaN(input.price) || input.price <= 0) {
    errors.push({ field: 'price', message: 'Preis muss eine positive Zahl sein' })
  }
  if (typeof input.size !== 'undefined' && (typeof input.size !== 'number' || input.size <= 0)) {
    errors.push({ field: 'size', message: 'Größe muss positiv sein' })
  }
  if (input.side && input.side !== 'LONG' && input.side !== 'SHORT') {
    errors.push({ field: 'side', message: 'Seite muss LONG oder SHORT sein' })
  }
  return errors
}


import { describe, it, expect } from 'vitest'
import { detectColumns, detectRecurring } from '../utils/csvParser'
import type { DetectedColumns } from '../types'

// ─── detectColumns ───────────────────────────────────────────

describe('detectColumns', () => {
  it('detects BoursoBank columns', () => {
    const headers: string[] = ['Date opération', 'Libellé', 'Débit', 'Crédit']
    const result: DetectedColumns = detectColumns(headers)
    expect(result.dateCol).toBe('Date opération')
    expect(result.labelCol).toBe('Libellé')
    expect(result.debitCol).toBe('Débit')
    expect(result.creditCol).toBe('Crédit')
  })

  it('detects English columns', () => {
    const headers: string[] = ['Date', 'Label', 'Debit', 'Credit']
    const result: DetectedColumns = detectColumns(headers)
    expect(result.dateCol).toBe('Date')
    expect(result.labelCol).toBe('Label')
    expect(result.debitCol).toBe('Debit')
    expect(result.creditCol).toBe('Credit')
  })

  it('falls back to amount column when no debit column', () => {
    const headers: string[] = ['Date', 'Libelle', 'Montant']
    const result: DetectedColumns = detectColumns(headers)
    expect(result.dateCol).toBe('Date')
    expect(result.labelCol).toBe('Libelle')
    expect(result.debitCol).toBe('Montant')
    expect(result.creditCol).toBe(null)
  })

  it('returns null debitCol when no matching column found', () => {
    const headers: string[] = ['foo', 'bar', 'baz']
    const result: DetectedColumns = detectColumns(headers)
    expect(result.dateCol).toBe('foo') // fallback to index 0
    expect(result.labelCol).toBe('bar') // fallback to index 1
    expect(result.debitCol).toBe(null)
    expect(result.creditCol).toBe(null)
  })

  it('handles case insensitivity', () => {
    const headers: string[] = ['DATE', 'LIBELLE', 'DEBIT', 'CREDIT']
    const result: DetectedColumns = detectColumns(headers)
    expect(result.dateCol).toBe('DATE')
    expect(result.labelCol).toBe('LIBELLE')
    expect(result.debitCol).toBe('DEBIT')
    expect(result.creditCol).toBe('CREDIT')
  })

  it('handles columns with extra spaces', () => {
    const headers: string[] = ['  Date  ', ' Libellé ', ' Débit ']
    const result: DetectedColumns = detectColumns(headers)
    expect(result.dateCol).toBe('  Date  ')
    expect(result.labelCol).toBe(' Libellé ')
    expect(result.debitCol).toBe(' Débit ')
  })
})

// ─── detectRecurring ─────────────────────────────────────────

describe('detectRecurring', () => {
  const columns: DetectedColumns = {
    dateCol: 'date',
    labelCol: 'label',
    debitCol: 'debit',
    creditCol: null,
  }

  it('detects recurring debits with same label', () => {
    const data: Record<string, string>[] = [
      { date: '01/01/2026', label: 'LOYER RESIDENCE', debit: '1000,00' },
      { date: '01/02/2026', label: 'LOYER RESIDENCE', debit: '1000,00' },
      { date: '01/03/2026', label: 'LOYER RESIDENCE', debit: '1000,00' },
    ]
    const result = detectRecurring(data, columns)

    expect(result).toHaveLength(1)
    expect(result[0].suggestedName).toBe('LOYER RESIDENCE')
    expect(result[0].avgAmount).toBe(1000)
    expect(result[0].frequency).toBe('monthly')
    expect(result[0].occurrences).toBe(3)
    expect(result[0].isStable).toBe(true)
  })

  it('detects unstable amounts', () => {
    const data: Record<string, string>[] = [
      { date: '01/01/2026', label: 'EDF ELECTRICITE', debit: '80,00' },
      { date: '01/02/2026', label: 'EDF ELECTRICITE', debit: '120,00' },
      { date: '01/03/2026', label: 'EDF ELECTRICITE', debit: '95,00' },
    ]
    const result = detectRecurring(data, columns)

    expect(result).toHaveLength(1)
    expect(result[0].isStable).toBe(false) // variance > 10%
  })

  it('filters out groups with less than 2 occurrences', () => {
    const data: Record<string, string>[] = [
      { date: '01/01/2026', label: 'LOYER', debit: '1000,00' },
      { date: '01/01/2026', label: 'UNIQUE PAYMENT', debit: '500,00' },
    ]
    const result = detectRecurring(data, columns)
    expect(result).toHaveLength(0)
  })

  it('returns empty array when no debitCol', () => {
    const noDebitCols: DetectedColumns = { ...columns, debitCol: null }
    const data: Record<string, string>[] = [{ date: '01/01/2026', label: 'TEST', debit: '100,00' }]
    const result = detectRecurring(data, noDebitCols)
    expect(result).toEqual([])
  })

  it('handles French amount format (1 234,56)', () => {
    const data: Record<string, string>[] = [
      { date: '01/01/2026', label: 'PRET IMMO', debit: '1 234,56' },
      { date: '01/02/2026', label: 'PRET IMMO', debit: '1 234,56' },
    ]
    const result = detectRecurring(data, columns)

    expect(result).toHaveLength(1)
    expect(result[0].avgAmount).toBe(1234.56)
  })

  it('skips rows with zero or empty amounts', () => {
    const data: Record<string, string>[] = [
      { date: '01/01/2026', label: 'SOMETHING', debit: '0,00' },
      { date: '01/01/2026', label: 'SOMETHING', debit: '' },
      { date: '01/02/2026', label: 'SOMETHING', debit: '100,00' },
    ]
    const result = detectRecurring(data, columns)
    expect(result).toHaveLength(0) // only 1 valid occurrence
  })

  it('sorts by occurrences descending', () => {
    const data: Record<string, string>[] = [
      { date: '01/01/2026', label: 'A', debit: '10,00' },
      { date: '01/02/2026', label: 'A', debit: '10,00' },
      { date: '01/01/2026', label: 'B', debit: '20,00' },
      { date: '01/02/2026', label: 'B', debit: '20,00' },
      { date: '01/03/2026', label: 'B', debit: '20,00' },
    ]
    const result = detectRecurring(data, columns)

    expect(result).toHaveLength(2)
    expect(result[0].suggestedName).toBe('B')
    expect(result[1].suggestedName).toBe('A')
  })

  it('handles debit/credit split columns', () => {
    const splitCols: DetectedColumns = {
      dateCol: 'date',
      labelCol: 'label',
      debitCol: 'debit',
      creditCol: 'credit',
    }
    const data: Record<string, string>[] = [
      { date: '01/01/2026', label: 'LOYER', debit: '1000,00', credit: '' },
      { date: '01/02/2026', label: 'LOYER', debit: '1000,00', credit: '' },
      { date: '01/01/2026', label: 'SALAIRE', debit: '', credit: '3000,00' },
      { date: '01/02/2026', label: 'SALAIRE', debit: '', credit: '3000,00' },
    ]
    const result = detectRecurring(data, splitCols)

    // Only debits are detected as recurring charges
    expect(result).toHaveLength(1)
    expect(result[0].suggestedName).toBe('LOYER')
  })

  it('normalizes labels by removing dates', () => {
    const data: Record<string, string>[] = [
      { date: '01/01/2026', label: 'CB CARREFOUR 01/01/2026', debit: '85,00' },
      { date: '01/02/2026', label: 'CB CARREFOUR 01/02/2026', debit: '92,00' },
    ]
    const result = detectRecurring(data, columns)

    expect(result).toHaveLength(1)
    expect(result[0].suggestedName).toBe('CB CARREFOUR')
  })
})

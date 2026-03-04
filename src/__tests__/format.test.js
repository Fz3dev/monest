import { describe, it, expect } from 'vitest'
import { formatCurrency, formatMonth, formatMonthShort, getCurrentMonth, PAYER_OPTIONS, CATEGORIES, FREQUENCIES } from '../utils/format'

// ─── formatCurrency ──────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats integer amounts in EUR (no decimals by default)', () => {
    const result = formatCurrency(1500)
    expect(result).toMatch(/1[\s\u202f]?500/)
    expect(result).toContain('€')
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
    expect(result).toContain('€')
  })

  it('formats negative amounts', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500')
    expect(result).toContain('€')
  })

  it('formats with decimals when requested', () => {
    const result = formatCurrency(1234.56, true)
    expect(result).toMatch(/1[\s\u202f]?234,56/)
  })
})

// ─── formatMonth ─────────────────────────────────────────────

describe('formatMonth', () => {
  it('formats 2026-01 as Janvier 2026', () => {
    expect(formatMonth('2026-01')).toBe('Janvier 2026')
  })

  it('formats 2026-12 as Décembre 2026', () => {
    expect(formatMonth('2026-12')).toBe('Décembre 2026')
  })

  it('formats 2026-06 as Juin 2026', () => {
    expect(formatMonth('2026-06')).toBe('Juin 2026')
  })
})

// ─── formatMonthShort ────────────────────────────────────────

describe('formatMonthShort', () => {
  it('formats 2026-01 as Jan 26', () => {
    expect(formatMonthShort('2026-01')).toBe('Jan 26')
  })

  it('formats 2026-08 as Aoû 26', () => {
    expect(formatMonthShort('2026-08')).toBe('Aoû 26')
  })
})

// ─── getCurrentMonth ─────────────────────────────────────────

describe('getCurrentMonth', () => {
  it('returns a string in YYYY-MM format', () => {
    const result = getCurrentMonth()
    expect(result).toMatch(/^\d{4}-\d{2}$/)
  })

  it('returns a valid month number (01–12)', () => {
    const month = parseInt(getCurrentMonth().split('-')[1], 10)
    expect(month).toBeGreaterThanOrEqual(1)
    expect(month).toBeLessThanOrEqual(12)
  })
})

// ─── PAYER_OPTIONS ───────────────────────────────────────────

describe('PAYER_OPTIONS', () => {
  it('returns common + both persons for couple model', () => {
    const options = PAYER_OPTIONS({
      configModel: 'common_and_personal',
      personAName: 'Alice',
      personBName: 'Bob',
    })
    expect(options).toHaveLength(3)
    expect(options[0].value).toBe('common')
    expect(options[1].label).toBe('Alice')
    expect(options[2].label).toBe('Bob')
  })

  it('excludes common for solo mode', () => {
    const options = PAYER_OPTIONS({ configModel: 'solo', personAName: 'Alice' })
    expect(options).toHaveLength(1)
    expect(options[0].value).toBe('person_a')
  })

  it('excludes common for full_personal mode', () => {
    const options = PAYER_OPTIONS({
      configModel: 'full_personal',
      personAName: 'Alice',
      personBName: 'Bob',
    })
    expect(options.find((o) => o.value === 'common')).toBeUndefined()
    expect(options).toHaveLength(2)
  })

  it('handles null household gracefully', () => {
    const options = PAYER_OPTIONS(null)
    // null configModel includes common (not solo, not full_personal)
    expect(options).toHaveLength(2)
    expect(options[0].value).toBe('common')
    expect(options[1].label).toBe('Personne A')
  })
})

// ─── Constants ───────────────────────────────────────────────

describe('Constants', () => {
  it('CATEGORIES has 12 entries', () => {
    expect(CATEGORIES).toHaveLength(12)
    expect(CATEGORIES[0].value).toBe('logement')
    expect(CATEGORIES[11].value).toBe('autre')
  })

  it('FREQUENCIES has 4 entries', () => {
    expect(FREQUENCIES).toHaveLength(4)
    expect(FREQUENCIES.map((f) => f.value)).toEqual(['monthly', 'bimonthly', 'quarterly', 'annual'])
  })
})

import { describe, it, expect } from 'vitest'
import { generateInsights } from '../utils/insights'

const household = {
  personAName: 'Alice',
  personBName: 'Bob',
  personAColor: '#6C63FF',
  personBColor: '#F87171',
  splitMode: '50/50',
  splitRatio: 0.5,
  configModel: 'common_personal',
}

describe('generateInsights', () => {
  it('returns empty array when no household', () => {
    const result = generateInsights('2026-03', null, [], [], [], {})
    expect(result).toEqual([])
  })

  it('returns positive insight for low charges rate', () => {
    const entries = {
      '2026-03': { incomeA: 3000, incomeB: 2000, month: '2026-03' },
    }
    const charges = [
      { id: '1', name: 'Loyer', amount: 800, payer: 'common', frequency: 'monthly', active: true, category: 'logement' },
    ]
    const result = generateInsights('2026-03', household, charges, [], [], entries)
    expect(result.length).toBeGreaterThan(0)
    const chargesInsight = result.find((i) => i.message.includes('charges'))
    expect(chargesInsight).toBeTruthy()
    expect(chargesInsight.type).toBe('positive')
  })

  it('returns warning for deficit', () => {
    const entries = {
      '2026-03': { incomeA: 500, incomeB: 0, month: '2026-03' },
    }
    const charges = [
      { id: '1', name: 'Loyer', amount: 1200, payer: 'common', frequency: 'monthly', active: true, category: 'logement' },
    ]
    const result = generateInsights('2026-03', household, charges, [], [], entries)
    expect(result.length).toBeGreaterThan(0)
    const deficit = result.find((i) => i.type === 'danger')
    expect(deficit).toBeTruthy()
  })

  it('returns max 3 insights', () => {
    const entries = {
      '2026-03': { incomeA: 1500, incomeB: 1000, month: '2026-03' },
      '2026-02': { incomeA: 1500, incomeB: 1000, month: '2026-02' },
    }
    const charges = [
      { id: '1', name: 'Loyer', amount: 800, payer: 'common', frequency: 'monthly', active: true, category: 'logement' },
      { id: '2', name: 'Assurance', amount: 200, payer: 'common', frequency: 'monthly', active: true, category: 'assurance' },
      { id: '3', name: 'Credit', amount: 500, payer: 'common', frequency: 'monthly', active: true, category: 'credit' },
    ]
    const result = generateInsights('2026-03', household, charges, [], [], entries)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('detects month-over-month charge increase', () => {
    const entries = {
      '2026-03': { incomeA: 3000, incomeB: 2000, month: '2026-03' },
      '2026-02': { incomeA: 3000, incomeB: 2000, month: '2026-02' },
    }
    // Current month has more charges due to a planned expense
    const charges = [
      { id: '1', name: 'Loyer', amount: 800, payer: 'common', frequency: 'monthly', active: true, category: 'logement' },
    ]
    const planned = [
      { id: 'p1', name: 'Vacances', estimatedAmount: 2000, targetMonth: '2026-03', payer: 'common' },
    ]
    const result = generateInsights('2026-03', household, charges, [], planned, entries)
    const increaseInsight = result.find((i) => i.message.includes('hausse'))
    expect(increaseInsight).toBeTruthy()
  })

  it('returns savings rate insight even with low income', () => {
    const entries = {
      '2026-03': { incomeA: 1000, incomeB: 0, month: '2026-03' },
    }
    const charges = [
      { id: '1', name: 'Loyer', amount: 800, payer: 'common', frequency: 'monthly', active: true, category: 'logement' },
    ]
    const result = generateInsights('2026-03', household, charges, [], [], entries)
    expect(result.length).toBeGreaterThan(0)
  })
})

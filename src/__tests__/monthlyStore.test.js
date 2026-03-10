import { describe, it, expect, beforeEach } from 'vitest'
import { useMonthlyStore } from '../stores/monthlyStore'

describe('monthlyStore', () => {
  beforeEach(() => {
    useMonthlyStore.setState({ entries: {} })
  })

  it('starts with empty entries', () => {
    expect(Object.keys(useMonthlyStore.getState().entries)).toHaveLength(0)
  })

  it('sets an entry for a month', () => {
    useMonthlyStore.getState().setEntry('2026-03', { incomeA: 3500, incomeB: 2800 })
    const entry = useMonthlyStore.getState().entries['2026-03']
    expect(entry.incomeA).toBe(3500)
    expect(entry.incomeB).toBe(2800)
    expect(entry.month).toBe('2026-03')
  })

  it('getEntry returns null for missing months', () => {
    expect(useMonthlyStore.getState().getEntry('2026-01')).toBeNull()
  })

  it('getEntry returns data for existing months', () => {
    useMonthlyStore.getState().setEntry('2026-03', { incomeA: 3000 })
    const entry = useMonthlyStore.getState().getEntry('2026-03')
    expect(entry.incomeA).toBe(3000)
  })

  it('merges data when setting same month twice', () => {
    useMonthlyStore.getState().setEntry('2026-03', { incomeA: 3500 })
    useMonthlyStore.getState().setEntry('2026-03', { incomeB: 2800 })
    const entry = useMonthlyStore.getState().entries['2026-03']
    expect(entry.incomeA).toBe(3500)
    expect(entry.incomeB).toBe(2800)
  })

  it('sets variable overrides for a charge', () => {
    useMonthlyStore.getState().updateVariable('2026-03', 'charge-1', 180)
    const entry = useMonthlyStore.getState().entries['2026-03']
    expect(entry.variableOverrides['charge-1']).toBe(180)
  })

  it('preserves other overrides when adding new one', () => {
    useMonthlyStore.getState().updateVariable('2026-03', 'charge-1', 180)
    useMonthlyStore.getState().updateVariable('2026-03', 'charge-2', 90)
    const overrides = useMonthlyStore.getState().entries['2026-03'].variableOverrides
    expect(overrides['charge-1']).toBe(180)
    expect(overrides['charge-2']).toBe(90)
  })

  it('handles multiple months independently', () => {
    useMonthlyStore.getState().setEntry('2026-03', { incomeA: 3500 })
    useMonthlyStore.getState().setEntry('2026-04', { incomeA: 3600 })
    expect(useMonthlyStore.getState().entries['2026-03'].incomeA).toBe(3500)
    expect(useMonthlyStore.getState().entries['2026-04'].incomeA).toBe(3600)
  })

  it('overwrites field when set again', () => {
    useMonthlyStore.getState().setEntry('2026-03', { incomeA: 3500 })
    useMonthlyStore.getState().setEntry('2026-03', { incomeA: 4000 })
    expect(useMonthlyStore.getState().entries['2026-03'].incomeA).toBe(4000)
  })

  it('getEntry works with Date objects', () => {
    useMonthlyStore.getState().setEntry('2026-03', { incomeA: 3500 })
    const entry = useMonthlyStore.getState().getEntry(new Date(2026, 2, 15))
    expect(entry.incomeA).toBe(3500)
  })
})

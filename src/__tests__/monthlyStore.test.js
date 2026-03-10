import { describe, it, expect, beforeEach } from 'vitest'
import { useMonthlyStore } from '../stores/monthlyStore'

describe('monthlyStore — CRUD E2E', () => {
  beforeEach(() => {
    useMonthlyStore.setState({ entries: {} })
  })

  it('setEntry creates a new entry', () => {
    const store = useMonthlyStore.getState()
    store.setEntry('2026-03', { incomeA: 3000, incomeB: 2500 })
    const entry = useMonthlyStore.getState().entries['2026-03']
    expect(entry.month).toBe('2026-03')
    expect(entry.incomeA).toBe(3000)
    expect(entry.incomeB).toBe(2500)
  })

  it('setEntry merges with existing entry', () => {
    const store = useMonthlyStore.getState()
    store.setEntry('2026-03', { incomeA: 3000 })
    store.setEntry('2026-03', { incomeB: 2500 })
    const entry = useMonthlyStore.getState().entries['2026-03']
    expect(entry.incomeA).toBe(3000) // preserved
    expect(entry.incomeB).toBe(2500) // added
  })

  it('setEntry overwrites same field', () => {
    const store = useMonthlyStore.getState()
    store.setEntry('2026-03', { incomeA: 3000 })
    store.setEntry('2026-03', { incomeA: 3200 })
    expect(useMonthlyStore.getState().entries['2026-03'].incomeA).toBe(3200)
  })

  it('getEntry returns entry by string', () => {
    const store = useMonthlyStore.getState()
    store.setEntry('2026-03', { incomeA: 3000 })
    const entry = useMonthlyStore.getState().getEntry('2026-03')
    expect(entry.incomeA).toBe(3000)
  })

  it('getEntry returns entry by Date object', () => {
    const store = useMonthlyStore.getState()
    store.setEntry('2026-03', { incomeA: 3000 })
    const entry = useMonthlyStore.getState().getEntry(new Date(2026, 2, 15)) // March 2026
    expect(entry.incomeA).toBe(3000)
  })

  it('getEntry returns null for non-existent month', () => {
    expect(useMonthlyStore.getState().getEntry('2025-01')).toBeNull()
  })

  it('updateVariable sets override for a charge', () => {
    const store = useMonthlyStore.getState()
    store.updateVariable('2026-03', 'charge-123', 150)
    const entry = useMonthlyStore.getState().entries['2026-03']
    expect(entry.variableOverrides['charge-123']).toBe(150)
  })

  it('updateVariable creates entry if missing', () => {
    const store = useMonthlyStore.getState()
    store.updateVariable('2026-05', 'charge-abc', 200)
    const entry = useMonthlyStore.getState().entries['2026-05']
    expect(entry).toBeDefined()
    expect(entry.month).toBe('2026-05')
    expect(entry.variableOverrides['charge-abc']).toBe(200)
  })

  it('updateVariable preserves existing overrides', () => {
    const store = useMonthlyStore.getState()
    store.updateVariable('2026-03', 'charge-1', 100)
    store.updateVariable('2026-03', 'charge-2', 200)
    const overrides = useMonthlyStore.getState().entries['2026-03'].variableOverrides
    expect(overrides['charge-1']).toBe(100)
    expect(overrides['charge-2']).toBe(200)
  })

  it('updateVariable overwrites same chargeId', () => {
    const store = useMonthlyStore.getState()
    store.updateVariable('2026-03', 'charge-1', 100)
    store.updateVariable('2026-03', 'charge-1', 150)
    expect(useMonthlyStore.getState().entries['2026-03'].variableOverrides['charge-1']).toBe(150)
  })

  it('updateVariable preserves other entry data', () => {
    const store = useMonthlyStore.getState()
    store.setEntry('2026-03', { incomeA: 3000, incomeB: 2500 })
    store.updateVariable('2026-03', 'charge-1', 100)
    const entry = useMonthlyStore.getState().entries['2026-03']
    expect(entry.incomeA).toBe(3000)
    expect(entry.incomeB).toBe(2500)
    expect(entry.variableOverrides['charge-1']).toBe(100)
  })

  it('multiple months are independent', () => {
    const store = useMonthlyStore.getState()
    store.setEntry('2026-01', { incomeA: 2800 })
    store.setEntry('2026-02', { incomeA: 3000 })
    store.setEntry('2026-03', { incomeA: 3200 })
    expect(Object.keys(useMonthlyStore.getState().entries)).toHaveLength(3)
    expect(useMonthlyStore.getState().getEntry('2026-01').incomeA).toBe(2800)
    expect(useMonthlyStore.getState().getEntry('2026-03').incomeA).toBe(3200)
  })

  it('full lifecycle: set incomes → add overrides → update → verify', () => {
    const store = useMonthlyStore.getState()

    // Set incomes for March
    store.setEntry('2026-03', { incomeA: 3500, incomeB: 2800 })

    // Add variable overrides
    store.updateVariable('2026-03', 'edf', 135)
    store.updateVariable('2026-03', 'eau', 45)

    // Update income
    store.setEntry('2026-03', { incomeA: 3600 })

    // Verify everything merged correctly
    const entry = useMonthlyStore.getState().getEntry('2026-03')
    expect(entry.incomeA).toBe(3600)
    expect(entry.incomeB).toBe(2800) // preserved
    expect(entry.variableOverrides.edf).toBe(135) // preserved
    expect(entry.variableOverrides.eau).toBe(45)  // preserved
  })
})

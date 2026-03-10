import { describe, it, expect, beforeEach } from 'vitest'
import { useExpenseStore } from '../stores/expenseStore'

describe('expenseStore — CRUD E2E', () => {
  beforeEach(() => {
    useExpenseStore.setState({ expenses: [] })
  })

  it('adds an expense prepended (newest first) with id and createdAt', () => {
    const store = useExpenseStore.getState()
    store.addExpense({ date: '2026-03-10', amount: 45, category: 'alimentation', note: 'Courses' })
    const expenses = useExpenseStore.getState().expenses
    expect(expenses).toHaveLength(1)
    expect(expenses[0].id).toBeDefined()
    expect(expenses[0].createdAt).toBeDefined()
    expect(expenses[0].amount).toBe(45)
    expect(expenses[0].category).toBe('alimentation')
  })

  it('new expenses are prepended (newest first)', () => {
    const store = useExpenseStore.getState()
    store.addExpense({ date: '2026-03-08', amount: 10, note: 'First' })
    store.addExpense({ date: '2026-03-09', amount: 20, note: 'Second' })
    store.addExpense({ date: '2026-03-10', amount: 30, note: 'Third' })
    const expenses = useExpenseStore.getState().expenses
    expect(expenses[0].note).toBe('Third')
    expect(expenses[1].note).toBe('Second')
    expect(expenses[2].note).toBe('First')
  })

  it('removes an expense by id', () => {
    const store = useExpenseStore.getState()
    store.addExpense({ date: '2026-03-10', amount: 45, note: 'A' })
    store.addExpense({ date: '2026-03-10', amount: 30, note: 'B' })
    const idA = useExpenseStore.getState().expenses[1].id // 'A' is at index 1 (prepend)
    store.removeExpense(idA)
    expect(useExpenseStore.getState().expenses).toHaveLength(1)
    expect(useExpenseStore.getState().expenses[0].note).toBe('B')
  })

  it('updates an expense', () => {
    const store = useExpenseStore.getState()
    store.addExpense({ date: '2026-03-10', amount: 45, category: 'alimentation', note: 'Courses' })
    const id = useExpenseStore.getState().expenses[0].id
    store.updateExpense(id, { amount: 50, note: 'Courses modifiees' })
    const updated = useExpenseStore.getState().expenses[0]
    expect(updated.amount).toBe(50)
    expect(updated.note).toBe('Courses modifiees')
    expect(updated.category).toBe('alimentation') // preserved
  })

  it('getExpensesByMonth filters correctly', () => {
    const store = useExpenseStore.getState()
    store.addExpense({ date: '2026-02-15', amount: 100 })
    store.addExpense({ date: '2026-03-01', amount: 200 })
    store.addExpense({ date: '2026-03-15', amount: 300 })
    const march = useExpenseStore.getState().getExpensesByMonth('2026-03')
    expect(march).toHaveLength(2)
    expect(march.reduce((s, e) => s + e.amount, 0)).toBe(500)
  })

  it('getExpensesByMonth returns empty for no match', () => {
    const store = useExpenseStore.getState()
    store.addExpense({ date: '2026-03-10', amount: 100 })
    expect(useExpenseStore.getState().getExpensesByMonth('2025-01')).toHaveLength(0)
  })

  it('getExpensesByCategory groups amounts', () => {
    const store = useExpenseStore.getState()
    store.addExpense({ date: '2026-03-10', amount: 50, category: 'alimentation' })
    store.addExpense({ date: '2026-03-11', amount: 30, category: 'alimentation' })
    store.addExpense({ date: '2026-03-12', amount: 25, category: 'transport' })
    store.addExpense({ date: '2026-02-01', amount: 100, category: 'alimentation' }) // different month
    const cats = useExpenseStore.getState().getExpensesByCategory('2026-03')
    expect(cats.alimentation).toBe(80)
    expect(cats.transport).toBe(25)
    expect(cats.logement).toBeUndefined()
  })

  it('getExpensesByCategory defaults missing category to autre', () => {
    const store = useExpenseStore.getState()
    store.addExpense({ date: '2026-03-10', amount: 50 }) // no category
    const cats = useExpenseStore.getState().getExpensesByCategory('2026-03')
    expect(cats.autre).toBe(50)
  })

  it('getTotalByMonth sums correctly', () => {
    const store = useExpenseStore.getState()
    store.addExpense({ date: '2026-03-10', amount: 50 })
    store.addExpense({ date: '2026-03-11', amount: 30 })
    store.addExpense({ date: '2026-03-12', amount: 20 })
    expect(useExpenseStore.getState().getTotalByMonth('2026-03')).toBe(100)
  })

  it('getTotalByMonth returns 0 for empty month', () => {
    expect(useExpenseStore.getState().getTotalByMonth('2026-01')).toBe(0)
  })

  it('expense with missing date is excluded from month queries', () => {
    const store = useExpenseStore.getState()
    store.addExpense({ amount: 50, category: 'autre' }) // no date
    expect(useExpenseStore.getState().getExpensesByMonth('2026-03')).toHaveLength(0)
    expect(useExpenseStore.getState().getTotalByMonth('2026-03')).toBe(0)
  })

  it('full lifecycle: add → update → query → remove', () => {
    const store = useExpenseStore.getState()

    // Add 3 expenses
    store.addExpense({ date: '2026-03-10', amount: 45, category: 'alimentation', note: 'Courses' })
    store.addExpense({ date: '2026-03-10', amount: 25, category: 'transport', note: 'Essence' })
    store.addExpense({ date: '2026-03-11', amount: 60, category: 'loisirs', note: 'Restaurant' })

    // Query
    expect(useExpenseStore.getState().getTotalByMonth('2026-03')).toBe(130)
    const cats = useExpenseStore.getState().getExpensesByCategory('2026-03')
    expect(cats.alimentation).toBe(45)
    expect(cats.transport).toBe(25)
    expect(cats.loisirs).toBe(60)

    // Update
    const essenceId = useExpenseStore.getState().expenses.find(e => e.note === 'Essence').id
    useExpenseStore.getState().updateExpense(essenceId, { amount: 35 })
    expect(useExpenseStore.getState().getTotalByMonth('2026-03')).toBe(140)

    // Remove
    useExpenseStore.getState().removeExpense(essenceId)
    expect(useExpenseStore.getState().expenses).toHaveLength(2)
    expect(useExpenseStore.getState().getTotalByMonth('2026-03')).toBe(105)
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { useExpenseStore } from '../stores/expenseStore'

describe('expenseStore', () => {
  beforeEach(() => {
    useExpenseStore.setState({ expenses: [] })
  })

  it('adds an expense with generated id', () => {
    useExpenseStore.getState().addExpense({ date: '2026-03-10', amount: 45, category: 'alimentation', note: 'Courses' })
    const expenses = useExpenseStore.getState().expenses
    expect(expenses).toHaveLength(1)
    expect(expenses[0].amount).toBe(45)
    expect(expenses[0].id).toBeTruthy()
  })

  it('prepends new expenses (most recent first)', () => {
    const store = useExpenseStore.getState()
    store.addExpense({ date: '2026-03-10', amount: 10, category: 'autre', note: 'First' })
    store.addExpense({ date: '2026-03-11', amount: 20, category: 'autre', note: 'Second' })
    const expenses = useExpenseStore.getState().expenses
    expect(expenses[0].note).toBe('Second')
    expect(expenses[1].note).toBe('First')
  })

  it('removes an expense', () => {
    useExpenseStore.getState().addExpense({ date: '2026-03-10', amount: 45, category: 'alimentation' })
    const id = useExpenseStore.getState().expenses[0].id
    useExpenseStore.getState().removeExpense(id)
    expect(useExpenseStore.getState().expenses).toHaveLength(0)
  })

  it('updates an expense', () => {
    useExpenseStore.getState().addExpense({ date: '2026-03-10', amount: 45, category: 'alimentation', note: 'Courses' })
    const id = useExpenseStore.getState().expenses[0].id
    useExpenseStore.getState().updateExpense(id, { amount: 50, note: 'Courses Leclerc' })
    expect(useExpenseStore.getState().expenses[0].amount).toBe(50)
    expect(useExpenseStore.getState().expenses[0].note).toBe('Courses Leclerc')
  })

  it('gets expenses by month', () => {
    const store = useExpenseStore.getState()
    store.addExpense({ date: '2026-03-10', amount: 10, category: 'autre' })
    store.addExpense({ date: '2026-03-15', amount: 20, category: 'autre' })
    store.addExpense({ date: '2026-04-01', amount: 30, category: 'autre' })
    expect(useExpenseStore.getState().getExpensesByMonth('2026-03')).toHaveLength(2)
    expect(useExpenseStore.getState().getExpensesByMonth('2026-04')).toHaveLength(1)
  })

  it('gets total by month', () => {
    const store = useExpenseStore.getState()
    store.addExpense({ date: '2026-03-10', amount: 45, category: 'alimentation' })
    store.addExpense({ date: '2026-03-11', amount: 35, category: 'transport' })
    store.addExpense({ date: '2026-04-01', amount: 100, category: 'autre' })
    expect(useExpenseStore.getState().getTotalByMonth('2026-03')).toBe(80)
    expect(useExpenseStore.getState().getTotalByMonth('2026-04')).toBe(100)
  })

  it('gets expenses grouped by category', () => {
    const store = useExpenseStore.getState()
    store.addExpense({ date: '2026-03-10', amount: 45, category: 'alimentation' })
    store.addExpense({ date: '2026-03-11', amount: 35, category: 'transport' })
    store.addExpense({ date: '2026-03-12', amount: 18, category: 'alimentation' })
    const cats = useExpenseStore.getState().getExpensesByCategory('2026-03')
    expect(cats.alimentation).toBe(63)
    expect(cats.transport).toBe(35)
  })

  it('returns 0 total for months with no expenses', () => {
    expect(useExpenseStore.getState().getTotalByMonth('2026-01')).toBe(0)
  })

  it('handles expenses without category', () => {
    useExpenseStore.getState().addExpense({ date: '2026-03-10', amount: 50 })
    const cats = useExpenseStore.getState().getExpensesByCategory('2026-03')
    expect(cats.autre).toBe(50)
  })

  it('full CRUD lifecycle', () => {
    const store = useExpenseStore.getState()
    store.addExpense({ date: '2026-03-10', amount: 45, category: 'alimentation', note: 'Courses' })
    const id = useExpenseStore.getState().expenses[0].id

    // Update
    useExpenseStore.getState().updateExpense(id, { amount: 55 })
    expect(useExpenseStore.getState().expenses[0].amount).toBe(55)

    // Check total updated
    expect(useExpenseStore.getState().getTotalByMonth('2026-03')).toBe(55)

    // Delete
    useExpenseStore.getState().removeExpense(id)
    expect(useExpenseStore.getState().expenses).toHaveLength(0)
    expect(useExpenseStore.getState().getTotalByMonth('2026-03')).toBe(0)
  })
})

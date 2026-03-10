import { describe, it, expect, beforeEach } from 'vitest'
import { useSavingsStore } from '../stores/savingsStore'

describe('savingsStore — CRUD E2E', () => {
  beforeEach(() => {
    useSavingsStore.setState({ goals: [] })
  })

  it('adds a goal with id, currentAmount=0, and createdAt', () => {
    const store = useSavingsStore.getState()
    store.addGoal({ name: 'Voyage Japon', targetAmount: 5000, icon: '✈️', color: '#6C63FF' })
    const goals = useSavingsStore.getState().goals
    expect(goals).toHaveLength(1)
    expect(goals[0].id).toBeDefined()
    expect(goals[0].currentAmount).toBe(0)
    expect(goals[0].createdAt).toBeDefined()
    expect(goals[0].name).toBe('Voyage Japon')
    expect(goals[0].targetAmount).toBe(5000)
  })

  it('preserves currentAmount if provided', () => {
    const store = useSavingsStore.getState()
    store.addGoal({ name: 'Test', targetAmount: 1000, currentAmount: 500 })
    expect(useSavingsStore.getState().goals[0].currentAmount).toBe(500)
  })

  it('updates a goal by id', () => {
    const store = useSavingsStore.getState()
    store.addGoal({ name: 'Voiture', targetAmount: 15000 })
    const id = useSavingsStore.getState().goals[0].id
    store.updateGoal(id, { targetAmount: 18000, name: 'Voiture neuve' })
    const g = useSavingsStore.getState().goals[0]
    expect(g.targetAmount).toBe(18000)
    expect(g.name).toBe('Voiture neuve')
    expect(g.currentAmount).toBe(0) // preserved
  })

  it('removes a goal', () => {
    const store = useSavingsStore.getState()
    store.addGoal({ name: 'A', targetAmount: 100 })
    store.addGoal({ name: 'B', targetAmount: 200 })
    const idA = useSavingsStore.getState().goals[0].id
    store.removeGoal(idA)
    expect(useSavingsStore.getState().goals).toHaveLength(1)
    expect(useSavingsStore.getState().goals[0].name).toBe('B')
  })

  it('contribute increases currentAmount', () => {
    const store = useSavingsStore.getState()
    store.addGoal({ name: 'Epargne', targetAmount: 5000 })
    const id = useSavingsStore.getState().goals[0].id
    store.contribute(id, 500)
    expect(useSavingsStore.getState().goals[0].currentAmount).toBe(500)
    store.contribute(id, 300)
    expect(useSavingsStore.getState().goals[0].currentAmount).toBe(800)
  })

  it('negative contribution (withdrawal) works', () => {
    const store = useSavingsStore.getState()
    store.addGoal({ name: 'Test', targetAmount: 1000, currentAmount: 500 })
    const id = useSavingsStore.getState().goals[0].id
    store.contribute(id, -200)
    expect(useSavingsStore.getState().goals[0].currentAmount).toBe(300)
  })

  it('contribute to non-existent id does not crash', () => {
    const store = useSavingsStore.getState()
    store.addGoal({ name: 'Test', targetAmount: 1000 })
    store.contribute('fake-id', 100) // should not throw
    expect(useSavingsStore.getState().goals[0].currentAmount).toBe(0)
  })

  it('over-savings (currentAmount > targetAmount) is allowed', () => {
    const store = useSavingsStore.getState()
    store.addGoal({ name: 'Test', targetAmount: 100 })
    const id = useSavingsStore.getState().goals[0].id
    store.contribute(id, 200)
    expect(useSavingsStore.getState().goals[0].currentAmount).toBe(200)
  })

  it('getTotalSaved sums all currentAmounts', () => {
    const store = useSavingsStore.getState()
    store.addGoal({ name: 'A', targetAmount: 1000, currentAmount: 200 })
    store.addGoal({ name: 'B', targetAmount: 2000, currentAmount: 500 })
    expect(useSavingsStore.getState().getTotalSaved()).toBe(700)
  })

  it('getTotalTarget sums all targetAmounts', () => {
    const store = useSavingsStore.getState()
    store.addGoal({ name: 'A', targetAmount: 1000 })
    store.addGoal({ name: 'B', targetAmount: 2000 })
    expect(useSavingsStore.getState().getTotalTarget()).toBe(3000)
  })

  it('getTotalSaved with empty goals returns 0', () => {
    expect(useSavingsStore.getState().getTotalSaved()).toBe(0)
  })

  it('getTotalTarget with empty goals returns 0', () => {
    expect(useSavingsStore.getState().getTotalTarget()).toBe(0)
  })

  it('full lifecycle: add → contribute → update → remove', () => {
    const store = useSavingsStore.getState()
    store.addGoal({ name: 'Voyage', targetAmount: 3000, icon: '✈️' })
    const id = useSavingsStore.getState().goals[0].id

    // Contribute 3 times
    store.contribute(id, 500)
    store.contribute(id, 500)
    store.contribute(id, 500)
    expect(useSavingsStore.getState().goals[0].currentAmount).toBe(1500)

    // Update target
    store.updateGoal(id, { targetAmount: 4000 })
    expect(useSavingsStore.getState().goals[0].targetAmount).toBe(4000)
    expect(useSavingsStore.getState().goals[0].currentAmount).toBe(1500) // preserved

    // Remove
    store.removeGoal(id)
    expect(useSavingsStore.getState().goals).toHaveLength(0)
    expect(useSavingsStore.getState().getTotalSaved()).toBe(0)
  })
})

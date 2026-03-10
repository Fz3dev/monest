import { describe, it, expect, beforeEach } from 'vitest'
import { useSavingsStore } from '../stores/savingsStore'

describe('savingsStore', () => {
  beforeEach(() => {
    useSavingsStore.setState({ goals: [] })
  })

  it('adds a goal with generated id and zero currentAmount', () => {
    useSavingsStore.getState().addGoal({ name: 'Voyage', targetAmount: 3000, icon: '✈️', color: '#6C63FF' })
    const goals = useSavingsStore.getState().goals
    expect(goals).toHaveLength(1)
    expect(goals[0].name).toBe('Voyage')
    expect(goals[0].currentAmount).toBe(0)
    expect(goals[0].id).toBeTruthy()
  })

  it('updates a goal', () => {
    useSavingsStore.getState().addGoal({ name: 'Voyage', targetAmount: 3000 })
    const id = useSavingsStore.getState().goals[0].id
    useSavingsStore.getState().updateGoal(id, { targetAmount: 4000, name: 'Grand voyage' })
    expect(useSavingsStore.getState().goals[0].targetAmount).toBe(4000)
    expect(useSavingsStore.getState().goals[0].name).toBe('Grand voyage')
  })

  it('removes a goal', () => {
    useSavingsStore.getState().addGoal({ name: 'Voyage', targetAmount: 3000 })
    const id = useSavingsStore.getState().goals[0].id
    useSavingsStore.getState().removeGoal(id)
    expect(useSavingsStore.getState().goals).toHaveLength(0)
  })

  it('contributes positive amounts', () => {
    useSavingsStore.getState().addGoal({ name: 'Voyage', targetAmount: 3000 })
    const id = useSavingsStore.getState().goals[0].id
    useSavingsStore.getState().contribute(id, 500)
    useSavingsStore.getState().contribute(id, 300)
    expect(useSavingsStore.getState().goals[0].currentAmount).toBe(800)
  })

  it('allows withdrawal via negative contribution', () => {
    useSavingsStore.getState().addGoal({ name: 'Voyage', targetAmount: 3000 })
    const id = useSavingsStore.getState().goals[0].id
    useSavingsStore.getState().contribute(id, 1000)
    useSavingsStore.getState().contribute(id, -300)
    expect(useSavingsStore.getState().goals[0].currentAmount).toBe(700)
  })

  it('allows over-saving beyond target', () => {
    useSavingsStore.getState().addGoal({ name: 'Small', targetAmount: 100 })
    const id = useSavingsStore.getState().goals[0].id
    useSavingsStore.getState().contribute(id, 200)
    expect(useSavingsStore.getState().goals[0].currentAmount).toBe(200)
  })

  it('computes total saved across all goals', () => {
    const store = useSavingsStore.getState()
    store.addGoal({ name: 'A', targetAmount: 1000 })
    store.addGoal({ name: 'B', targetAmount: 2000 })
    const [a, b] = useSavingsStore.getState().goals
    useSavingsStore.getState().contribute(a.id, 500)
    useSavingsStore.getState().contribute(b.id, 800)
    expect(useSavingsStore.getState().getTotalSaved()).toBe(1300)
  })

  it('computes total target across all goals', () => {
    const store = useSavingsStore.getState()
    store.addGoal({ name: 'A', targetAmount: 1000 })
    store.addGoal({ name: 'B', targetAmount: 2000 })
    expect(useSavingsStore.getState().getTotalTarget()).toBe(3000)
  })

  it('returns 0 totals when no goals exist', () => {
    expect(useSavingsStore.getState().getTotalSaved()).toBe(0)
    expect(useSavingsStore.getState().getTotalTarget()).toBe(0)
  })

  it('full lifecycle: add, contribute, update, remove', () => {
    const store = useSavingsStore.getState()
    store.addGoal({ name: 'Fonds urgence', targetAmount: 5000 })
    const id = useSavingsStore.getState().goals[0].id

    useSavingsStore.getState().contribute(id, 1000)
    expect(useSavingsStore.getState().goals[0].currentAmount).toBe(1000)

    useSavingsStore.getState().updateGoal(id, { targetAmount: 6000 })
    expect(useSavingsStore.getState().goals[0].targetAmount).toBe(6000)
    expect(useSavingsStore.getState().goals[0].currentAmount).toBe(1000) // preserved

    useSavingsStore.getState().removeGoal(id)
    expect(useSavingsStore.getState().goals).toHaveLength(0)
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { useHouseholdStore } from '../stores/householdStore'

describe('householdStore — CRUD E2E', () => {
  beforeEach(() => {
    useHouseholdStore.setState({ household: null })
  })

  it('starts with null household', () => {
    expect(useHouseholdStore.getState().household).toBeNull()
  })

  it('setHousehold sets the full object', () => {
    const store = useHouseholdStore.getState()
    store.setHousehold({
      id: 'h-1',
      name: 'Famille Dupont',
      personAName: 'Alice',
      personBName: 'Bob',
      configModel: 'common_and_personal',
      splitRatio: 0.5,
      splitMode: '50/50',
      personAColor: '#6C63FF',
      personBColor: '#ec4899',
    })
    const h = useHouseholdStore.getState().household
    expect(h.name).toBe('Famille Dupont')
    expect(h.personAName).toBe('Alice')
    expect(h.personBName).toBe('Bob')
    expect(h.splitRatio).toBe(0.5)
  })

  it('updateHousehold merges into existing', () => {
    const store = useHouseholdStore.getState()
    store.setHousehold({ id: 'h-1', name: 'Famille', personAName: 'Alice', personBName: 'Bob', splitRatio: 0.5 })
    store.updateHousehold({ name: 'Famille Dupont', splitRatio: 0.6 })
    const h = useHouseholdStore.getState().household
    expect(h.name).toBe('Famille Dupont')
    expect(h.splitRatio).toBe(0.6)
    expect(h.personAName).toBe('Alice') // preserved
    expect(h.personBName).toBe('Bob')   // preserved
  })

  it('updateHousehold on null household stays null', () => {
    const store = useHouseholdStore.getState()
    store.updateHousehold({ name: 'Test' })
    expect(useHouseholdStore.getState().household).toBeNull()
  })

  it('resetHousehold clears to null', () => {
    const store = useHouseholdStore.getState()
    store.setHousehold({ id: 'h-1', name: 'Test' })
    expect(useHouseholdStore.getState().household).not.toBeNull()
    store.resetHousehold()
    expect(useHouseholdStore.getState().household).toBeNull()
  })

  it('full lifecycle: create → update → reset', () => {
    const store = useHouseholdStore.getState()

    // Create
    store.setHousehold({
      id: 'h-1',
      name: 'Foyer Test',
      personAName: 'Marie',
      configModel: 'solo',
      splitRatio: 1,
      splitMode: '50/50',
    })
    expect(useHouseholdStore.getState().household.name).toBe('Foyer Test')

    // Add partner
    store.updateHousehold({
      personBName: 'Pierre',
      configModel: 'common_and_personal',
      splitMode: 'prorata',
      splitRatio: 0.55,
    })
    const h = useHouseholdStore.getState().household
    expect(h.personAName).toBe('Marie')
    expect(h.personBName).toBe('Pierre')
    expect(h.configModel).toBe('common_and_personal')

    // Reset
    store.resetHousehold()
    expect(useHouseholdStore.getState().household).toBeNull()
  })
})

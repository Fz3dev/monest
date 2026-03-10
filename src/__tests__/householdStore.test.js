import { describe, it, expect, beforeEach } from 'vitest'
import { useHouseholdStore } from '../stores/householdStore'

describe('householdStore', () => {
  beforeEach(() => {
    useHouseholdStore.setState({ household: null })
  })

  it('starts with null household', () => {
    expect(useHouseholdStore.getState().household).toBeNull()
  })

  it('sets household', () => {
    useHouseholdStore.getState().setHousehold({
      id: 'h-1', name: 'Dupont', personAName: 'Alice', personBName: 'Bob',
      configModel: 'common_and_personal', splitRatio: 0.5, splitMode: '50/50',
    })
    expect(useHouseholdStore.getState().household.name).toBe('Dupont')
    expect(useHouseholdStore.getState().household.personAName).toBe('Alice')
  })

  it('updates household with merge', () => {
    useHouseholdStore.getState().setHousehold({ id: 'h-1', name: 'Dupont', personAName: 'Alice' })
    useHouseholdStore.getState().updateHousehold({ personAName: 'Alicia' })
    const h = useHouseholdStore.getState().household
    expect(h.personAName).toBe('Alicia')
    expect(h.name).toBe('Dupont') // preserved
  })

  it('updateHousehold does nothing when household is null', () => {
    useHouseholdStore.getState().updateHousehold({ personAName: 'Alice' })
    expect(useHouseholdStore.getState().household).toBeNull()
  })

  it('resets household to null', () => {
    useHouseholdStore.getState().setHousehold({ id: 'h-1', name: 'Test' })
    useHouseholdStore.getState().resetHousehold()
    expect(useHouseholdStore.getState().household).toBeNull()
  })
})

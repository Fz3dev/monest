import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Household, CurrencyOption } from '../types'

export const DEFAULT_CURRENCY = 'EUR'

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'CHF', label: 'CHF (CHF)', symbol: 'CHF' },
  { value: 'MAD', label: 'MAD (MAD)', symbol: 'MAD' },
  { value: 'CAD', label: 'CAD (CA$)', symbol: 'CA$' },
]

interface HouseholdState {
  household: Household | null
  setHousehold: (household: Household) => void
  updateHousehold: (updates: Partial<Household>) => void
  resetHousehold: () => void
}

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set) => ({
      household: null,
      setHousehold: (household: Household) => set({ household }),
      updateHousehold: (updates: Partial<Household>) =>
        set((state) => ({
          household: state.household ? { ...state.household, ...updates } : null,
        })),
      resetHousehold: () => set({ household: null }),
    }),
    {
      name: 'monest-household',
      version: 1,
      migrate: (state) => state as HouseholdState,
    }
  )
)

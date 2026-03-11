import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const DEFAULT_CURRENCY = 'EUR'

export const SUPPORTED_CURRENCIES = [
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'CHF', label: 'CHF (CHF)', symbol: 'CHF' },
  { value: 'MAD', label: 'MAD (MAD)', symbol: 'MAD' },
  { value: 'CAD', label: 'CAD (CA$)', symbol: 'CA$' },
]

export const useHouseholdStore = create(
  persist(
    (set) => ({
      household: null,
      setHousehold: (household) => set({ household }),
      updateHousehold: (updates) =>
        set((state) => ({
          household: state.household ? { ...state.household, ...updates } : null,
        })),
      resetHousehold: () => set({ household: null }),
    }),
    { name: 'monest-household', version: 1 }
  )
)

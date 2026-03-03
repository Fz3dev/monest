import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
    { name: 'payme-household' }
  )
)

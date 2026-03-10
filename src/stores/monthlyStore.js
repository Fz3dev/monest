import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { syncMonthlyEntryToSupabase } from '../lib/syncBridge'

export const useMonthlyStore = create(
  persist(
    (set, get) => ({
      entries: {},

      getEntry: (month) => {
        const key = typeof month === 'string' ? month : format(month, 'yyyy-MM')
        return get().entries[key] || null
      },

      setEntry: (month, data) => {
        set((state) => ({
          entries: {
            ...state.entries,
            [month]: { ...state.entries[month], ...data, month },
          },
        }))
        const updated = get().entries[month]
        if (updated) syncMonthlyEntryToSupabase(month, updated)
      },

      updateVariable: (month, chargeId, amount) => {
        set((state) => {
          const entry = state.entries[month] || { month }
          const overrides = entry.variableOverrides || {}
          return {
            entries: {
              ...state.entries,
              [month]: {
                ...entry,
                variableOverrides: { ...overrides, [chargeId]: amount },
              },
            },
          }
        })
        const updated = get().entries[month]
        if (updated) syncMonthlyEntryToSupabase(month, updated)
      },
    }),
    { name: 'monest-monthly', version: 1 }
  )
)

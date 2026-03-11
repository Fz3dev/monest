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
        const updated = { ...get().entries[month], ...data, month }
        set((state) => ({
          entries: { ...state.entries, [month]: updated },
        }))
        // Pass only the changed field names for field-level sync
        syncMonthlyEntryToSupabase(month, updated, Object.keys(data))
      },

      updateVariable: (month, chargeId, amount) => {
        const entry = get().entries[month] || { month }
        const overrides = entry.variableOverrides || {}
        const updated = {
          ...entry,
          variableOverrides: { ...overrides, [chargeId]: amount },
        }
        set((state) => ({
          entries: { ...state.entries, [month]: updated },
        }))
        syncMonthlyEntryToSupabase(month, updated, ['variableOverrides'])
      },
    }),
    {
      name: 'monest-monthly',
      version: 1,
      migrate: (state) => state,
    }
  )
)

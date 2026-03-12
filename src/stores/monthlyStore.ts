import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { syncMonthlyEntryToSupabase } from '../lib/syncBridge'
import type { MonthlyEntry } from '../types'

interface MonthlyState {
  entries: Record<string, MonthlyEntry>

  getEntry: (month: string | Date) => MonthlyEntry | null
  setEntry: (month: string, data: Partial<MonthlyEntry>) => void
  updateVariable: (month: string, chargeId: string, amount: number) => void
  toggleChargeForMonth: (month: string, chargeId: string) => void
}

export const useMonthlyStore = create<MonthlyState>()(
  persist(
    (set, get) => ({
      entries: {},

      getEntry: (month: string | Date): MonthlyEntry | null => {
        const key = typeof month === 'string' ? month : format(month, 'yyyy-MM')
        return get().entries[key] || null
      },

      setEntry: (month: string, data: Partial<MonthlyEntry>) => {
        const updated = { ...get().entries[month], ...data, month } as MonthlyEntry
        set((state) => ({
          entries: { ...state.entries, [month]: updated },
        }))
        // Pass only the changed field names for field-level sync
        syncMonthlyEntryToSupabase(month, updated, Object.keys(data))
      },

      updateVariable: (month: string, chargeId: string, amount: number) => {
        const entry = get().entries[month] || ({ month } as MonthlyEntry)
        const overrides = entry.variableOverrides || {}
        const updated: MonthlyEntry = {
          ...entry,
          variableOverrides: { ...overrides, [chargeId]: amount },
        }
        set((state) => ({
          entries: { ...state.entries, [month]: updated },
        }))
        syncMonthlyEntryToSupabase(month, updated, ['variableOverrides'])
      },

      toggleChargeForMonth: (month: string, chargeId: string) => {
        const entry = get().entries[month] || ({ month } as MonthlyEntry)
        const disabled = new Set(entry.disabledCharges || [])
        if (disabled.has(chargeId)) {
          disabled.delete(chargeId)
        } else {
          disabled.add(chargeId)
        }
        const updated: MonthlyEntry = {
          ...entry,
          disabledCharges: [...disabled],
        }
        set((state) => ({
          entries: { ...state.entries, [month]: updated },
        }))
        syncMonthlyEntryToSupabase(month, updated, ['disabledCharges'])
      },
    }),
    {
      name: 'monest-monthly',
      version: 1,
      migrate: (state) => state as MonthlyState,
    }
  )
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { syncToSupabase, deleteFromSupabase } from '../lib/syncBridge'
import type { SavingsGoal } from '../types'

const generateId = (): string => crypto.randomUUID()

interface SavingsState {
  goals: SavingsGoal[]

  addGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void
  removeGoal: (id: string) => void
  contribute: (id: string, amount: number) => void
  getTotalSaved: () => number
  getTotalTarget: () => number
}

export const useSavingsStore = create<SavingsState>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (goal) => {
        const now = new Date().toISOString()
        const newGoal: SavingsGoal = {
          ...goal,
          id: generateId(),
          currentAmount: goal.currentAmount || 0,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ goals: [...state.goals, newGoal] }))
        syncToSupabase('savings_goals', newGoal)
      },

      updateGoal: (id: string, updates: Partial<SavingsGoal>) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g)),
        }))
        const updated = get().goals.find((g) => g.id === id)
        if (updated) syncToSupabase('savings_goals', updated)
      },

      removeGoal: (id: string) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }))
        deleteFromSupabase('savings_goals', id)
      },

      contribute: (id: string, amount: number) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, currentAmount: g.currentAmount + amount, updatedAt: new Date().toISOString() } : g
          ),
        }))
        const updated = get().goals.find((g) => g.id === id)
        if (updated) syncToSupabase('savings_goals', updated)
      },

      getTotalSaved: (): number => get().goals.reduce((sum, g) => sum + g.currentAmount, 0),
      getTotalTarget: (): number => get().goals.reduce((sum, g) => sum + g.targetAmount, 0),
    }),
    {
      name: 'monest-savings',
      version: 1,
      migrate: (state) => state as SavingsState,
    }
  )
)

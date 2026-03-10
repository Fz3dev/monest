import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { syncToSupabase, deleteFromSupabase } from '../lib/syncBridge'

const generateId = () => crypto.randomUUID()

export const useSavingsStore = create(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (goal) => {
        const now = new Date().toISOString()
        const newGoal = {
          ...goal,
          id: generateId(),
          currentAmount: goal.currentAmount || 0,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ goals: [...state.goals, newGoal] }))
        syncToSupabase('savings_goals', newGoal)
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g)),
        }))
        const updated = get().goals.find((g) => g.id === id)
        if (updated) syncToSupabase('savings_goals', updated)
      },

      removeGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }))
        deleteFromSupabase('savings_goals', id)
      },

      contribute: (id, amount) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, currentAmount: g.currentAmount + amount, updatedAt: new Date().toISOString() } : g
          ),
        }))
        const updated = get().goals.find((g) => g.id === id)
        if (updated) syncToSupabase('savings_goals', updated)
      },

      getTotalSaved: () => get().goals.reduce((sum, g) => sum + g.currentAmount, 0),
      getTotalTarget: () => get().goals.reduce((sum, g) => sum + g.targetAmount, 0),
    }),
    { name: 'monest-savings', version: 1 }
  )
)

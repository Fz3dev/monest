import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const generateId = () => crypto.randomUUID()

export const useSavingsStore = create(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (goal) =>
        set((state) => ({
          goals: [
            ...state.goals,
            {
              ...goal,
              id: generateId(),
              currentAmount: goal.currentAmount || 0,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateGoal: (id, updates) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),

      removeGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      contribute: (id, amount) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g
          ),
        })),

      getTotalSaved: () => get().goals.reduce((sum, g) => sum + g.currentAmount, 0),
      getTotalTarget: () => get().goals.reduce((sum, g) => sum + g.targetAmount, 0),
    }),
    { name: 'monest-savings', version: 1 }
  )
)

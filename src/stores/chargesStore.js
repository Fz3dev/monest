import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const generateId = () => crypto.randomUUID()

export const useChargesStore = create(
  persist(
    (set) => ({
      fixedCharges: [],
      installmentPayments: [],
      plannedExpenses: [],

      addFixedCharge: (charge) =>
        set((state) => ({
          fixedCharges: [...state.fixedCharges, { ...charge, id: generateId(), active: true }],
        })),
      updateFixedCharge: (id, updates) =>
        set((state) => ({
          fixedCharges: state.fixedCharges.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      removeFixedCharge: (id) =>
        set((state) => ({
          fixedCharges: state.fixedCharges.filter((c) => c.id !== id),
        })),
      toggleFixedCharge: (id) =>
        set((state) => ({
          fixedCharges: state.fixedCharges.map((c) => (c.id === id ? { ...c, active: !c.active } : c)),
        })),

      addInstallment: (payment) =>
        set((state) => ({
          installmentPayments: [
            ...state.installmentPayments,
            { ...payment, id: generateId(), createdAt: new Date().toISOString() },
          ],
        })),
      updateInstallment: (id, updates) =>
        set((state) => ({
          installmentPayments: state.installmentPayments.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      removeInstallment: (id) =>
        set((state) => ({
          installmentPayments: state.installmentPayments.filter((p) => p.id !== id),
        })),

      addPlannedExpense: (expense) =>
        set((state) => ({
          plannedExpenses: [...state.plannedExpenses, { ...expense, id: generateId() }],
        })),
      updatePlannedExpense: (id, updates) =>
        set((state) => ({
          plannedExpenses: state.plannedExpenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      removePlannedExpense: (id) =>
        set((state) => ({
          plannedExpenses: state.plannedExpenses.filter((e) => e.id !== id),
        })),
    }),
    { name: 'monest-charges', version: 1 }
  )
)

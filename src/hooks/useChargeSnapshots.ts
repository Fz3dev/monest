import { useCallback } from 'react'
import { format } from 'date-fns'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { computeMonth } from '../utils/calculations'
import type { ChargeSnapshotData } from '../types'

function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM')
}

function resultToSnapshot(result: ReturnType<typeof computeMonth>): ChargeSnapshotData {
  return {
    charges: result.charges,
    totalCommon: result.totalCommon,
    personalACharges: result.personalACharges,
    personalBCharges: result.personalBCharges,
    incomeA: result.incomeA,
    incomeB: result.incomeB,
    resteFoyer: result.resteFoyer,
  }
}

export function useChargeSnapshots() {
  const household = useHouseholdStore((s) => s.household)
  const fixedCharges = useChargesStore((s) => s.fixedCharges)
  const installmentPayments = useChargesStore((s) => s.installmentPayments)
  const plannedExpenses = useChargesStore((s) => s.plannedExpenses)
  const entries = useMonthlyStore((s) => s.entries)
  const setSnapshot = useMonthlyStore((s) => s.setSnapshot)

  const getSnapshotForMonth = useCallback((month: string): ChargeSnapshotData => {
    const currentMonth = getCurrentMonth()
    const entry = entries[month] || null

    // For the current month, always compute live
    if (month === currentMonth) {
      const result = computeMonth(month, household, fixedCharges, installmentPayments, plannedExpenses, entry)
      return resultToSnapshot(result)
    }

    // For past months, use stored snapshot if available
    if (entry?.chargeSnapshot) {
      return entry.chargeSnapshot
    }

    // Fallback: compute dynamically and save for past months
    const result = computeMonth(month, household, fixedCharges, installmentPayments, plannedExpenses, entry)
    const snapshot = resultToSnapshot(result)

    // Auto-save snapshot for past months
    if (month < currentMonth) {
      setSnapshot(month, snapshot)
    }

    return snapshot
  }, [household, fixedCharges, installmentPayments, plannedExpenses, entries, setSnapshot])

  const ensurePastSnapshots = useCallback(() => {
    const currentMonth = getCurrentMonth()
    for (const [month, entry] of Object.entries(entries)) {
      if (month < currentMonth && !entry.chargeSnapshot) {
        const result = computeMonth(month, household, fixedCharges, installmentPayments, plannedExpenses, entry)
        setSnapshot(month, resultToSnapshot(result))
      }
    }
  }, [household, fixedCharges, installmentPayments, plannedExpenses, entries, setSnapshot])

  return { getSnapshotForMonth, ensurePastSnapshots }
}

import { addMonths, format, parseISO, differenceInMonths, startOfMonth } from 'date-fns'
import type { FixedCharge, InstallmentPayment, PlannedExpense, Household, MonthlyEntry, ChargeDetail, ComputeMonthResult } from '../types'

export function isActiveThisMonth(charge: FixedCharge, month: string): boolean {
  if (!charge.active) return false
  if (charge.startsAt && month < charge.startsAt) return false
  if (charge.endsAt && month > charge.endsAt) return false
  return true
}

export function isDueThisMonth(charge: FixedCharge, month: string): boolean {
  if (!isActiveThisMonth(charge, month)) return false
  const monthNum = parseInt(month.split('-')[1], 10)

  switch (charge.frequency) {
    case 'monthly':
      return true
    case 'bimonthly':
      return monthNum % 2 === (charge.startMonth || 1) % 2
    case 'quarterly':
      return monthNum % 3 === (charge.startMonth || 1) % 3
    case 'annual':
      return monthNum === (charge.startMonth || 1)
    default:
      return true
  }
}

export function getEffectiveMonth(charge: FixedCharge, month: string): string {
  if (!charge.paymentDelayMonths) return month
  const date = parseISO(month + '-01')
  return format(addMonths(date, -charge.paymentDelayMonths), 'yyyy-MM')
}

export function isInstallmentDue(installment: InstallmentPayment, month: string): boolean {
  const firstDate = parseISO(installment.firstPaymentDate)
  const monthDate = parseISO(month + '-01')
  const diff = differenceInMonths(startOfMonth(monthDate), startOfMonth(firstDate))
  return diff >= 0 && diff < installment.installmentCount
}

export function getInstallmentNumber(installment: InstallmentPayment, month: string): number {
  const firstDate = parseISO(installment.firstPaymentDate)
  const monthDate = parseISO(month + '-01')
  return differenceInMonths(startOfMonth(monthDate), startOfMonth(firstDate)) + 1
}

export function computeMonth(
  month: string,
  household: Household | null,
  fixedCharges: FixedCharge[],
  installments: InstallmentPayment[],
  plannedExpenses: PlannedExpense[],
  monthlyEntry: MonthlyEntry | null
): ComputeMonthResult {
  if (!household) {
    return {
      incomeA: 0,
      incomeB: 0,
      startingBalanceA: 0,
      startingBalanceB: 0,
      otherIncomeCommon: 0,
      otherIncomeA: 0,
      otherIncomeB: 0,
      resteA: 0,
      resteB: 0,
      resteFoyer: 0,
      totalCommon: 0,
      netCommonCharges: 0,
      shareA: 0,
      shareB: 0,
      personalACharges: 0,
      personalBCharges: 0,
      charges: [],
      ratio: 0,
    }
  }

  const entry = monthlyEntry || ({} as Partial<MonthlyEntry>)
  const incomeA = entry.incomeA || 0
  const incomeB = entry.incomeB || 0
  const startingBalanceA = entry.startingBalanceA || 0
  const startingBalanceB = entry.startingBalanceB || 0
  const otherIncomeCommon = entry.otherIncomeCommon || 0
  const otherIncomeA = entry.otherIncomeA || 0
  const otherIncomeB = entry.otherIncomeB || 0
  const variableOverrides = entry.variableOverrides || {}
  const disabledCharges = new Set(entry.disabledCharges || [])

  const chargesDetail: ChargeDetail[] = []

  // Fixed charges active this month
  const activeCharges = (fixedCharges || []).filter((c) => {
    const effectiveMonth = c.paymentDelayMonths ? getEffectiveMonth(c, month) : month
    return isDueThisMonth(c, effectiveMonth)
  })

  activeCharges.forEach((c) => {
    const isDisabledThisMonth = disabledCharges.has(c.id)
    const amount = isDisabledThisMonth ? 0 : (variableOverrides[c.id] !== undefined ? variableOverrides[c.id] : c.amount)
    chargesDetail.push({
      id: c.id,
      name: c.name,
      amount,
      payer: c.payer,
      category: c.category,
      type: 'fixed',
      isVariable: variableOverrides[c.id] !== undefined,
      isDisabledThisMonth,
      originalAmount: c.amount,
    })
  })

  // Installments due this month
  ;(installments || []).filter((i) => isInstallmentDue(i, month)).forEach((i) => {
    const num = getInstallmentNumber(i, month)
    chargesDetail.push({
      id: i.id,
      name: `${i.name} (${num}/${i.installmentCount})`,
      amount: i.installmentAmount,
      payer: i.payer,
      type: 'installment',
      installmentNumber: num,
      installmentTotal: i.installmentCount,
    })
  })

  // Planned expenses for this month
  ;(plannedExpenses || []).filter((e) => e.targetMonth === month).forEach((e) => {
    chargesDetail.push({
      id: e.id,
      name: e.name,
      amount: e.estimatedAmount,
      payer: e.payer,
      type: 'planned',
    })
  })

  // Sums by payer
  const commonCharges = Math.round(chargesDetail.filter((c) => c.payer === 'common').reduce((sum, c) => sum + c.amount, 0) * 100) / 100
  const personalACharges = Math.round(chargesDetail.filter((c) => c.payer === 'person_a').reduce((sum, c) => sum + c.amount, 0) * 100) / 100
  const personalBCharges = Math.round(chargesDetail.filter((c) => c.payer === 'person_b').reduce((sum, c) => sum + c.amount, 0) * 100) / 100

  // Pro rata: dynamically compute split ratio from actual incomes
  let ratio = household.splitRatio || 0.5
  if (household.configModel !== 'solo' && household.splitMode === 'prorata' && (incomeA + incomeB) > 0) {
    ratio = incomeA / (incomeA + incomeB)
  }

  // Common other income (CAF, APL...) reduces the amount to split
  const netCommonCharges = Math.max(0, Math.round((commonCharges - otherIncomeCommon) * 100) / 100)
  const shareA = Math.round(netCommonCharges * ratio * 100) / 100
  const shareB = Math.round(netCommonCharges * (1 - ratio) * 100) / 100
  const resteA = Math.round((incomeA + otherIncomeA + startingBalanceA - shareA - personalACharges) * 100) / 100
  const resteB = Math.round((incomeB + otherIncomeB + startingBalanceB - shareB - personalBCharges) * 100) / 100
  const resteFoyer = Math.round((resteA + resteB) * 100) / 100

  return {
    incomeA,
    incomeB,
    startingBalanceA,
    startingBalanceB,
    otherIncomeCommon,
    otherIncomeA,
    otherIncomeB,
    resteA,
    resteB,
    resteFoyer,
    totalCommon: commonCharges,
    netCommonCharges,
    shareA,
    shareB,
    personalACharges,
    personalBCharges,
    charges: chargesDetail,
    ratio,
  }
}

import { addMonths, format, parseISO, differenceInMonths, startOfMonth } from 'date-fns'

export function isActiveThisMonth(charge, month) {
  if (!charge.active) return false
  if (charge.startsAt && month < charge.startsAt) return false
  if (charge.endsAt && month > charge.endsAt) return false
  return true
}

export function isDueThisMonth(charge, month) {
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

export function getEffectiveMonth(charge, month) {
  if (!charge.paymentDelayMonths) return month
  const date = parseISO(month + '-01')
  return format(addMonths(date, -charge.paymentDelayMonths), 'yyyy-MM')
}

export function isInstallmentDue(installment, month) {
  const firstDate = parseISO(installment.firstPaymentDate)
  const monthDate = parseISO(month + '-01')
  const diff = differenceInMonths(startOfMonth(monthDate), startOfMonth(firstDate))
  return diff >= 0 && diff < installment.installmentCount
}

export function getInstallmentNumber(installment, month) {
  const firstDate = parseISO(installment.firstPaymentDate)
  const monthDate = parseISO(month + '-01')
  return differenceInMonths(startOfMonth(monthDate), startOfMonth(firstDate)) + 1
}

export function computeMonth(month, household, fixedCharges, installments, plannedExpenses, monthlyEntry) {
  if (!household) {
    return { resteA: 0, resteB: 0, resteFoyer: 0, totalCommon: 0, shareA: 0, shareB: 0, charges: [] }
  }

  const entry = monthlyEntry || {}
  const incomeA = entry.incomeA || 0
  const incomeB = entry.incomeB || 0
  const variableOverrides = entry.variableOverrides || {}

  const chargesDetail = []

  // Fixed charges active this month
  const activeCharges = fixedCharges.filter((c) => {
    const effectiveMonth = c.paymentDelayMonths ? getEffectiveMonth(c, month) : month
    return isDueThisMonth(c, effectiveMonth)
  })

  activeCharges.forEach((c) => {
    const amount = variableOverrides[c.id] !== undefined ? variableOverrides[c.id] : c.amount
    chargesDetail.push({
      id: c.id,
      name: c.name,
      amount,
      payer: c.payer,
      category: c.category,
      type: 'fixed',
      isVariable: variableOverrides[c.id] !== undefined,
      originalAmount: c.amount,
    })
  })

  // Installments due this month
  installments.filter((i) => isInstallmentDue(i, month)).forEach((i) => {
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
  plannedExpenses.filter((e) => e.targetMonth === month).forEach((e) => {
    chargesDetail.push({
      id: e.id,
      name: e.name,
      amount: e.estimatedAmount,
      payer: e.payer,
      type: 'planned',
    })
  })

  // Sums by payer
  const commonCharges = chargesDetail.filter((c) => c.payer === 'common').reduce((sum, c) => sum + c.amount, 0)
  const personalACharges = chargesDetail.filter((c) => c.payer === 'person_a').reduce((sum, c) => sum + c.amount, 0)
  const personalBCharges = chargesDetail.filter((c) => c.payer === 'person_b').reduce((sum, c) => sum + c.amount, 0)

  // Pro rata: dynamically compute split ratio from actual incomes
  let ratio = household.splitRatio || 0.5
  if (household.configModel !== 'solo' && household.splitMode === 'prorata' && (incomeA + incomeB) > 0) {
    ratio = incomeA / (incomeA + incomeB)
  }

  const shareA = commonCharges * ratio
  const shareB = commonCharges * (1 - ratio)
  const resteA = incomeA - shareA - personalACharges
  const resteB = incomeB - shareB - personalBCharges

  return {
    incomeA,
    incomeB,
    resteA,
    resteB,
    resteFoyer: resteA + resteB,
    totalCommon: commonCharges,
    shareA,
    shareB,
    personalACharges,
    personalBCharges,
    charges: chargesDetail,
    ratio,
  }
}

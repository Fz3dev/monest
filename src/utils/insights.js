import { subMonths, format } from 'date-fns'
import { computeMonth } from './calculations'
import { formatCurrency } from './format'

export function generateInsights(currentMonth, household, fixedCharges, installments, planned, entries) {
  if (!household) return []

  const insights = []
  const entry = entries[currentMonth] || null
  const result = computeMonth(currentMonth, household, fixedCharges, installments, planned, entry)

  // Previous month comparison
  const prevMonth = format(subMonths(new Date(currentMonth + '-01'), 1), 'yyyy-MM')
  const prevEntry = entries[prevMonth] || null
  const prevResult = computeMonth(prevMonth, household, fixedCharges, installments, planned, prevEntry)

  const totalIncome = result.incomeA + result.incomeB
  const totalCharges = result.totalCommon + result.personalACharges + result.personalBCharges
  const prevTotalCharges = prevResult.totalCommon + prevResult.personalACharges + prevResult.personalBCharges

  // Savings rate insight
  if (totalIncome > 0) {
    const savingsRate = Math.round((result.resteFoyer / totalIncome) * 100)
    if (savingsRate >= 30) {
      insights.push({
        type: 'positive',
        message: `Excellent ! Vous epargnez ${savingsRate}% de vos revenus ce mois.`,
      })
    } else if (savingsRate >= 15) {
      insights.push({
        type: 'positive',
        message: `Bon rythme d'epargne : ${savingsRate}% de vos revenus preserves.`,
      })
    } else if (savingsRate >= 0) {
      insights.push({
        type: 'warning',
        message: `Taux d'epargne faible (${savingsRate}%). Objectif recommande : 20%.`,
      })
    } else {
      insights.push({
        type: 'danger',
        message: `Deficit de ${formatCurrency(Math.abs(result.resteFoyer))} ce mois. Revenus insuffisants.`,
      })
    }
  }

  // Month-over-month charges change
  if (prevTotalCharges > 0 && totalCharges > 0) {
    const changePct = Math.round(((totalCharges - prevTotalCharges) / prevTotalCharges) * 100)
    if (changePct > 15) {
      insights.push({
        type: 'warning',
        message: `Charges en hausse de ${changePct}% par rapport au mois dernier (+${formatCurrency(totalCharges - prevTotalCharges)}).`,
      })
    } else if (changePct < -10) {
      insights.push({
        type: 'positive',
        message: `Charges reduites de ${Math.abs(changePct)}% par rapport au mois dernier (${formatCurrency(prevTotalCharges - totalCharges)} economies).`,
      })
    }
  }

  // Category-level comparison
  if (prevResult.charges.length > 0 && result.charges.length > 0) {
    const curCats = {}
    const prevCats = {}
    result.charges.forEach((c) => { curCats[c.category || 'autre'] = (curCats[c.category || 'autre'] || 0) + c.amount })
    prevResult.charges.forEach((c) => { prevCats[c.category || 'autre'] = (prevCats[c.category || 'autre'] || 0) + c.amount })

    // Find biggest increase
    let maxIncrease = { cat: null, delta: 0, pct: 0 }
    for (const [cat, amount] of Object.entries(curCats)) {
      const prev = prevCats[cat] || 0
      if (prev > 0) {
        const delta = amount - prev
        const pct = Math.round((delta / prev) * 100)
        if (pct > 20 && delta > maxIncrease.delta) {
          maxIncrease = { cat, delta, pct }
        }
      }
    }
    if (maxIncrease.cat && insights.length < 3) {
      const label = maxIncrease.cat.charAt(0).toUpperCase() + maxIncrease.cat.slice(1)
      insights.push({
        type: 'warning',
        message: `${label} : +${maxIncrease.pct}% ce mois (+${formatCurrency(maxIncrease.delta)}).`,
      })
    }
  }

  // Heavy upcoming month warning
  for (let i = 1; i <= 2; i++) {
    const futureMonth = format(subMonths(new Date(currentMonth + '-01'), -i), 'yyyy-MM')
    const futureEntry = entries[futureMonth] || null
    const futureResult = computeMonth(futureMonth, household, fixedCharges, installments, planned, futureEntry)
    const futureTotalCharges = futureResult.totalCommon + futureResult.personalACharges + futureResult.personalBCharges

    if (totalCharges > 0 && futureTotalCharges > totalCharges * 1.3 && insights.length < 4) {
      const monthLabel = format(new Date(futureMonth + '-01'), 'MMMM')
      insights.push({
        type: 'warning',
        message: `Attention : ${formatCurrency(futureTotalCharges)} de charges prevues en ${monthLabel}.`,
      })
      break
    }
  }

  return insights.slice(0, 3)
}

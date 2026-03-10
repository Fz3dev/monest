import { subMonths, format } from 'date-fns'
import { computeMonth } from './calculations'
import { formatCurrency, formatMonth } from './format'
import i18n from '../i18n'

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
        message: i18n.t('insights.excellentSavings', { rate: savingsRate }),
      })
    } else if (savingsRate >= 15) {
      insights.push({
        type: 'positive',
        message: i18n.t('insights.goodSavings', { rate: savingsRate }),
      })
    } else if (savingsRate >= 0) {
      insights.push({
        type: 'warning',
        message: i18n.t('insights.lowSavings', { rate: savingsRate }),
      })
    } else {
      insights.push({
        type: 'danger',
        message: i18n.t('insights.deficit', { amount: formatCurrency(Math.abs(result.resteFoyer)) }),
      })
    }
  }

  // Month-over-month charges change
  if (prevTotalCharges > 0 && totalCharges > 0) {
    const changePct = Math.round(((totalCharges - prevTotalCharges) / prevTotalCharges) * 100)
    if (changePct > 15) {
      insights.push({
        type: 'warning',
        message: i18n.t('insights.chargesUp', { percent: changePct, amount: formatCurrency(totalCharges - prevTotalCharges) }),
      })
    } else if (changePct < -10) {
      insights.push({
        type: 'positive',
        message: i18n.t('insights.chargesDown', { percent: Math.abs(changePct), amount: formatCurrency(prevTotalCharges - totalCharges) }),
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
      const label = i18n.t(`categories.${maxIncrease.cat}`, { defaultValue: maxIncrease.cat.charAt(0).toUpperCase() + maxIncrease.cat.slice(1) })
      insights.push({
        type: 'warning',
        message: i18n.t('insights.categoryUp', { label, percent: maxIncrease.pct, amount: formatCurrency(maxIncrease.delta) }),
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
      const monthLabel = formatMonth(futureMonth)
      insights.push({
        type: 'warning',
        message: i18n.t('insights.heavyMonth', { amount: formatCurrency(futureTotalCharges), month: monthLabel }),
      })
      break
    }
  }

  return insights.slice(0, 3)
}

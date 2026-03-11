import { subMonths, format } from 'date-fns'
import { computeMonth } from './calculations'

/**
 * Calculate how many consecutive months the user has had a positive "reste à vivre"
 */
export function calculateStreak(currentMonth, household, fixedCharges, installments, planned, entries) {
  let streak = 0
  let month = currentMonth

  for (let i = 0; i < 24; i++) { // Check up to 24 months back
    const entry = entries[month] || null
    const result = computeMonth(month, household, fixedCharges, installments, planned, entry)
    const totalIncome = result.incomeA + result.incomeB

    // Only count months where income was entered
    if (totalIncome === 0) break

    if (result.resteFoyer > 0) {
      streak++
    } else {
      break
    }

    month = format(subMonths(new Date(month + '-01'), 1), 'yyyy-MM')
  }

  return streak
}

/**
 * Generate badges based on user's financial data
 */
export function calculateBadges(streak, totalCharges, totalIncome, savingsGoals) {
  const badges = []

  // Streak badges
  if (streak >= 1) badges.push({ id: 'streak1', icon: '\u{1F525}', label: 'Premier mois positif', unlocked: true })
  if (streak >= 3) badges.push({ id: 'streak3', icon: '⚡', label: '3 mois consécutifs', unlocked: true })
  if (streak >= 6) badges.push({ id: 'streak6', icon: '🏆', label: '6 mois consécutifs', unlocked: true })
  if (streak >= 12) badges.push({ id: 'streak12', icon: '\u{1F451}', label: '1 an positif !', unlocked: true })

  // Charges rate badge
  if (totalIncome > 0) {
    const rate = totalCharges / totalIncome
    if (rate <= 0.3) badges.push({ id: 'lowCharges', icon: '🎯', label: 'Charges maîtrisées (<30%)', unlocked: true })
  }

  // Savings badges
  const hasGoals = savingsGoals?.length > 0
  if (hasGoals) badges.push({ id: 'saver', icon: '🐷', label: 'Épargnant', unlocked: true })

  const completedGoals = savingsGoals?.filter(g => g.currentAmount >= g.targetAmount)?.length || 0
  if (completedGoals > 0) badges.push({ id: 'goalReached', icon: '\u{1F389}', label: 'Objectif atteint', unlocked: true })

  return badges
}

import { describe, it, expect, beforeEach } from 'vitest'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { useSavingsStore } from '../stores/savingsStore'
import { useExpenseStore } from '../stores/expenseStore'
import { useThemeStore } from '../stores/themeStore'
import { computeMonth } from '../utils/calculations'

describe('Integration — full use case scenarios', () => {
  beforeEach(() => {
    useHouseholdStore.setState({ household: null })
    useChargesStore.setState({
      fixedCharges: [],
      installmentPayments: [],
      plannedExpenses: [],
      categoryRules: {},
    })
    useMonthlyStore.setState({ entries: {} })
    useSavingsStore.setState({ goals: [] })
    useExpenseStore.setState({ expenses: [] })
    useThemeStore.setState({ theme: 'dark' })
  })

  it('scenario: couple creates household, adds charges, enters income, computes budget', () => {
    // Step 1: Create household
    useHouseholdStore.getState().setHousehold({
      id: 'h-1',
      name: 'Dupont',
      personAName: 'Alice',
      personBName: 'Bob',
      configModel: 'common_and_personal',
      splitRatio: 0.5,
      splitMode: '50/50',
      personAColor: '#6C63FF',
      personBColor: '#ec4899',
    })
    expect(useHouseholdStore.getState().household.name).toBe('Dupont')

    // Step 2: Add fixed charges
    const charges = useChargesStore.getState()
    charges.addFixedCharge({ name: 'Loyer', amount: 1200, payer: 'common', frequency: 'monthly', category: 'logement' })
    charges.addFixedCharge({ name: 'Internet', amount: 40, payer: 'common', frequency: 'monthly', category: 'abonnement' })
    charges.addFixedCharge({ name: 'Assurance auto Alice', amount: 80, payer: 'person_a', frequency: 'monthly', category: 'assurance' })
    charges.addFixedCharge({ name: 'Telephone Bob', amount: 20, payer: 'person_b', frequency: 'monthly', category: 'abonnement' })
    expect(useChargesStore.getState().fixedCharges).toHaveLength(4)

    // Step 3: Enter monthly income
    useMonthlyStore.getState().setEntry('2026-03', { incomeA: 3500, incomeB: 2800 })

    // Step 4: Compute month
    const household = useHouseholdStore.getState().household
    const { fixedCharges, installmentPayments, plannedExpenses } = useChargesStore.getState()
    const entry = useMonthlyStore.getState().getEntry('2026-03')
    const result = computeMonth('2026-03', household, fixedCharges, installmentPayments, plannedExpenses, entry)

    // Common charges: 1200 + 40 = 1240, split 50/50 = 620 each
    // Personal A: 80, Personal B: 20
    expect(result.totalCommon).toBe(1240)
    expect(result.personalACharges).toBe(80)
    expect(result.personalBCharges).toBe(20)
    // Reste A: 3500 - 620 - 80 = 2800, Reste B: 2800 - 620 - 20 = 2160
    expect(result.resteA).toBe(2800)
    expect(result.resteB).toBe(2160)
    expect(result.resteFoyer).toBe(4960) // total
  })

  it('scenario: user disables a charge and recomputes', () => {
    useHouseholdStore.getState().setHousehold({
      id: 'h-1', name: 'Test', personAName: 'A', configModel: 'solo',
      splitRatio: 1, splitMode: '50/50',
    })
    const charges = useChargesStore.getState()
    charges.addFixedCharge({ name: 'Netflix', amount: 15, payer: 'common', frequency: 'monthly' })
    charges.addFixedCharge({ name: 'Loyer', amount: 900, payer: 'common', frequency: 'monthly' })
    useMonthlyStore.getState().setEntry('2026-03', { incomeA: 2500 })

    const household = useHouseholdStore.getState().household
    let state = useChargesStore.getState()
    let entry = useMonthlyStore.getState().getEntry('2026-03')

    // Before toggle
    let result = computeMonth('2026-03', household, state.fixedCharges, state.installmentPayments, state.plannedExpenses, entry)
    expect(result.totalCommon).toBe(915)

    // Disable Netflix
    const netflixId = state.fixedCharges.find(c => c.name === 'Netflix').id
    charges.toggleFixedCharge(netflixId)

    // After toggle
    state = useChargesStore.getState()
    result = computeMonth('2026-03', household, state.fixedCharges, state.installmentPayments, state.plannedExpenses, entry)
    expect(result.totalCommon).toBe(900) // Netflix excluded
  })

  it('scenario: track daily expenses and check monthly totals', () => {
    const store = useExpenseStore.getState()

    // Add expenses over a week
    store.addExpense({ date: '2026-03-10', amount: 45, category: 'alimentation', note: 'Courses Leclerc' })
    store.addExpense({ date: '2026-03-11', amount: 35, category: 'transport', note: 'Essence' })
    store.addExpense({ date: '2026-03-12', amount: 18, category: 'alimentation', note: 'Boulangerie' })
    store.addExpense({ date: '2026-03-13', amount: 60, category: 'loisirs', note: 'Restaurant' })
    store.addExpense({ date: '2026-03-14', amount: 12, category: 'alimentation', note: 'Picard' })

    // Check totals
    expect(useExpenseStore.getState().getTotalByMonth('2026-03')).toBe(170)

    // Check categories
    const cats = useExpenseStore.getState().getExpensesByCategory('2026-03')
    expect(cats.alimentation).toBe(75) // 45 + 18 + 12
    expect(cats.transport).toBe(35)
    expect(cats.loisirs).toBe(60)

    // Delete one and recheck
    const essenceId = useExpenseStore.getState().expenses.find(e => e.note === 'Essence').id
    useExpenseStore.getState().removeExpense(essenceId)
    expect(useExpenseStore.getState().getTotalByMonth('2026-03')).toBe(135)
  })

  it('scenario: savings goal lifecycle with contributions', () => {
    const store = useSavingsStore.getState()

    // Create 2 goals
    store.addGoal({ name: 'Voyage', targetAmount: 3000, icon: '✈️', color: '#6C63FF' })
    store.addGoal({ name: 'Fonds urgence', targetAmount: 5000, icon: '🏦', color: '#22c55e' })

    const [voyage, fonds] = useSavingsStore.getState().goals
    expect(voyage.currentAmount).toBe(0)

    // Contribute to voyage over 3 months
    store.contribute(voyage.id, 500)
    store.contribute(voyage.id, 500)
    store.contribute(voyage.id, 500)
    expect(useSavingsStore.getState().goals[0].currentAmount).toBe(1500)

    // Contribute to fonds urgence
    store.contribute(fonds.id, 1000)

    // Check totals
    expect(useSavingsStore.getState().getTotalSaved()).toBe(2500)
    expect(useSavingsStore.getState().getTotalTarget()).toBe(8000)

    // Withdraw from voyage for emergency
    store.contribute(voyage.id, -300)
    expect(useSavingsStore.getState().goals[0].currentAmount).toBe(1200)
    expect(useSavingsStore.getState().getTotalSaved()).toBe(2200)

    // Update target
    store.updateGoal(voyage.id, { targetAmount: 4000 })
    expect(useSavingsStore.getState().getTotalTarget()).toBe(9000)

    // Complete and remove fonds urgence
    store.removeGoal(fonds.id)
    expect(useSavingsStore.getState().goals).toHaveLength(1)
    expect(useSavingsStore.getState().getTotalTarget()).toBe(4000)
  })

  it('scenario: modify charges and variable overrides for a month', () => {
    useHouseholdStore.getState().setHousehold({
      id: 'h-1', name: 'Test', personAName: 'A', configModel: 'solo',
      splitRatio: 1, splitMode: '50/50',
    })

    // Add charge with variable override
    useChargesStore.getState().addFixedCharge({ name: 'EDF', amount: 120, payer: 'common', frequency: 'monthly' })
    const edfId = useChargesStore.getState().fixedCharges[0].id

    useMonthlyStore.getState().setEntry('2026-03', { incomeA: 2500 })

    // Override EDF for March (winter = higher bill)
    useMonthlyStore.getState().updateVariable('2026-03', edfId, 180)

    const household = useHouseholdStore.getState().household
    const { fixedCharges, installmentPayments, plannedExpenses } = useChargesStore.getState()
    const entry = useMonthlyStore.getState().getEntry('2026-03')
    const result = computeMonth('2026-03', household, fixedCharges, installmentPayments, plannedExpenses, entry)

    // Should use override (180) instead of base (120)
    const edfCharge = result.charges.find(c => c.name === 'EDF')
    expect(edfCharge.amount).toBe(180)
  })

  it('scenario: category rules used during import flow', () => {
    const store = useChargesStore.getState()

    // Simulate import: add custom rules for bank labels
    store.addCategoryRule('PRLV FREE MOBILE', 'abonnement')
    store.addCategoryRule('VIR DGFIP', 'impot')
    store.addCategoryRule('CB CARREFOUR CITY', 'alimentation')

    // Match labels as they would appear from CSV
    expect(store.matchCategory('PRLV FREE MOBILE 0612345678')).toBe('abonnement')
    expect(store.matchCategory('VIR DGFIP IMPOT REVENU')).toBe('impot')
    expect(store.matchCategory('CB CARREFOUR CITY 75001')).toBe('alimentation')
    expect(store.matchCategory('VIR SALAIRE EMPLOYEUR')).toBe('autre') // no match

    // Remove a rule
    store.removeCategoryRule('CB CARREFOUR CITY')
    // Now falls back to default pattern for CARREFOUR
    expect(store.matchCategory('CB CARREFOUR CITY 75001')).toBe('alimentation') // still matches via default
  })

  it('scenario: theme toggle does not affect other stores', () => {
    // Setup household
    useHouseholdStore.getState().setHousehold({ id: 'h-1', name: 'Test' })
    useChargesStore.getState().addFixedCharge({ name: 'X', amount: 100 })
    useExpenseStore.getState().addExpense({ date: '2026-03-10', amount: 50 })

    // Toggle theme
    useThemeStore.getState().toggleTheme()
    expect(useThemeStore.getState().theme).toBe('light')

    // Other stores untouched
    expect(useHouseholdStore.getState().household.name).toBe('Test')
    expect(useChargesStore.getState().fixedCharges).toHaveLength(1)
    expect(useExpenseStore.getState().expenses).toHaveLength(1)

    // Toggle back
    useThemeStore.getState().toggleTheme()
    expect(useThemeStore.getState().theme).toBe('dark')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { useChargesStore } from '../stores/chargesStore'

describe('chargesStore', () => {
  beforeEach(() => {
    useChargesStore.setState({
      fixedCharges: [],
      installmentPayments: [],
      plannedExpenses: [],
      categoryRules: {},
    })
  })

  // Fixed charges CRUD
  it('adds a fixed charge with generated id', () => {
    useChargesStore.getState().addFixedCharge({ name: 'Loyer', amount: 1200, payer: 'common', frequency: 'monthly' })
    const charges = useChargesStore.getState().fixedCharges
    expect(charges).toHaveLength(1)
    expect(charges[0].name).toBe('Loyer')
    expect(charges[0].active).toBe(true)
    expect(charges[0].id).toBeTruthy()
  })

  it('updates a fixed charge', () => {
    useChargesStore.getState().addFixedCharge({ name: 'Loyer', amount: 1200, payer: 'common' })
    const id = useChargesStore.getState().fixedCharges[0].id
    useChargesStore.getState().updateFixedCharge(id, { amount: 1300 })
    expect(useChargesStore.getState().fixedCharges[0].amount).toBe(1300)
    expect(useChargesStore.getState().fixedCharges[0].name).toBe('Loyer')
  })

  it('removes a fixed charge', () => {
    useChargesStore.getState().addFixedCharge({ name: 'Loyer', amount: 1200 })
    const id = useChargesStore.getState().fixedCharges[0].id
    useChargesStore.getState().removeFixedCharge(id)
    expect(useChargesStore.getState().fixedCharges).toHaveLength(0)
  })

  it('toggles active state', () => {
    useChargesStore.getState().addFixedCharge({ name: 'Netflix', amount: 15 })
    const id = useChargesStore.getState().fixedCharges[0].id
    expect(useChargesStore.getState().fixedCharges[0].active).toBe(true)
    useChargesStore.getState().toggleFixedCharge(id)
    expect(useChargesStore.getState().fixedCharges[0].active).toBe(false)
    useChargesStore.getState().toggleFixedCharge(id)
    expect(useChargesStore.getState().fixedCharges[0].active).toBe(true)
  })

  it('manages multiple charges independently', () => {
    const store = useChargesStore.getState()
    store.addFixedCharge({ name: 'A', amount: 100 })
    store.addFixedCharge({ name: 'B', amount: 200 })
    store.addFixedCharge({ name: 'C', amount: 300 })
    expect(useChargesStore.getState().fixedCharges).toHaveLength(3)
    const idB = useChargesStore.getState().fixedCharges[1].id
    useChargesStore.getState().removeFixedCharge(idB)
    const remaining = useChargesStore.getState().fixedCharges
    expect(remaining).toHaveLength(2)
    expect(remaining.map(c => c.name)).toEqual(['A', 'C'])
  })

  // Installments CRUD
  it('adds and removes installment payments', () => {
    useChargesStore.getState().addInstallment({ name: 'Tennis', totalAmount: 300, installmentCount: 3, installmentAmount: 100, firstPaymentDate: '2026-01-01', payer: 'common' })
    expect(useChargesStore.getState().installmentPayments).toHaveLength(1)
    const id = useChargesStore.getState().installmentPayments[0].id
    useChargesStore.getState().removeInstallment(id)
    expect(useChargesStore.getState().installmentPayments).toHaveLength(0)
  })

  it('updates an installment', () => {
    useChargesStore.getState().addInstallment({ name: 'Tennis', totalAmount: 300, installmentCount: 3, installmentAmount: 100 })
    const id = useChargesStore.getState().installmentPayments[0].id
    useChargesStore.getState().updateInstallment(id, { name: 'Tennis Club' })
    expect(useChargesStore.getState().installmentPayments[0].name).toBe('Tennis Club')
  })

  // Planned expenses CRUD
  it('adds and removes planned expenses', () => {
    useChargesStore.getState().addPlannedExpense({ name: 'Vacances', estimatedAmount: 2000, targetMonth: '2026-07', payer: 'common' })
    expect(useChargesStore.getState().plannedExpenses).toHaveLength(1)
    const id = useChargesStore.getState().plannedExpenses[0].id
    useChargesStore.getState().removePlannedExpense(id)
    expect(useChargesStore.getState().plannedExpenses).toHaveLength(0)
  })

  it('updates a planned expense', () => {
    useChargesStore.getState().addPlannedExpense({ name: 'Vacances', estimatedAmount: 2000, targetMonth: '2026-07' })
    const id = useChargesStore.getState().plannedExpenses[0].id
    useChargesStore.getState().updatePlannedExpense(id, { estimatedAmount: 2500 })
    expect(useChargesStore.getState().plannedExpenses[0].estimatedAmount).toBe(2500)
  })

  // Category rules
  it('adds and matches category rules', () => {
    const store = useChargesStore.getState()
    store.addCategoryRule('PRLV FREE MOBILE', 'abonnement')
    expect(store.matchCategory('PRLV FREE MOBILE 0612345678')).toBe('abonnement')
  })

  it('removes category rules', () => {
    const store = useChargesStore.getState()
    store.addCategoryRule('CUSTOM RULE', 'loisirs')
    expect(store.matchCategory('CUSTOM RULE 123')).toBe('loisirs')
    store.removeCategoryRule('CUSTOM RULE')
    // Falls back to default pattern matching
    expect(useChargesStore.getState().matchCategory('CUSTOM RULE 123')).toBe('autre')
  })

  it('falls back to built-in patterns when no custom rule matches', () => {
    const store = useChargesStore.getState()
    expect(store.matchCategory('CB CARREFOUR CITY 75001')).toBe('alimentation')
    expect(store.matchCategory('VIR DGFIP IMPOT')).toBe('impot')
    expect(store.matchCategory('RANDOM UNKNOWN LABEL')).toBe('autre')
  })

  // Cross-type independence
  it('operations on one type do not affect others', () => {
    const store = useChargesStore.getState()
    store.addFixedCharge({ name: 'Loyer', amount: 1200 })
    store.addInstallment({ name: 'Tennis', totalAmount: 300, installmentCount: 3, installmentAmount: 100 })
    store.addPlannedExpense({ name: 'Vacances', estimatedAmount: 2000, targetMonth: '2026-07' })

    const fixedId = useChargesStore.getState().fixedCharges[0].id
    useChargesStore.getState().removeFixedCharge(fixedId)

    expect(useChargesStore.getState().fixedCharges).toHaveLength(0)
    expect(useChargesStore.getState().installmentPayments).toHaveLength(1)
    expect(useChargesStore.getState().plannedExpenses).toHaveLength(1)
  })

  // Modification lifecycle
  it('full CRUD lifecycle for a fixed charge', () => {
    const store = useChargesStore.getState()
    store.addFixedCharge({ name: 'EDF', amount: 120, payer: 'common', frequency: 'monthly', category: 'logement' })
    const id = useChargesStore.getState().fixedCharges[0].id

    // Read
    expect(useChargesStore.getState().fixedCharges[0].name).toBe('EDF')

    // Update
    useChargesStore.getState().updateFixedCharge(id, { amount: 150, name: 'EDF Electricite' })
    expect(useChargesStore.getState().fixedCharges[0].amount).toBe(150)
    expect(useChargesStore.getState().fixedCharges[0].name).toBe('EDF Electricite')

    // Toggle
    useChargesStore.getState().toggleFixedCharge(id)
    expect(useChargesStore.getState().fixedCharges[0].active).toBe(false)

    // Delete
    useChargesStore.getState().removeFixedCharge(id)
    expect(useChargesStore.getState().fixedCharges).toHaveLength(0)
  })
})

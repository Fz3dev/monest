import { describe, it, expect, beforeEach } from 'vitest'
import { useChargesStore } from '../stores/chargesStore'

describe('chargesStore — CRUD E2E', () => {
  beforeEach(() => {
    useChargesStore.setState({
      fixedCharges: [],
      installmentPayments: [],
      plannedExpenses: [],
      categoryRules: {},
    })
  })

  // ──── Fixed Charges ──────────────────────────────────────────────────────

  describe('fixedCharges CRUD', () => {
    it('adds a fixed charge with generated id and active=true', () => {
      const store = useChargesStore.getState()
      store.addFixedCharge({ name: 'Loyer', amount: 800, payer: 'common', frequency: 'monthly', category: 'logement' })
      const charges = useChargesStore.getState().fixedCharges
      expect(charges).toHaveLength(1)
      expect(charges[0].name).toBe('Loyer')
      expect(charges[0].amount).toBe(800)
      expect(charges[0].active).toBe(true)
      expect(charges[0].id).toBeDefined()
    })

    it('adds multiple charges independently', () => {
      const store = useChargesStore.getState()
      store.addFixedCharge({ name: 'Loyer', amount: 800 })
      store.addFixedCharge({ name: 'Internet', amount: 40 })
      store.addFixedCharge({ name: 'EDF', amount: 120 })
      const charges = useChargesStore.getState().fixedCharges
      expect(charges).toHaveLength(3)
      expect(charges.map(c => c.name)).toEqual(['Loyer', 'Internet', 'EDF'])
    })

    it('updates a charge by id', () => {
      const store = useChargesStore.getState()
      store.addFixedCharge({ name: 'Loyer', amount: 800, payer: 'common' })
      const id = useChargesStore.getState().fixedCharges[0].id
      store.updateFixedCharge(id, { amount: 850, name: 'Loyer + charges' })
      const updated = useChargesStore.getState().fixedCharges[0]
      expect(updated.amount).toBe(850)
      expect(updated.name).toBe('Loyer + charges')
      expect(updated.payer).toBe('common') // preserved
    })

    it('update on non-existent id does nothing', () => {
      const store = useChargesStore.getState()
      store.addFixedCharge({ name: 'Loyer', amount: 800 })
      store.updateFixedCharge('fake-id', { amount: 999 })
      expect(useChargesStore.getState().fixedCharges[0].amount).toBe(800)
    })

    it('removes a charge by id', () => {
      const store = useChargesStore.getState()
      store.addFixedCharge({ name: 'A', amount: 100 })
      store.addFixedCharge({ name: 'B', amount: 200 })
      const idA = useChargesStore.getState().fixedCharges[0].id
      store.removeFixedCharge(idA)
      const charges = useChargesStore.getState().fixedCharges
      expect(charges).toHaveLength(1)
      expect(charges[0].name).toBe('B')
    })

    it('remove non-existent id does nothing', () => {
      const store = useChargesStore.getState()
      store.addFixedCharge({ name: 'A', amount: 100 })
      store.removeFixedCharge('non-existent')
      expect(useChargesStore.getState().fixedCharges).toHaveLength(1)
    })

    it('toggles active state', () => {
      const store = useChargesStore.getState()
      store.addFixedCharge({ name: 'Netflix', amount: 15 })
      const id = useChargesStore.getState().fixedCharges[0].id
      expect(useChargesStore.getState().fixedCharges[0].active).toBe(true)
      store.toggleFixedCharge(id)
      expect(useChargesStore.getState().fixedCharges[0].active).toBe(false)
      store.toggleFixedCharge(id)
      expect(useChargesStore.getState().fixedCharges[0].active).toBe(true)
    })

    it('full lifecycle: add → update → toggle → remove', () => {
      const store = useChargesStore.getState()
      store.addFixedCharge({ name: 'Assurance', amount: 50 })
      const id = useChargesStore.getState().fixedCharges[0].id

      store.updateFixedCharge(id, { amount: 55, category: 'assurance' })
      expect(useChargesStore.getState().fixedCharges[0].amount).toBe(55)

      store.toggleFixedCharge(id)
      expect(useChargesStore.getState().fixedCharges[0].active).toBe(false)

      store.removeFixedCharge(id)
      expect(useChargesStore.getState().fixedCharges).toHaveLength(0)
    })
  })

  // ──── Installment Payments ────────────────────────────────────────────────

  describe('installmentPayments CRUD', () => {
    it('adds an installment with id and createdAt', () => {
      const store = useChargesStore.getState()
      store.addInstallment({
        name: 'Machine a laver',
        installmentAmount: 50,
        installmentCount: 10,
        totalAmount: 500,
        firstPaymentDate: '2026-01-15',
        payer: 'common',
      })
      const payments = useChargesStore.getState().installmentPayments
      expect(payments).toHaveLength(1)
      expect(payments[0].id).toBeDefined()
      expect(payments[0].createdAt).toBeDefined()
      expect(payments[0].name).toBe('Machine a laver')
      expect(payments[0].installmentAmount).toBe(50)
    })

    it('updates an installment', () => {
      const store = useChargesStore.getState()
      store.addInstallment({ name: 'TV', installmentAmount: 100, installmentCount: 12 })
      const id = useChargesStore.getState().installmentPayments[0].id
      store.updateInstallment(id, { installmentAmount: 110 })
      expect(useChargesStore.getState().installmentPayments[0].installmentAmount).toBe(110)
      expect(useChargesStore.getState().installmentPayments[0].name).toBe('TV')
    })

    it('removes an installment', () => {
      const store = useChargesStore.getState()
      store.addInstallment({ name: 'A' })
      store.addInstallment({ name: 'B' })
      const idA = useChargesStore.getState().installmentPayments[0].id
      store.removeInstallment(idA)
      expect(useChargesStore.getState().installmentPayments).toHaveLength(1)
      expect(useChargesStore.getState().installmentPayments[0].name).toBe('B')
    })
  })

  // ──── Planned Expenses ────────────────────────────────────────────────────

  describe('plannedExpenses CRUD', () => {
    it('adds a planned expense with generated id', () => {
      const store = useChargesStore.getState()
      store.addPlannedExpense({ name: 'Vacances', estimatedAmount: 2000, targetMonth: '2026-07', payer: 'common' })
      const expenses = useChargesStore.getState().plannedExpenses
      expect(expenses).toHaveLength(1)
      expect(expenses[0].id).toBeDefined()
      expect(expenses[0].name).toBe('Vacances')
      expect(expenses[0].estimatedAmount).toBe(2000)
    })

    it('updates a planned expense', () => {
      const store = useChargesStore.getState()
      store.addPlannedExpense({ name: 'Noel', estimatedAmount: 500, targetMonth: '2026-12' })
      const id = useChargesStore.getState().plannedExpenses[0].id
      store.updatePlannedExpense(id, { estimatedAmount: 600 })
      expect(useChargesStore.getState().plannedExpenses[0].estimatedAmount).toBe(600)
    })

    it('removes a planned expense', () => {
      const store = useChargesStore.getState()
      store.addPlannedExpense({ name: 'X' })
      const id = useChargesStore.getState().plannedExpenses[0].id
      store.removePlannedExpense(id)
      expect(useChargesStore.getState().plannedExpenses).toHaveLength(0)
    })
  })

  // ──── Category Rules ──────────────────────────────────────────────────────

  describe('categoryRules', () => {
    it('adds a custom rule (uppercased)', () => {
      const store = useChargesStore.getState()
      store.addCategoryRule('uber eats', 'alimentation')
      expect(useChargesStore.getState().categoryRules['UBER EATS']).toBe('alimentation')
    })

    it('custom rule overrides default pattern', () => {
      const store = useChargesStore.getState()
      // Netflix would default to 'abonnement' via CATEGORY_PATTERNS
      store.addCategoryRule('netflix', 'loisirs')
      expect(store.matchCategory('Netflix Premium')).toBe('loisirs')
    })

    it('matchCategory falls back to default patterns', () => {
      const store = useChargesStore.getState()
      expect(store.matchCategory('LOYER APPARTEMENT')).toBe('logement')
      expect(store.matchCategory('CARREFOUR CITY')).toBe('alimentation')
      expect(store.matchCategory('random thing')).toBe('autre')
    })

    it('removes a custom rule', () => {
      const store = useChargesStore.getState()
      store.addCategoryRule('custom', 'loisirs')
      expect(useChargesStore.getState().categoryRules['CUSTOM']).toBe('loisirs')
      store.removeCategoryRule('custom')
      expect(useChargesStore.getState().categoryRules['CUSTOM']).toBeUndefined()
    })

    it('matchCategory with empty label returns autre', () => {
      const store = useChargesStore.getState()
      expect(store.matchCategory('')).toBe('autre')
    })
  })

  // ──── Cross-store integration ─────────────────────────────────────────────

  describe('cross-type operations', () => {
    it('all three lists stay independent', () => {
      const store = useChargesStore.getState()
      store.addFixedCharge({ name: 'Loyer', amount: 800 })
      store.addInstallment({ name: 'TV', installmentAmount: 50 })
      store.addPlannedExpense({ name: 'Vacances', estimatedAmount: 2000 })

      const state = useChargesStore.getState()
      expect(state.fixedCharges).toHaveLength(1)
      expect(state.installmentPayments).toHaveLength(1)
      expect(state.plannedExpenses).toHaveLength(1)

      store.removeFixedCharge(state.fixedCharges[0].id)
      expect(useChargesStore.getState().fixedCharges).toHaveLength(0)
      expect(useChargesStore.getState().installmentPayments).toHaveLength(1)
      expect(useChargesStore.getState().plannedExpenses).toHaveLength(1)
    })
  })
})

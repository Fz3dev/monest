import { describe, it, expect } from 'vitest'
import {
  isActiveThisMonth,
  isDueThisMonth,
  getEffectiveMonth,
  isInstallmentDue,
  getInstallmentNumber,
  computeMonth,
} from '../utils/calculations'

// ─── isActiveThisMonth ───────────────────────────────────────

describe('isActiveThisMonth', () => {
  it('returns false if charge is inactive', () => {
    expect(isActiveThisMonth({ active: false }, '2026-03')).toBe(false)
  })

  it('returns true if charge is active with no date bounds', () => {
    expect(isActiveThisMonth({ active: true }, '2026-03')).toBe(true)
  })

  it('returns false if month is before startsAt', () => {
    expect(isActiveThisMonth({ active: true, startsAt: '2026-06' }, '2026-03')).toBe(false)
  })

  it('returns true if month equals startsAt', () => {
    expect(isActiveThisMonth({ active: true, startsAt: '2026-03' }, '2026-03')).toBe(true)
  })

  it('returns false if month is after endsAt', () => {
    expect(isActiveThisMonth({ active: true, endsAt: '2026-01' }, '2026-03')).toBe(false)
  })

  it('returns true if month equals endsAt', () => {
    expect(isActiveThisMonth({ active: true, endsAt: '2026-03' }, '2026-03')).toBe(true)
  })

  it('returns true if month is within startsAt and endsAt', () => {
    expect(isActiveThisMonth({ active: true, startsAt: '2026-01', endsAt: '2026-12' }, '2026-06')).toBe(true)
  })
})

// ─── isDueThisMonth ──────────────────────────────────────────

describe('isDueThisMonth', () => {
  const monthly = { active: true, frequency: 'monthly' }
  const bimonthly = { active: true, frequency: 'bimonthly', startMonth: 1 }
  const bimonthlyEven = { active: true, frequency: 'bimonthly', startMonth: 2 }
  const quarterly = { active: true, frequency: 'quarterly', startMonth: 1 }
  const quarterlyFeb = { active: true, frequency: 'quarterly', startMonth: 2 }
  const annual = { active: true, frequency: 'annual', startMonth: 3 }

  it('monthly charge is due every month', () => {
    expect(isDueThisMonth(monthly, '2026-01')).toBe(true)
    expect(isDueThisMonth(monthly, '2026-06')).toBe(true)
    expect(isDueThisMonth(monthly, '2026-12')).toBe(true)
  })

  it('bimonthly startMonth=1 fires in odd months', () => {
    expect(isDueThisMonth(bimonthly, '2026-01')).toBe(true)
    expect(isDueThisMonth(bimonthly, '2026-02')).toBe(false)
    expect(isDueThisMonth(bimonthly, '2026-03')).toBe(true)
    expect(isDueThisMonth(bimonthly, '2026-04')).toBe(false)
  })

  it('bimonthly startMonth=2 fires in even months', () => {
    expect(isDueThisMonth(bimonthlyEven, '2026-02')).toBe(true)
    expect(isDueThisMonth(bimonthlyEven, '2026-04')).toBe(true)
    expect(isDueThisMonth(bimonthlyEven, '2026-01')).toBe(false)
    expect(isDueThisMonth(bimonthlyEven, '2026-03')).toBe(false)
  })

  it('quarterly startMonth=1 fires in months 1, 4, 7, 10', () => {
    expect(isDueThisMonth(quarterly, '2026-01')).toBe(true)
    expect(isDueThisMonth(quarterly, '2026-04')).toBe(true)
    expect(isDueThisMonth(quarterly, '2026-07')).toBe(true)
    expect(isDueThisMonth(quarterly, '2026-10')).toBe(true)
    expect(isDueThisMonth(quarterly, '2026-02')).toBe(false)
  })

  it('quarterly startMonth=2 fires in months 2, 5, 8, 11', () => {
    expect(isDueThisMonth(quarterlyFeb, '2026-02')).toBe(true)
    expect(isDueThisMonth(quarterlyFeb, '2026-05')).toBe(true)
    expect(isDueThisMonth(quarterlyFeb, '2026-08')).toBe(true)
    expect(isDueThisMonth(quarterlyFeb, '2026-11')).toBe(true)
    expect(isDueThisMonth(quarterlyFeb, '2026-01')).toBe(false)
  })

  it('annual fires only in the startMonth', () => {
    expect(isDueThisMonth(annual, '2026-03')).toBe(true)
    expect(isDueThisMonth(annual, '2026-01')).toBe(false)
    expect(isDueThisMonth(annual, '2026-12')).toBe(false)
  })

  it('returns false for inactive charge regardless of frequency', () => {
    expect(isDueThisMonth({ active: false, frequency: 'monthly' }, '2026-03')).toBe(false)
  })
})

// ─── getEffectiveMonth ───────────────────────────────────────

describe('getEffectiveMonth', () => {
  it('returns same month when no delay', () => {
    expect(getEffectiveMonth({ paymentDelayMonths: 0 }, '2026-03')).toBe('2026-03')
  })

  it('returns previous month with delay of 1', () => {
    expect(getEffectiveMonth({ paymentDelayMonths: 1 }, '2026-03')).toBe('2026-02')
  })

  it('handles year boundary', () => {
    expect(getEffectiveMonth({ paymentDelayMonths: 1 }, '2026-01')).toBe('2025-12')
  })

  it('handles delay of 2', () => {
    expect(getEffectiveMonth({ paymentDelayMonths: 2 }, '2026-03')).toBe('2026-01')
  })
})

// ─── isInstallmentDue ────────────────────────────────────────

describe('isInstallmentDue', () => {
  const installment = {
    firstPaymentDate: '2026-01-15',
    installmentCount: 4,
  }

  it('returns true for first month', () => {
    expect(isInstallmentDue(installment, '2026-01')).toBe(true)
  })

  it('returns true for last month of installment', () => {
    expect(isInstallmentDue(installment, '2026-04')).toBe(true)
  })

  it('returns false before first payment', () => {
    expect(isInstallmentDue(installment, '2025-12')).toBe(false)
  })

  it('returns false after installment ends', () => {
    expect(isInstallmentDue(installment, '2026-05')).toBe(false)
  })

  it('returns true for middle months', () => {
    expect(isInstallmentDue(installment, '2026-02')).toBe(true)
    expect(isInstallmentDue(installment, '2026-03')).toBe(true)
  })
})

// ─── getInstallmentNumber ────────────────────────────────────

describe('getInstallmentNumber', () => {
  const installment = { firstPaymentDate: '2026-01-15', installmentCount: 4 }

  it('returns 1 for first month', () => {
    expect(getInstallmentNumber(installment, '2026-01')).toBe(1)
  })

  it('returns 4 for last month', () => {
    expect(getInstallmentNumber(installment, '2026-04')).toBe(4)
  })

  it('returns correct middle values', () => {
    expect(getInstallmentNumber(installment, '2026-02')).toBe(2)
    expect(getInstallmentNumber(installment, '2026-03')).toBe(3)
  })
})

// ─── computeMonth ────────────────────────────────────────────

describe('computeMonth', () => {
  const household = {
    personAName: 'Alice',
    personBName: 'Bob',
    configModel: 'common_and_personal',
    splitRatio: 0.5,
    splitMode: '50/50',
  }

  const soloHousehold = {
    personAName: 'Alice',
    configModel: 'solo',
    splitRatio: 1,
    splitMode: '50/50',
  }

  it('returns zeros when no household', () => {
    const result = computeMonth('2026-03', null, [], [], [], null)
    expect(result.resteFoyer).toBe(0)
    expect(result.charges).toEqual([])
  })

  it('computes basic income minus charges', () => {
    const charges = [
      { id: '1', name: 'Loyer', amount: 1000, payer: 'common', frequency: 'monthly', active: true },
    ]
    const entry = { incomeA: 3000, incomeB: 2000 }
    const result = computeMonth('2026-03', household, charges, [], [], entry)

    expect(result.totalCommon).toBe(1000)
    expect(result.shareA).toBe(500) // 50% of 1000
    expect(result.shareB).toBe(500)
    expect(result.resteA).toBe(2500) // 3000 - 500
    expect(result.resteB).toBe(1500) // 2000 - 500
    expect(result.resteFoyer).toBe(4000) // 2500 + 1500
  })

  it('handles personal charges correctly', () => {
    const charges = [
      { id: '1', name: 'Loyer', amount: 1000, payer: 'common', frequency: 'monthly', active: true },
      { id: '2', name: 'Tel Alice', amount: 30, payer: 'person_a', frequency: 'monthly', active: true },
      { id: '3', name: 'Tel Bob', amount: 25, payer: 'person_b', frequency: 'monthly', active: true },
    ]
    const entry = { incomeA: 3000, incomeB: 2000 }
    const result = computeMonth('2026-03', household, charges, [], [], entry)

    expect(result.personalACharges).toBe(30)
    expect(result.personalBCharges).toBe(25)
    expect(result.resteA).toBe(2470) // 3000 - 500 - 30
    expect(result.resteB).toBe(1475) // 2000 - 500 - 25
  })

  it('applies pro rata split correctly', () => {
    const prorataHousehold = { ...household, splitMode: 'prorata' }
    const charges = [
      { id: '1', name: 'Loyer', amount: 1000, payer: 'common', frequency: 'monthly', active: true },
    ]
    // Alice earns 3000, Bob 2000 → Alice pays 60%, Bob 40%
    const entry = { incomeA: 3000, incomeB: 2000 }
    const result = computeMonth('2026-03', prorataHousehold, charges, [], [], entry)

    expect(result.ratio).toBe(0.6)
    expect(result.shareA).toBe(600)
    expect(result.shareB).toBe(400)
    expect(result.resteA).toBe(2400) // 3000 - 600
    expect(result.resteB).toBe(1600) // 2000 - 400
  })

  it('pro rata falls back to splitRatio when no income', () => {
    const prorataHousehold = { ...household, splitMode: 'prorata', splitRatio: 0.6 }
    const charges = [
      { id: '1', name: 'Loyer', amount: 1000, payer: 'common', frequency: 'monthly', active: true },
    ]
    const result = computeMonth('2026-03', prorataHousehold, charges, [], [], null)

    expect(result.ratio).toBe(0.6)
  })

  it('handles custom split ratio', () => {
    const customHousehold = { ...household, splitMode: 'custom', splitRatio: 0.7 }
    const charges = [
      { id: '1', name: 'Loyer', amount: 1000, payer: 'common', frequency: 'monthly', active: true },
    ]
    const entry = { incomeA: 3000, incomeB: 2000 }
    const result = computeMonth('2026-03', customHousehold, charges, [], [], entry)

    expect(result.shareA).toBeCloseTo(700) // 70%
    expect(result.shareB).toBeCloseTo(300) // 30%
  })

  it('includes installments when due', () => {
    const installments = [
      {
        id: 'inst1',
        name: 'Machine a laver',
        firstPaymentDate: '2026-01-01',
        installmentCount: 10,
        installmentAmount: 50,
        totalAmount: 500,
        payer: 'common',
      },
    ]
    const entry = { incomeA: 3000, incomeB: 2000 }
    const result = computeMonth('2026-03', household, [], installments, [], entry)

    expect(result.charges).toHaveLength(1)
    expect(result.charges[0].type).toBe('installment')
    expect(result.charges[0].amount).toBe(50)
    expect(result.charges[0].name).toContain('3/10')
  })

  it('excludes installments when not due', () => {
    const installments = [
      {
        id: 'inst1',
        name: 'Machine a laver',
        firstPaymentDate: '2026-06-01',
        installmentCount: 3,
        installmentAmount: 100,
        totalAmount: 300,
        payer: 'common',
      },
    ]
    const result = computeMonth('2026-03', household, [], installments, [], null)
    expect(result.charges).toHaveLength(0)
  })

  it('includes planned expenses for the month', () => {
    const planned = [
      { id: 'p1', name: 'Vacances', estimatedAmount: 2000, payer: 'common', targetMonth: '2026-03' },
    ]
    const entry = { incomeA: 3000, incomeB: 2000 }
    const result = computeMonth('2026-03', household, [], [], planned, entry)

    expect(result.charges).toHaveLength(1)
    expect(result.charges[0].type).toBe('planned')
    expect(result.totalCommon).toBe(2000)
  })

  it('excludes planned expenses for other months', () => {
    const planned = [
      { id: 'p1', name: 'Vacances', estimatedAmount: 2000, payer: 'common', targetMonth: '2026-08' },
    ]
    const result = computeMonth('2026-03', household, [], [], planned, null)
    expect(result.charges).toHaveLength(0)
  })

  it('applies variable overrides to fixed charges', () => {
    const charges = [
      { id: 'c1', name: 'Electricite', amount: 100, payer: 'common', frequency: 'monthly', active: true },
    ]
    const entry = { incomeA: 3000, incomeB: 2000, variableOverrides: { c1: 150 } }
    const result = computeMonth('2026-03', household, charges, [], [], entry)

    expect(result.charges[0].amount).toBe(150)
    expect(result.charges[0].isVariable).toBe(true)
    expect(result.charges[0].originalAmount).toBe(100)
    expect(result.totalCommon).toBe(150)
  })

  it('computes reste a vivre from salary only', () => {
    const charges = [
      { id: '1', name: 'Loyer', amount: 1000, payer: 'common', frequency: 'monthly', active: true },
    ]
    const entry = { incomeA: 3000, incomeB: 2000 }
    const result = computeMonth('2026-03', household, charges, [], [], entry)

    expect(result.resteA).toBe(2500) // 3000 - 500
    expect(result.resteB).toBe(1500) // 2000 - 500
  })

  it('handles solo mode with only person A', () => {
    const charges = [
      { id: '1', name: 'Loyer', amount: 800, payer: 'person_a', frequency: 'monthly', active: true },
    ]
    const entry = { incomeA: 3000 }
    const result = computeMonth('2026-03', soloHousehold, charges, [], [], entry)

    expect(result.personalACharges).toBe(800)
    expect(result.resteA).toBe(2200)
    expect(result.resteB).toBe(0)
  })

  it('skips inactive charges', () => {
    const charges = [
      { id: '1', name: 'Loyer', amount: 1000, payer: 'common', frequency: 'monthly', active: false },
    ]
    const entry = { incomeA: 3000, incomeB: 2000 }
    const result = computeMonth('2026-03', household, charges, [], [], entry)

    expect(result.charges).toHaveLength(0)
    expect(result.totalCommon).toBe(0)
  })

  it('deducts negative starting balance from reste a vivre', () => {
    const charges = [
      { id: '1', name: 'Loyer', amount: 1000, payer: 'common', frequency: 'monthly', active: true },
    ]
    const entry = { incomeA: 3000, incomeB: 2000, startingBalanceA: -200, startingBalanceB: -100 }
    const result = computeMonth('2026-03', household, charges, [], [], entry)

    expect(result.startingBalanceA).toBe(-200)
    expect(result.startingBalanceB).toBe(-100)
    expect(result.resteA).toBe(2300) // 3000 + (-200) - 500
    expect(result.resteB).toBe(1400) // 2000 + (-100) - 500
    expect(result.resteFoyer).toBe(3700)
  })

  it('handles positive starting balance', () => {
    const charges = [
      { id: '1', name: 'Loyer', amount: 1000, payer: 'common', frequency: 'monthly', active: true },
    ]
    const entry = { incomeA: 3000, incomeB: 2000, startingBalanceA: 500, startingBalanceB: 0 }
    const result = computeMonth('2026-03', household, charges, [], [], entry)

    expect(result.resteA).toBe(3000) // 3000 + 500 - 500
    expect(result.resteB).toBe(1500) // 2000 + 0 - 500
  })

  it('defaults starting balance to 0 when not provided', () => {
    const charges = [
      { id: '1', name: 'Loyer', amount: 1000, payer: 'common', frequency: 'monthly', active: true },
    ]
    const entry = { incomeA: 3000, incomeB: 2000 }
    const result = computeMonth('2026-03', household, charges, [], [], entry)

    expect(result.startingBalanceA).toBe(0)
    expect(result.startingBalanceB).toBe(0)
    expect(result.resteA).toBe(2500)
    expect(result.resteB).toBe(1500)
  })

  it('respects bimonthly frequency', () => {
    const charges = [
      { id: '1', name: 'Assurance', amount: 200, payer: 'common', frequency: 'bimonthly', startMonth: 1, active: true },
    ]
    const entry = { incomeA: 3000, incomeB: 2000 }

    const janResult = computeMonth('2026-01', household, charges, [], [], entry)
    const febResult = computeMonth('2026-02', household, charges, [], [], entry)

    expect(janResult.charges).toHaveLength(1)
    expect(febResult.charges).toHaveLength(0)
  })
})

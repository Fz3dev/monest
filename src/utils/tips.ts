import { formatCurrency } from './format'
import i18n from '../i18n'
import type { FixedCharge, InstallmentPayment } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SmartTip {
  id: string
  icon: string
  title: string
  message: string
  category: 'savings' | 'negotiation' | 'optimization' | 'warning'
  potentialSaving?: string
}

// ─── Detection patterns ──────────────────────────────────────────────────────

const TELECOM_PATTERNS = ['SFR', 'ORANGE', 'FREE', 'BOUYGUES', 'SOSH']

const STREAMING_PATTERNS = [
  'NETFLIX', 'DISNEY', 'PRIME', 'CANAL', 'OCS', 'DAZN',
  'APPLE TV', 'CRUNCHYROLL', 'SPOTIFY', 'DEEZER',
]

const ENERGY_PATTERNS = ['ENGIE', 'EDF', 'TOTAL ENERG', 'GAZ', 'ELECTRICITE', 'ENERGIE']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nameMatches(name: string, patterns: string[]): boolean {
  const upper = name.toUpperCase()
  return patterns.some((p) => upper.includes(p))
}

function getActiveCharges(fixedCharges: FixedCharge[]): FixedCharge[] {
  return fixedCharges.filter((c) => c.active)
}

function monthlyAmount(charge: FixedCharge): number {
  switch (charge.frequency) {
    case 'bimonthly': return charge.amount / 2
    case 'quarterly': return charge.amount / 3
    case 'annual': return charge.amount / 12
    default: return charge.amount
  }
}

// ─── Tip generators ──────────────────────────────────────────────────────────

interface TipCandidate {
  tip: SmartTip
  priority: number // lower = higher priority
}

function checkSubscriptionCount(charges: FixedCharge[]): TipCandidate | null {
  const subs = charges.filter((c) => c.category === 'abonnement')
  if (subs.length <= 2) return null

  const total = subs.reduce((sum, c) => sum + monthlyAmount(c), 0)
  return {
    tip: {
      id: 'subscription-count',
      icon: '\ud83d\udcf1',
      title: 'Abonnements',
      message: i18n.t('tips.subscriptionCount', { count: subs.length, amount: formatCurrency(total) }),
      category: 'optimization',
      potentialSaving: i18n.t('tips.potentialSaving', { amount: '10-30\u20ac/mois' }),
    },
    priority: 2,
  }
}

function checkTelecom(charges: FixedCharge[]): TipCandidate | null {
  const telecoms = charges.filter((c) => nameMatches(c.name, TELECOM_PATTERNS))
  if (telecoms.length === 0) return null

  const total = telecoms.reduce((sum, c) => sum + monthlyAmount(c), 0)
  return {
    tip: {
      id: 'telecom',
      icon: '\ud83d\udcf6',
      title: 'Forfait mobile/internet',
      message: i18n.t('tips.mobileInternet', { amount: formatCurrency(total) }),
      category: 'negotiation',
      potentialSaving: i18n.t('tips.potentialSaving', { amount: '5-20\u20ac/mois' }),
    },
    priority: 4,
  }
}

function checkInsurance(charges: FixedCharge[]): TipCandidate | null {
  const insurances = charges.filter((c) => c.category === 'assurance')
  if (insurances.length === 0) return null

  const total = insurances.reduce((sum, c) => sum + monthlyAmount(c), 0)
  return {
    tip: {
      id: 'insurance',
      icon: '\ud83d\udee1\ufe0f',
      title: 'Assurances',
      message: i18n.t('tips.insurance', { amount: formatCurrency(total) }),
      category: 'negotiation',
      potentialSaving: i18n.t('tips.potentialSaving', { amount: '10-50\u20ac/mois' }),
    },
    priority: 3,
  }
}

function checkEnergy(charges: FixedCharge[]): TipCandidate | null {
  const energy = charges.filter(
    (c) => c.category === 'logement' && nameMatches(c.name, ENERGY_PATTERNS)
  )
  if (energy.length === 0) return null

  const total = energy.reduce((sum, c) => sum + monthlyAmount(c), 0)
  return {
    tip: {
      id: 'energy',
      icon: '\u26a1',
      title: 'Contrat \u00e9nergie',
      message: i18n.t('tips.energy', { amount: formatCurrency(total) }),
      category: 'negotiation',
      potentialSaving: i18n.t('tips.potentialSaving', { amount: '10-25\u20ac/mois' }),
    },
    priority: 3,
  }
}

function checkMultipleCredits(charges: FixedCharge[]): TipCandidate | null {
  const credits = charges.filter((c) => c.category === 'credit')
  if (credits.length <= 1) return null

  return {
    tip: {
      id: 'multiple-credits',
      icon: '\ud83c\udfe6',
      title: 'Cr\u00e9dits en cours',
      message: i18n.t('tips.multipleCredits', { count: credits.length }),
      category: 'optimization',
    },
    priority: 2,
  }
}

function checkStreaming(charges: FixedCharge[]): TipCandidate | null {
  const streaming = charges.filter(
    (c) => nameMatches(c.name, STREAMING_PATTERNS) && !nameMatches(c.name, ENERGY_PATTERNS)
  )
  if (streaming.length <= 1) return null

  const total = streaming.reduce((sum, c) => sum + monthlyAmount(c), 0)
  const names = streaming.map((c) => c.name).join(', ')
  return {
    tip: {
      id: 'streaming',
      icon: '\ud83c\udfac',
      title: 'Streaming',
      message: i18n.t('tips.streaming', { count: streaming.length, names, amount: formatCurrency(total) }),
      category: 'savings',
      potentialSaving: i18n.t('tips.potentialSaving', { amount: `${formatCurrency(monthlyAmount(streaming[streaming.length - 1]))}/mois` }),
    },
    priority: 1,
  }
}

function checkTransport(charges: FixedCharge[]): TipCandidate | null {
  const transport = charges.filter((c) => c.category === 'transport')
  if (transport.length === 0) return null

  const total = transport.reduce((sum, c) => sum + monthlyAmount(c), 0)
  if (total <= 150) return null

  return {
    tip: {
      id: 'transport',
      icon: '\ud83d\ude97',
      title: 'Transport',
      message: i18n.t('tips.transport', { amount: formatCurrency(total) }),
      category: 'optimization',
    },
    priority: 5,
  }
}

function checkChargesRatio(charges: FixedCharge[], installments: InstallmentPayment[], totalIncome: number): TipCandidate | null {
  if (totalIncome <= 0) return null

  const fixedTotal = charges.reduce((sum, c) => sum + monthlyAmount(c), 0)
  const installmentTotal = installments.reduce((sum, p) => sum + p.installmentAmount, 0)
  const totalCharges = fixedTotal + installmentTotal

  if (totalCharges / totalIncome <= 0.7) return null

  return {
    tip: {
      id: 'charges-ratio',
      icon: '\u26a0\ufe0f',
      title: 'Taux de charges \u00e9lev\u00e9',
      message: i18n.t('tips.chargesRatio'),
      category: 'warning',
    },
    priority: 0,
  }
}

function checkCommitmentEnding(charges: FixedCharge[], currentMonth: string): TipCandidate[] {
  const [curY, curM] = currentMonth.split('-').map(Number)
  const results: TipCandidate[] = []

  for (const charge of charges) {
    if (!charge.commitmentEndsAt) continue
    const [endY, endM] = charge.commitmentEndsAt.split('-').map(Number)
    const remaining = (endY - curY) * 12 + (endM - curM)

    if (remaining > 0 && remaining <= 2) {
      results.push({
        tip: {
          id: `commitment-${charge.id}`,
          icon: '\ud83d\udcc5',
          title: 'Fin d\u2019engagement',
          message: i18n.t('tips.commitmentEnding', { name: charge.name }),
          category: 'negotiation',
        },
        priority: 1,
      })
    }
  }

  return results
}

// ─── Main function ───────────────────────────────────────────────────────────

export function generateSmartTips(
  fixedCharges: FixedCharge[],
  installmentPayments: InstallmentPayment[],
  totalIncome: number,
  currentMonth: string,
): SmartTip[] {
  const active = getActiveCharges(fixedCharges)
  const candidates: TipCandidate[] = []

  const checks = [
    checkSubscriptionCount(active),
    checkTelecom(active),
    checkInsurance(active),
    checkEnergy(active),
    checkMultipleCredits(active),
    checkStreaming(active),
    checkTransport(active),
    checkChargesRatio(active, installmentPayments, totalIncome),
  ]

  for (const c of checks) {
    if (c) candidates.push(c)
  }

  candidates.push(...checkCommitmentEnding(active, currentMonth))

  // Shuffle candidates of same priority, then return max 2
  candidates.sort((a, b) => a.priority - b.priority || Math.random() - 0.5)
  return candidates.slice(0, 2).map((c) => c.tip)
}

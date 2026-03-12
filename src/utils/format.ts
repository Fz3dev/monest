import i18n from '../i18n'
import { useCategoriesStore } from '../stores/categoriesStore'
import { useHouseholdStore, DEFAULT_CURRENCY } from '../stores/householdStore'
import { useUiStore } from '../stores/uiStore'
import type { Household, CategoryListItem, FrequencyOption, CategoryOption } from '../types'
import type { TFunction } from 'i18next'

// Cache formatters by currency code to avoid creating them on every call
const formatterCache: Record<string, Intl.NumberFormat> = {}

function getFormatter(currency: string, decimals: boolean): Intl.NumberFormat {
  const key = `${currency}-${decimals ? 'd' : 'n'}`
  if (!formatterCache[key]) {
    formatterCache[key] = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals ? 2 : 0,
      maximumFractionDigits: decimals ? 2 : 0,
    })
  }
  return formatterCache[key]
}

export function formatCurrency(amount: number, decimals?: boolean, currency?: string): string {
  if (useUiStore.getState().confidentialMode) return '•••• €'
  const code = currency || useHouseholdStore.getState().household?.currency || DEFAULT_CURRENCY
  const showDecimals = decimals ?? (amount % 1 !== 0)
  return getFormatter(code, showDecimals).format(amount)
}

export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const months = i18n.t('months.full', { returnObjects: true }) as string[]
  return `${months[parseInt(month, 10) - 1]} ${year}`
}

export function formatMonthShort(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const months = i18n.t('months.short', { returnObjects: true }) as string[]
  return `${months[parseInt(month, 10) - 1]} ${year.slice(2)}`
}

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const CATEGORIES: CategoryListItem[] = [
  { value: 'logement', labelKey: 'categories.logement' },
  { value: 'assurance', labelKey: 'categories.assurance' },
  { value: 'credit', labelKey: 'categories.credit' },
  { value: 'abonnement', labelKey: 'categories.abonnement' },
  { value: 'impot', labelKey: 'categories.impot' },
  { value: 'transport', labelKey: 'categories.transport' },
  { value: 'alimentation', labelKey: 'categories.alimentation' },
  { value: 'sante', labelKey: 'categories.sante' },
  { value: 'education', labelKey: 'categories.education' },
  { value: 'loisirs', labelKey: 'categories.loisirs' },
  { value: 'enfants', labelKey: 'categories.enfants' },
  { value: 'epargne', labelKey: 'categories.epargne' },
  { value: 'autre', labelKey: 'categories.autre' },
] as const

// Helper to get translated label for a category
export function getCategoryLabel(value: string): string {
  const cat = CATEGORIES.find((c) => c.value === value)
  if (cat) return i18n.t(cat.labelKey)
  // Custom category: capitalize
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ')
}

// Returns CATEGORIES with translated labels (for Select components)
// Includes custom categories from store if available
export function getTranslatedCategories(t: TFunction): CategoryOption[] {
  const base: CategoryOption[] = CATEGORIES.map((c) => ({ value: c.value, label: t(c.labelKey) }))
  // Add custom categories from store
  const storeCategories = useCategoriesStore.getState().categories
  const defaultKeys = new Set(CATEGORIES.map((c) => c.value))
  for (const key of Object.keys(storeCategories)) {
    if (!defaultKeys.has(key)) {
      base.push({ value: key, label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ') })
    }
  }
  return base
}

export const FREQUENCIES: FrequencyOption[] = [
  { value: 'monthly', labelKey: 'frequencies.monthly' },
  { value: 'bimonthly', labelKey: 'frequencies.bimonthly' },
  { value: 'quarterly', labelKey: 'frequencies.quarterly' },
  { value: 'annual', labelKey: 'frequencies.annual' },
] as const

// Helper to get translated label for a frequency
export function getFrequencyLabel(value: string): string {
  const freq = FREQUENCIES.find((f) => f.value === value)
  return freq ? i18n.t(freq.labelKey) : value
}

// Returns FREQUENCIES with translated labels (for Select components)
export function getTranslatedFrequencies(t: TFunction): CategoryOption[] {
  return FREQUENCIES.map((f) => ({ value: f.value, label: t(f.labelKey) }))
}

interface PayerOption {
  value: string
  label: string
}

export const PAYER_OPTIONS = (household: Household | null, t?: TFunction): PayerOption[] => {
  const options: PayerOption[] = []
  if (household?.configModel !== 'solo' && household?.configModel !== 'full_personal') {
    options.push({ value: 'common', label: t ? t('payer.commonAccount') : 'Compte commun' })
  }
  options.push({ value: 'person_a', label: household?.personAName || (t ? t('common.personA') : 'Personne A') })
  if (household?.personBName) {
    options.push({ value: 'person_b', label: household.personBName })
  }
  return options
}

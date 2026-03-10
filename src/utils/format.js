import i18n from '../i18n'
import { useCategoriesStore } from '../stores/categoriesStore'

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const currencyFormatterDecimals = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(amount, decimals = false) {
  return decimals ? currencyFormatterDecimals.format(amount) : currencyFormatter.format(amount)
}

export function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-')
  const months = i18n.t('months.full', { returnObjects: true })
  return `${months[parseInt(month, 10) - 1]} ${year}`
}

export function formatMonthShort(monthStr) {
  const [year, month] = monthStr.split('-')
  const months = i18n.t('months.short', { returnObjects: true })
  return `${months[parseInt(month, 10) - 1]} ${year.slice(2)}`
}

export function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const CATEGORIES = [
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
  { value: 'autre', labelKey: 'categories.autre' },
]

// Helper to get translated label for a category
export function getCategoryLabel(value) {
  const cat = CATEGORIES.find((c) => c.value === value)
  if (cat) return i18n.t(cat.labelKey)
  // Custom category: capitalize
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ')
}

// Returns CATEGORIES with translated labels (for Select components)
// Includes custom categories from store if available
export function getTranslatedCategories(t) {
  const base = CATEGORIES.map((c) => ({ value: c.value, label: t(c.labelKey) }))
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

export const FREQUENCIES = [
  { value: 'monthly', labelKey: 'frequencies.monthly' },
  { value: 'bimonthly', labelKey: 'frequencies.bimonthly' },
  { value: 'quarterly', labelKey: 'frequencies.quarterly' },
  { value: 'annual', labelKey: 'frequencies.annual' },
]

// Helper to get translated label for a frequency
export function getFrequencyLabel(value) {
  const freq = FREQUENCIES.find((f) => f.value === value)
  return freq ? i18n.t(freq.labelKey) : value
}

// Returns FREQUENCIES with translated labels (for Select components)
export function getTranslatedFrequencies(t) {
  return FREQUENCIES.map((f) => ({ value: f.value, label: t(f.labelKey) }))
}

export const PAYER_OPTIONS = (household, t) => {
  const options = []
  if (household?.configModel !== 'solo' && household?.configModel !== 'full_personal') {
    options.push({ value: 'common', label: t ? t('payer.commonAccount') : 'Compte commun' })
  }
  options.push({ value: 'person_a', label: household?.personAName || (t ? t('common.personA') : 'Personne A') })
  if (household?.personBName) {
    options.push({ value: 'person_b', label: household.personBName })
  }
  return options
}

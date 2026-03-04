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

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const SHORT_MONTH_NAMES = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
]

export function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-')
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`
}

export function formatMonthShort(monthStr) {
  const [year, month] = monthStr.split('-')
  return `${SHORT_MONTH_NAMES[parseInt(month, 10) - 1]} ${year.slice(2)}`
}

export function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const CATEGORIES = [
  { value: 'logement', label: 'Logement' },
  { value: 'assurance', label: 'Assurance' },
  { value: 'credit', label: 'Crédit' },
  { value: 'abonnement', label: 'Abonnement' },
  { value: 'impot', label: 'Impôt' },
  { value: 'transport', label: 'Transport' },
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'sante', label: 'Santé' },
  { value: 'education', label: 'Éducation' },
  { value: 'loisirs', label: 'Loisirs' },
  { value: 'enfants', label: 'Enfants' },
  { value: 'autre', label: 'Autre' },
]

export const FREQUENCIES = [
  { value: 'monthly', label: 'Mensuelle' },
  { value: 'bimonthly', label: 'Bimestrielle' },
  { value: 'quarterly', label: 'Trimestrielle' },
  { value: 'annual', label: 'Annuelle' },
]

export const PAYER_OPTIONS = (household) => {
  const options = []
  if (household?.configModel !== 'solo' && household?.configModel !== 'full_personal') {
    options.push({ value: 'common', label: 'Compte commun' })
  }
  options.push({ value: 'person_a', label: household?.personAName || 'Personne A' })
  if (household?.personBName) {
    options.push({ value: 'person_b', label: household.personBName })
  }
  return options
}

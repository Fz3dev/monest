// ─── Domain constants & types ────────────────────────────────────────────────

export const PAYER = { Common: 'common', PersonA: 'person_a', PersonB: 'person_b' } as const
export type Payer = typeof PAYER[keyof typeof PAYER]
export const PAYER_ORDER: Record<string, number> = { [PAYER.Common]: 0, [PAYER.PersonA]: 1, [PAYER.PersonB]: 2 }

export const FREQUENCY = { Monthly: 'monthly', Bimonthly: 'bimonthly', Quarterly: 'quarterly', Annual: 'annual' } as const
export type Frequency = typeof FREQUENCY[keyof typeof FREQUENCY]

export const CONFIG_MODEL = { Solo: 'solo', CommonAndPersonal: 'common_and_personal', FullCommon: 'full_common', FullPersonal: 'full_personal' } as const
export type ConfigModel = typeof CONFIG_MODEL[keyof typeof CONFIG_MODEL]

export const SPLIT_MODE = { FiftyFifty: '50/50', Prorata: 'prorata', Custom: 'custom' } as const
export type SplitMode = typeof SPLIT_MODE[keyof typeof SPLIT_MODE]

export interface Household {
  id: string
  name: string
  personAName: string
  personAColor: string
  personBName?: string
  personBColor?: string
  configModel: ConfigModel
  splitRatio: number
  splitMode: SplitMode
  currency: string
}

export interface FixedCharge {
  id: string
  name: string
  amount: number
  payer: Payer
  category: string
  frequency: Frequency
  active: boolean
  startMonth?: number
  dayOfMonth?: number
  startsAt?: string
  endsAt?: string
  commitmentEndsAt?: string
  paymentDelayMonths?: number
  householdId?: string
  createdAt: string
  updatedAt: string
}

export interface InstallmentPayment {
  id: string
  name: string
  totalAmount?: number
  installmentAmount: number
  installmentCount: number
  firstPaymentDate: string
  payer: Payer
  householdId?: string
  createdAt: string
  updatedAt: string
}

export interface PlannedExpense {
  id: string
  name: string
  estimatedAmount: number
  targetMonth: string
  payer: Payer
  note?: string
  householdId?: string
  createdAt: string
  updatedAt: string
}

export interface MonthlyEntry {
  month: string
  incomeA: number
  incomeB: number
  startingBalanceA: number
  startingBalanceB: number
  otherIncomeCommon: number
  otherIncomeA: number
  otherIncomeB: number
  transferredA: number
  transferredB: number
  variableOverrides: Record<string, number>
  disabledCharges: string[]
}

export interface ChargeDetail {
  id: string
  name: string
  amount: number
  payer: Payer
  category?: string
  type: 'fixed' | 'installment' | 'planned'
  isVariable?: boolean
  isDisabledThisMonth?: boolean
  originalAmount?: number
  installmentNumber?: number
  installmentTotal?: number
}

export interface ComputeMonthResult {
  incomeA: number
  incomeB: number
  startingBalanceA: number
  startingBalanceB: number
  otherIncomeCommon: number
  otherIncomeA: number
  otherIncomeB: number
  resteA: number
  resteB: number
  resteFoyer: number
  totalCommon: number
  netCommonCharges: number
  shareA: number
  shareB: number
  personalACharges: number
  personalBCharges: number
  charges: ChargeDetail[]
  ratio: number
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  icon?: string
  color?: string
  deadline?: string
  householdId?: string
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  name: string
  amount: number
  category: string
  date: string
  payer?: Payer
  note?: string
  householdId?: string
  createdAt: string
  updatedAt: string
}

export interface AppNotification {
  id: string
  householdId: string
  userId: string
  actorId: string
  type: string
  title: string
  body?: string | null
  metadata?: Record<string, unknown>
  read: boolean
  createdAt: string
}

export interface CategoryMeta {
  color: string
  emoji: string
}

export interface CategoryOption {
  value: string
  label: string
}

export interface FrequencyOption {
  value: string
  labelKey: string
}

export interface CategoryListItem {
  value: string
  labelKey: string
}

export interface Insight {
  type: 'positive' | 'warning' | 'danger'
  message: string
}

export interface Badge {
  id: string
  icon: string
  label: string
  unlocked: boolean
}

// ─── Dashboard layout ────────────────────────────────────────────────────────

export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
}

/**
 * Dashboard layouts keyed by breakpoint name.
 * Uses `readonly LayoutItem[]` to stay compatible with react-grid-layout's
 * `ResponsiveLayouts` type which returns readonly arrays.
 */
export type Layouts = Record<string, readonly LayoutItem[]>

export interface WidgetConstraint {
  minW: number
  maxW: number
  minH: number
  maxH: number
}

// ─── CSV/PDF parsing ─────────────────────────────────────────────────────────

export interface DetectedColumns {
  dateCol: string
  labelCol: string
  debitCol: string | null
  creditCol: string | null
}

export interface RecurringCharge {
  suggestedName: string
  originalLabels: string[]
  avgAmount: number
  frequency: Frequency
  occurrences: number
  isStable: boolean
  dates: string[]
}

export interface CurrencyOption {
  value: string
  label: string
  symbol: string
}

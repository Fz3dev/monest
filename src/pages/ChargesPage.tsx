import { useState, useCallback, useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react'
import type { PanInfo } from 'motion-dom'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useCategoriesStore } from '../stores/categoriesStore'
import { formatCurrency, PAYER_OPTIONS, getTranslatedCategories, getTranslatedFrequencies, getCategoryLabel, getFrequencyLabel } from '../utils/format'
import { syncToSupabase } from '../lib/syncBridge'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import { Plus, Trash2, ToggleLeft, ToggleRight, Edit3, Search, ArrowUpDown, Upload, Archive, ArchiveRestore, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { PAYER } from '../types'
import type { Household, FixedCharge, InstallmentPayment, PlannedExpense, Payer } from '../types'
import type { LucideIcon } from 'lucide-react'

interface SwipeAction {
  icon: LucideIcon
  color: string
  label: string
  onClick: () => void
}

interface ModalState {
  type: string
  editId?: string
}

type ChargeType = 'fixed' | 'installment' | 'planned'
type SortMode = 'default' | 'amount_desc' | 'amount_asc' | 'name' | 'category'

// Union type for items that can be filtered/sorted
type ChargeItem = FixedCharge | InstallmentPayment | PlannedExpense

const EMPTY_ACTIONS: SwipeAction[] = []

function SwipeableCard({ actions = EMPTY_ACTIONS, children }: { actions?: SwipeAction[]; children: ReactNode }) {
  const x = useMotionValue(0)
  const totalWidth = actions.length * 70

  const handleDragEnd = (_: Event, info: PanInfo) => {
    if (info.offset.x < -totalWidth * 0.5) {
      animate(x, -totalWidth, { type: 'spring', stiffness: 500, damping: 40 })
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 })
    }
  }

  const close = () => animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 })

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Action buttons behind — mobile only */}
      <div className="absolute inset-y-0 right-0 flex lg:hidden">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => { close(); setTimeout(action.onClick, 150) }}
            className="w-[70px] flex items-center justify-center transition-colors active:brightness-90"
            style={{ backgroundColor: action.color }}
            aria-label={action.label}
          >
            <action.icon size={18} className="text-white" />
          </button>
        ))}
      </div>
      <motion.div
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -totalWidth, right: 0 }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
        className="relative z-10 bg-bg-primary lg:!transform-none"
      >
        {children}
      </motion.div>
    </div>
  )
}

interface ChargeFormProps {
  initialValues?: FixedCharge
  onSubmit: (data: Record<string, unknown>) => void
  onCancel: () => void
  household: Household | null
  t: TFunction
}

function ChargeForm({ initialValues, onSubmit, onCancel, household, t }: ChargeFormProps) {
  const payerOptions = PAYER_OPTIONS(household, t)
  const categories = getTranslatedCategories(t)
  const frequencies = getTranslatedFrequencies(t)
  const [form, setForm] = useState(() => {
    if (initialValues) {
      return {
        ...initialValues,
        amount: initialValues.amount != null ? String(initialValues.amount) : '',
        startMonth: String(initialValues.startMonth ?? 1),
        dayOfMonth: String(initialValues.dayOfMonth ?? 1),
        paymentDelayMonths: String(initialValues.paymentDelayMonths ?? 0),
        endsAt: initialValues.endsAt || '',
        commitmentEndsAt: initialValues.commitmentEndsAt || '',
      }
    }
    return {
      name: '',
      amount: '',
      payer: payerOptions[0]?.value || 'common',
      frequency: 'monthly',
      startMonth: '1',
      dayOfMonth: '1',
      category: 'autre',
      paymentDelayMonths: '0',
      endsAt: '',
      commitmentEndsAt: '',
    }
  })
  const [submitting, setSubmitting] = useState(false)
  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const showStartMonth = form.frequency !== 'monthly'

  const handleSubmit = () => {
    if (submitting) return
    setSubmitting(true)
    onSubmit({ ...form, amount: parseFloat(form.amount) || 0, startMonth: parseInt(form.startMonth) || 1, dayOfMonth: parseInt(form.dayOfMonth) || 1, paymentDelayMonths: parseInt(form.paymentDelayMonths) || 0, endsAt: form.endsAt || undefined, commitmentEndsAt: form.commitmentEndsAt || undefined })
    setTimeout(() => setSubmitting(false), 200)
  }

  return (
    <div className="space-y-4">
      <Input label={t('charges.formName')} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder={t('charges.formNamePlaceholder')} />
      <Input label={t('charges.formAmount')} type="number" value={form.amount} onChange={(e) => update('amount', e.target.value)} placeholder="0" suffix="€" />
      <Select label={t('charges.formWhoPays')} value={form.payer} onChange={(e) => update('payer', e.target.value)} options={payerOptions} />
      <Select label={t('charges.formFrequency')} value={form.frequency} onChange={(e) => update('frequency', e.target.value)} options={frequencies} />
      {showStartMonth && (
        <Input
          label={t('charges.formStartMonth')}
          type="number"
          min="1"
          max="12"
          value={form.startMonth}
          onChange={(e) => update('startMonth', e.target.value)}
        />
      )}
      <Input label={t('charges.formDayOfMonth')} type="number" min="1" max="31" value={form.dayOfMonth} onChange={(e) => update('dayOfMonth', e.target.value)} />
      <Select label={t('charges.formCategory')} value={form.category} onChange={(e) => update('category', e.target.value)} options={categories} />
      <Input label={t('charges.formPaymentDelay')} type="number" min="0" value={form.paymentDelayMonths} onChange={(e) => update('paymentDelayMonths', e.target.value)} />
      <Input label={t('charges.formEndDate')} type="month" value={form.endsAt} onChange={(e) => update('endsAt', e.target.value)} />
      <Input label={t('charges.formCommitment')} type="month" value={form.commitmentEndsAt} onChange={(e) => update('commitmentEndsAt', e.target.value)} />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">{t('common.cancel')}</Button>
        <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.amount || submitting} className="flex-1">
          {initialValues ? t('common.edit') : t('common.add')}
        </Button>
      </div>
    </div>
  )
}

interface InstallmentFormProps {
  initialValues?: InstallmentPayment
  onSubmit: (data: Record<string, unknown>) => void
  onCancel: () => void
  household: Household | null
  t: TFunction
}

function InstallmentForm({ initialValues, onSubmit, onCancel, household, t }: InstallmentFormProps) {
  const payerOptions = PAYER_OPTIONS(household, t)
  const [form, setForm] = useState(() => {
    if (initialValues) {
      return {
        ...initialValues,
        totalAmount: initialValues.totalAmount != null ? String(initialValues.totalAmount) : '',
        installmentCount: String(initialValues.installmentCount ?? 3),
        installmentAmount: initialValues.installmentAmount != null ? String(initialValues.installmentAmount) : '',
      }
    }
    return {
      name: '',
      totalAmount: '',
      installmentCount: '3',
      installmentAmount: '',
      firstPaymentDate: '',
      payer: payerOptions[0]?.value || 'common',
    }
  })
  const [submitting, setSubmitting] = useState(false)

  const update = (field: string, value: string) => {
    const next = { ...form, [field]: value }
    if (field === 'totalAmount' || field === 'installmentCount') {
      const total = field === 'totalAmount' ? parseFloat(value) : parseFloat(form.totalAmount)
      const count = field === 'installmentCount' ? parseInt(value) : parseInt(form.installmentCount)
      if (total && count) next.installmentAmount = String(Math.round((total / count) * 100) / 100)
    }
    setForm(next)
  }

  const handleSubmit = () => {
    if (submitting) return
    setSubmitting(true)
    onSubmit({
      ...form,
      totalAmount: parseFloat(form.totalAmount) || 0,
      installmentAmount: parseFloat(form.installmentAmount) || 0,
      installmentCount: parseInt(form.installmentCount) || 2,
    })
    setTimeout(() => setSubmitting(false), 200)
  }

  return (
    <div className="space-y-4">
      <Input label={t('charges.formName')} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder={t('charges.installmentNamePlaceholder')} />
      <Input label={t('charges.formTotalAmount')} type="number" value={form.totalAmount} onChange={(e) => update('totalAmount', e.target.value)} suffix="€" />
      <Input label={t('charges.formInstallmentCount')} type="number" min="2" value={form.installmentCount} onChange={(e) => update('installmentCount', e.target.value)} />
      <Input label={t('charges.formInstallmentAmount')} type="number" value={form.installmentAmount} onChange={(e) => update('installmentAmount', e.target.value)} suffix="€" />
      <Input label={t('charges.formFirstPaymentDate')} type="date" value={form.firstPaymentDate} onChange={(e) => update('firstPaymentDate', e.target.value)} />
      <Select label={t('charges.formWhoPays')} value={form.payer} onChange={(e) => update('payer', e.target.value)} options={payerOptions} />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">{t('common.cancel')}</Button>
        <Button
          onClick={handleSubmit}
          disabled={!form.name.trim() || !form.totalAmount || !form.firstPaymentDate || submitting}
          className="flex-1"
        >
          {initialValues ? t('common.edit') : t('common.add')}
        </Button>
      </div>
    </div>
  )
}

interface PlannedExpenseFormProps {
  initialValues?: PlannedExpense
  onSubmit: (data: Record<string, unknown>) => void
  onCancel: () => void
  household: Household | null
  t: TFunction
}

function PlannedExpenseForm({ initialValues, onSubmit, onCancel, household, t }: PlannedExpenseFormProps) {
  const payerOptions = PAYER_OPTIONS(household, t)
  const [form, setForm] = useState(() => {
    if (initialValues) {
      return {
        ...initialValues,
        estimatedAmount: initialValues.estimatedAmount != null ? String(initialValues.estimatedAmount) : '',
      }
    }
    return {
      name: '',
      estimatedAmount: '',
      targetMonth: '',
      payer: payerOptions[0]?.value || 'common',
      note: '',
    }
  })
  const [submitting, setSubmitting] = useState(false)
  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = () => {
    if (submitting) return
    setSubmitting(true)
    onSubmit({ ...form, estimatedAmount: parseFloat(form.estimatedAmount) || 0 })
    setTimeout(() => setSubmitting(false), 200)
  }

  return (
    <div className="space-y-4">
      <Input label={t('charges.formName')} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder={t('charges.plannedNamePlaceholder')} />
      <Input label={t('charges.formEstimatedAmount')} type="number" value={form.estimatedAmount} onChange={(e) => update('estimatedAmount', e.target.value)} suffix="€" />
      <Input label={t('charges.formTargetMonth')} type="month" value={form.targetMonth} onChange={(e) => update('targetMonth', e.target.value)} />
      <Select label={t('charges.formWhoPays')} value={form.payer} onChange={(e) => update('payer', e.target.value)} options={payerOptions} />
      <Input label={t('charges.formNote')} value={form.note} onChange={(e) => update('note', e.target.value)} placeholder={t('charges.formNotePlaceholder')} />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">{t('common.cancel')}</Button>
        <Button
          onClick={handleSubmit}
          disabled={!form.name.trim() || !form.estimatedAmount || !form.targetMonth || submitting}
          className="flex-1"
        >
          {initialValues ? t('common.edit') : t('common.add')}
        </Button>
      </div>
    </div>
  )
}

export default function ChargesPage() {
  const { t } = useTranslation()
  const household = useHouseholdStore((s) => s.household)
  const getCategoryColor = useCategoriesStore((s) => s.getCategoryColor)
  const fixedCharges = useChargesStore((s) => s.fixedCharges)
  const installmentPayments = useChargesStore((s) => s.installmentPayments)
  const plannedExpenses = useChargesStore((s) => s.plannedExpenses)
  const addFixedCharge = useChargesStore((s) => s.addFixedCharge)
  const updateFixedCharge = useChargesStore((s) => s.updateFixedCharge)
  const removeFixedCharge = useChargesStore((s) => s.removeFixedCharge)
  const toggleFixedCharge = useChargesStore((s) => s.toggleFixedCharge)
  const addInstallment = useChargesStore((s) => s.addInstallment)
  const updateInstallment = useChargesStore((s) => s.updateInstallment)
  const removeInstallment = useChargesStore((s) => s.removeInstallment)
  const addPlannedExpense = useChargesStore((s) => s.addPlannedExpense)
  const updatePlannedExpense = useChargesStore((s) => s.updatePlannedExpense)
  const removePlannedExpense = useChargesStore((s) => s.removePlannedExpense)

  const currentMonth = new Date().toISOString().slice(0, 7)

  const [modal, setModal] = useState<ModalState | null>(null)
  const [tab, setTab] = useState<ChargeType>('fixed')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPayer, setFilterPayer] = useState<Payer | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterActive, setFilterActive] = useState<boolean | null>(null) // null = all, true = active, false = inactive
  const [sortBy, setSortBy] = useState<SortMode>('default')
  const [showArchived, setShowArchived] = useState(false)

  const SORT_MODES: SortMode[] = ['default', 'amount_desc', 'amount_asc', 'name', 'category']
  const cycleSortBy = () => {
    const idx = SORT_MODES.indexOf(sortBy)
    setSortBy(SORT_MODES[(idx + 1) % SORT_MODES.length])
  }
  const sortLabel: Record<SortMode, string> = { default: t('charges.sortDefault'), amount_desc: t('charges.sortAmountDesc'), amount_asc: t('charges.sortAmountAsc'), name: t('charges.sortName'), category: t('charges.sortCategory') }

  // Generic filter function for any charge list
  const filterItems = useCallback(<T extends ChargeItem>(items: T[], hasCategory = false, hasActive = false): T[] => {
    let result = items
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((c) => (c.name || '').toLowerCase().includes(q))
    }
    if (filterPayer) {
      result = result.filter((c) => c.payer === filterPayer)
    }
    if (filterCategory && hasCategory) {
      result = result.filter((c) => ('category' in c ? (c as FixedCharge).category || 'autre' : 'autre') === filterCategory)
    }
    if (filterActive !== null && hasActive) {
      result = result.filter((c) => 'active' in c && (c as FixedCharge).active === filterActive)
    }
    return result
  }, [searchQuery, filterPayer, filterCategory, filterActive])

  const getItemAmount = (item: ChargeItem): number => {
    if ('amount' in item) return (item as FixedCharge).amount
    if ('installmentAmount' in item) return (item as InstallmentPayment).installmentAmount
    if ('estimatedAmount' in item) return (item as PlannedExpense).estimatedAmount
    return 0
  }

  const sortItems = useCallback(<T extends ChargeItem>(items: T[]): T[] => {
    if (sortBy === 'default') return items
    const sorted = [...items]
    if (sortBy === 'amount_desc') sorted.sort((a, b) => getItemAmount(b) - getItemAmount(a))
    if (sortBy === 'amount_asc') sorted.sort((a, b) => getItemAmount(a) - getItemAmount(b))
    if (sortBy === 'name') sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    if (sortBy === 'category') sorted.sort((a, b) => ('category' in a ? (a as FixedCharge).category || 'autre' : 'autre').localeCompare('category' in b ? (b as FixedCharge).category || 'autre' : 'autre'))
    return sorted
  }, [sortBy])

  const filteredFixed = useMemo(() => sortItems(filterItems(fixedCharges, true, true)), [fixedCharges, filterItems, sortItems])
  const filteredInstallments = useMemo(() => sortItems(filterItems(installmentPayments)), [installmentPayments, filterItems, sortItems])
  const filteredPlanned = useMemo(() => sortItems(filterItems(plannedExpenses)), [plannedExpenses, filterItems, sortItems])

  // Split fixed charges into active and archived
  const activeFixed = useMemo(() =>
    filteredFixed.filter((c) => !c.endsAt || c.endsAt >= currentMonth),
    [filteredFixed, currentMonth]
  )
  const archivedFixed = useMemo(() =>
    filteredFixed.filter((c) => c.endsAt && c.endsAt < currentMonth),
    [filteredFixed, currentMonth]
  )

  const monthDiff = useCallback((a: string, b: string) => {
    const [yA, mA] = a.split('-').map(Number)
    const [yB, mB] = b.split('-').map(Number)
    return (yA - yB) * 12 + (mA - mB)
  }, [])

  const formatMonthLabel = useCallback((monthStr: string) => {
    if (!monthStr) return ''
    const [year, month] = monthStr.split('-')
    const monthNames = t('months.short', { returnObjects: true }) as string[]
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }, [t])

  const handleArchive = useCallback((id: string, name: string) => {
    updateFixedCharge(id, { endsAt: currentMonth })
    toast.success(t('charges.archiveToast', { name }))
  }, [updateFixedCharge, currentMonth, t])

  const handleRestore = useCallback((id: string, name: string) => {
    updateFixedCharge(id, { endsAt: undefined })
    toast.success(t('charges.restoredToast', { name }))
  }, [updateFixedCharge, t])

  const tabs: Array<{ id: ChargeType; label: string; count: number }> = [
    { id: 'fixed', label: t('charges.fixedTab'), count: filteredFixed.length },
    { id: 'installment', label: t('charges.installmentTab'), count: filteredInstallments.length },
    { id: 'planned', label: t('charges.plannedTab'), count: filteredPlanned.length },
  ]

  const totalMonthly = activeFixed
    .filter((c) => c.active)
    .reduce((sum: number, c: FixedCharge) => {
      if (c.frequency === 'monthly') return sum + c.amount
      if (c.frequency === 'bimonthly') return sum + c.amount / 2
      if (c.frequency === 'quarterly') return sum + c.amount / 3
      if (c.frequency === 'annual') return sum + c.amount / 12
      return sum + c.amount
    }, 0)

  // Unique categories from fixed charges for filter pills
  const availableCategories = useMemo(() => {
    const cats = new Set(fixedCharges.map((c) => c.category || 'autre'))
    return [...cats].sort()
  }, [fixedCharges])

  const hasFilters = searchQuery || filterPayer || filterCategory || filterActive !== null || sortBy !== 'default'

  const getPayerLabel = (payer: Payer) => {
    if (payer === 'person_a') return household?.personAName || 'A'
    if (payer === 'person_b') return household?.personBName || 'B'
    return t('payer.common')
  }

  const getPayerColor = (payer: Payer) => {
    if (payer === 'person_a') return household?.personAColor
    if (payer === 'person_b') return household?.personBColor
    return '#6C63FF'
  }

  const handleDelete = useCallback((type: ChargeType, id: string, name: string) => {
    const tableMap: Record<ChargeType, 'fixedCharges' | 'installmentPayments' | 'plannedExpenses'> = { fixed: 'fixedCharges', installment: 'installmentPayments', planned: 'plannedExpenses' }
    const supaTableMap: Record<ChargeType, string> = { fixed: 'fixed_charges', installment: 'installment_payments', planned: 'planned_expenses' }
    const storeKey = tableMap[type]
    const item = useChargesStore.getState()[storeKey].find((c: ChargeItem) => c.id === id)

    if (type === 'fixed') removeFixedCharge(id)
    else if (type === 'installment') removeInstallment(id)
    else removePlannedExpense(id)

    toast(t('charges.deleted', { name }), {
      action: item ? {
        label: t('common.cancel'),
        onClick: () => {
          useChargesStore.setState((state) => ({
            [storeKey]: [...state[storeKey], item],
          }))
          syncToSupabase(supaTableMap[type], item)
          toast.success(t('charges.restored', { name }))
        },
      } : undefined,
    })
  }, [removeFixedCharge, removeInstallment, removePlannedExpense, t])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo-crown-sm.webp" alt="Monest" className="w-7 h-7 lg:hidden" />
          <motion.h1
            className="text-2xl font-bold"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {t('charges.title')}
          </motion.h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/import" className="lg:hidden inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-card-bg border border-border-default text-text-secondary hover:text-brand transition-colors">
            <Upload size={13} /> {t('charges.import')}
          </Link>
          <Button size="sm" onClick={() => setModal({ type: tab })}>
            <Plus size={14} className="inline mr-1" /> {t('common.add')}
          </Button>
        </div>
      </div>

      {/* Monthly total summary */}
      {fixedCharges.length > 0 && (
        <Card className="glass !border-brand/10">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">
              {t('charges.totalMonthly')}
              {hasFilters && ` (${filteredFixed.filter((c) => c.active).length}/${fixedCharges.filter((c) => c.active).length})`}
            </span>
            <span className="text-lg font-bold text-brand tabular-nums">{formatCurrency(Math.round(totalMonthly))}</span>
          </div>
        </Card>
      )}

      {/* Search + Sort */}
      {(fixedCharges.length > 3 || installmentPayments.length > 3 || plannedExpenses.length > 3) && (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('charges.search')}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-base text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={cycleSortBy}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              sortBy !== 'default' ? 'bg-brand/15 text-brand border border-brand/30' : 'bg-white/[0.04] text-text-muted border border-white/[0.08] hover:text-white'
            }`}
            aria-label={t('charges.sort')}
          >
            <ArrowUpDown size={12} />
            <span className="hidden sm:inline">{sortLabel[sortBy]}</span>
          </button>
        </div>
      )}

      {/* Filter pills — payer + category + active/inactive */}
      {fixedCharges.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {/* Payer filters */}
          {(([
            { value: null, label: t('common.all') },
            { value: PAYER.Common, label: t('payer.common') },
            ...(household?.personAName ? [{ value: PAYER.PersonA, label: household.personAName }] : []),
            ...(household?.personBName ? [{ value: PAYER.PersonB, label: household.personBName }] : []),
          ] satisfies { value: Payer | null; label: string }[])).map((opt) => (
            <button
              key={opt.value || 'all'}
              onClick={() => setFilterPayer(opt.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                filterPayer === opt.value
                  ? 'bg-brand text-white shadow-lg shadow-brand/20'
                  : 'bg-white/[0.06] text-text-muted hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {/* Active/Inactive filter (fixed tab only) */}
          {tab === 'fixed' && fixedCharges.some((c) => !c.active) && (
            <>
              <div className="w-px bg-white/[0.08] flex-shrink-0 my-1" />
              {([
                { value: true as boolean, label: t('charges.activate') },
                { value: false as boolean, label: t('charges.deactivate') },
              ]).map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setFilterActive(filterActive === opt.value ? null : opt.value)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    filterActive === opt.value
                      ? opt.value ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                      : 'bg-white/[0.06] text-text-muted hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </>
          )}
          {/* Category filters (fixed tab only) */}
          {tab === 'fixed' && availableCategories.length > 1 && (
            <>
              <div className="w-px bg-white/[0.08] flex-shrink-0 my-1" />
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    filterCategory === cat
                      ? 'text-white shadow-lg'
                      : 'bg-white/[0.06] text-text-muted hover:text-white'
                  }`}
                  style={filterCategory === cat ? { backgroundColor: getCategoryColor(cat) } : undefined}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-surface/60 rounded-xl p-1">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              tab === tabItem.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-text-muted hover:text-white'
            }`}
          >
            {tabItem.label} ({tabItem.count})
          </button>
        ))}
      </div>

      <p className="text-[10px] text-text-muted text-center lg:hidden">{t('charges.swipeHint')}</p>

      {/* Fixed charges */}
      <AnimatePresence mode="wait">
        {tab === 'fixed' && (
          <motion.div key="fixed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {activeFixed.length === 0 && archivedFixed.length === 0 && (
              <Card><p className="text-center text-text-muted py-6 text-sm">{hasFilters ? t('charges.noResults') : t('charges.noFixed')}</p></Card>
            )}
            {activeFixed.map((charge) => (
              <SwipeableCard
                key={charge.id}
                actions={[
                  {
                    icon: Edit3,
                    color: '#6C63FF',
                    label: t('common.edit'),
                    onClick: () => setModal({ type: 'fixed', editId: charge.id }),
                  },
                  {
                    icon: Archive,
                    color: '#F59E0B',
                    label: t('charges.archive'),
                    onClick: () => handleArchive(charge.id, charge.name),
                  },
                  {
                    icon: Trash2,
                    color: '#F87171',
                    label: t('common.delete'),
                    onClick: () => handleDelete('fixed', charge.id, charge.name),
                  },
                ]}
              >
                <Card className={`${!charge.active ? 'opacity-40' : ''}`} animate={false}>
                  <div className="flex items-center gap-3">
                    <div
                      role="button"
                      tabIndex={0}
                      className="flex-1 min-w-0 lg:cursor-pointer"
                      onClick={() => setModal({ type: 'fixed', editId: charge.id })}
                      onKeyDown={(e) => { if (e.key === 'Enter') setModal({ type: 'fixed', editId: charge.id }) }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{charge.name}</span>
                        {charge.category && charge.category !== 'autre' && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: `${getCategoryColor(charge.category)}20`, color: getCategoryColor(charge.category) }}
                          >
                            {getCategoryLabel(charge.category)}
                          </span>
                        )}
                        {charge.endsAt && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            charge.endsAt === currentMonth
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-white/[0.08] text-text-muted'
                          }`}>
                            {charge.endsAt === currentMonth
                              ? t('charges.endsThisMonth')
                              : t('charges.endsAt', { date: formatMonthLabel(charge.endsAt) })}
                          </span>
                        )}
                        {charge.commitmentEndsAt && (() => {
                          const remaining = monthDiff(charge.commitmentEndsAt, currentMonth)
                          if (remaining <= 0) return (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 bg-emerald-500/20 text-emerald-400">
                              {t('charges.commitmentEnded')}
                            </span>
                          )
                          if (remaining <= 3) return (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 bg-amber-500/20 text-amber-400">
                              {remaining === 1
                                ? t('charges.commitmentEndsSoon_1')
                                : t('charges.commitmentEndsSoon', { count: remaining })}
                            </span>
                          )
                          return (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 bg-white/[0.06] text-text-muted">
                              {t('charges.commitmentEnds', { date: formatMonthLabel(charge.commitmentEndsAt) })}
                            </span>
                          )
                        })()}
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        {formatCurrency(charge.amount)} · {getPayerLabel(charge.payer)} · {getFrequencyLabel(charge.frequency)}
                      </div>
                    </div>
                    {/* Mobile: toggle visible on card */}
                    <button
                      onClick={() => toggleFixedCharge(charge.id)}
                      className="lg:hidden p-1.5 text-text-muted"
                      aria-label={charge.active ? t('charges.deactivate') : t('charges.activate')}
                    >
                      {charge.active ? <ToggleRight size={24} className="text-success" /> : <ToggleLeft size={24} />}
                    </button>
                    {/* Desktop: toggle + archive + edit + delete inline */}
                    <div className="hidden lg:flex items-center gap-2">
                      <button
                        onClick={() => toggleFixedCharge(charge.id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-white transition-colors"
                        aria-label={charge.active ? t('charges.deactivate') : t('charges.activate')}
                      >
                        {charge.active ? <ToggleRight size={28} className="text-success" /> : <ToggleLeft size={28} />}
                      </button>
                      <button
                        onClick={() => handleArchive(charge.id, charge.name)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-amber-400 transition-colors"
                        aria-label={t('charges.archive')}
                      >
                        <Archive size={14} />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'fixed', editId: charge.id })}
                        className="p-1.5 rounded-lg text-text-muted hover:text-brand transition-colors"
                        aria-label={t('common.edit')}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete('fixed', charge.id, charge.name)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-danger transition-colors"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              </SwipeableCard>
            ))}

            {/* Archived charges section */}
            {archivedFixed.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-text-muted hover:text-white bg-white/[0.03] border border-white/[0.06] transition-all cursor-pointer"
                >
                  <Archive size={13} className="text-amber-400/60" />
                  <span>{t('charges.archived', { count: archivedFixed.length })}</span>
                  <ChevronDown size={13} className={`ml-auto transition-transform ${showArchived ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showArchived && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 pt-2 overflow-hidden"
                    >
                      {archivedFixed.map((charge) => (
                        <SwipeableCard
                          key={charge.id}
                          actions={[
                            {
                              icon: ArchiveRestore,
                              color: '#4ADE80',
                              label: t('charges.unarchive'),
                              onClick: () => handleRestore(charge.id, charge.name),
                            },
                            {
                              icon: Trash2,
                              color: '#F87171',
                              label: t('common.delete'),
                              onClick: () => handleDelete('fixed', charge.id, charge.name),
                            },
                          ]}
                        >
                          <Card className="opacity-50" animate={false}>
                            <div className="flex items-center gap-3">
                              <div
                                role="button"
                                tabIndex={0}
                                className="flex-1 min-w-0 lg:cursor-pointer"
                                onClick={() => setModal({ type: 'fixed', editId: charge.id })}
                                onKeyDown={(e) => { if (e.key === 'Enter') setModal({ type: 'fixed', editId: charge.id }) }}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm truncate">{charge.name}</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 bg-amber-500/15 text-amber-400/70">
                                    {t('charges.endsAt', { date: formatMonthLabel(charge.endsAt ?? '') })}
                                  </span>
                                </div>
                                <div className="text-xs text-text-muted mt-1">
                                  {formatCurrency(charge.amount)} · {getPayerLabel(charge.payer)} · {getFrequencyLabel(charge.frequency)}
                                </div>
                              </div>
                              {/* Desktop: restore + delete inline */}
                              <div className="hidden lg:flex items-center gap-2">
                                <button
                                  onClick={() => handleRestore(charge.id, charge.name)}
                                  className="p-1.5 rounded-lg text-text-muted hover:text-success transition-colors"
                                  aria-label={t('charges.unarchive')}
                                >
                                  <ArchiveRestore size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete('fixed', charge.id, charge.name)}
                                  className="p-1.5 rounded-lg text-text-muted hover:text-danger transition-colors"
                                  aria-label={t('common.delete')}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </Card>
                        </SwipeableCard>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'installment' && (
          <motion.div key="installment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {filteredInstallments.length === 0 && (
              <Card><p className="text-center text-text-muted py-6 text-sm">{hasFilters ? t('charges.noResults') : t('charges.noInstallment')}</p></Card>
            )}
            {filteredInstallments.map((payment) => (
              <SwipeableCard
                key={payment.id}
                actions={[
                  {
                    icon: Edit3,
                    color: '#6C63FF',
                    label: t('common.edit'),
                    onClick: () => setModal({ type: 'installment', editId: payment.id }),
                  },
                  {
                    icon: Trash2,
                    color: '#F87171',
                    label: t('common.delete'),
                    onClick: () => handleDelete('installment', payment.id, payment.name),
                  },
                ]}
              >
                <Card animate={false}>
                  <div className="flex items-center gap-3">
                    <div
                      role="button"
                      tabIndex={0}
                      className="flex-1 min-w-0 lg:cursor-pointer"
                      onClick={() => setModal({ type: 'installment', editId: payment.id })}
                      onKeyDown={(e) => { if (e.key === 'Enter') setModal({ type: 'installment', editId: payment.id }) }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getPayerColor(payment.payer) }} />
                        <span className="font-medium text-sm truncate">{payment.name}</span>
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        {t('charges.installmentSummary', { total: formatCurrency(payment.totalAmount ?? payment.installmentAmount * payment.installmentCount), count: payment.installmentCount, monthly: formatCurrency(payment.installmentAmount) })}
                      </div>
                    </div>
                    {/* Desktop: edit + delete inline */}
                    <div className="hidden lg:flex items-center gap-1">
                      <button
                        onClick={() => setModal({ type: 'installment', editId: payment.id })}
                        className="p-1.5 rounded-lg text-text-muted hover:text-brand transition-colors"
                        aria-label={t('common.edit')}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete('installment', payment.id, payment.name)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-danger transition-colors"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              </SwipeableCard>
            ))}
          </motion.div>
        )}

        {tab === 'planned' && (
          <motion.div key="planned" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {filteredPlanned.length === 0 && (
              <Card><p className="text-center text-text-muted py-6 text-sm">{hasFilters ? t('charges.noResults') : t('charges.noPlanned')}</p></Card>
            )}
            {filteredPlanned.map((expense) => (
              <SwipeableCard
                key={expense.id}
                actions={[
                  {
                    icon: Edit3,
                    color: '#6C63FF',
                    label: t('common.edit'),
                    onClick: () => setModal({ type: 'planned', editId: expense.id }),
                  },
                  {
                    icon: Trash2,
                    color: '#F87171',
                    label: t('common.delete'),
                    onClick: () => handleDelete('planned', expense.id, expense.name),
                  },
                ]}
              >
                <Card animate={false}>
                  <div className="flex items-center gap-3">
                    <div
                      role="button"
                      tabIndex={0}
                      className="flex-1 min-w-0 lg:cursor-pointer"
                      onClick={() => setModal({ type: 'planned', editId: expense.id })}
                      onKeyDown={(e) => { if (e.key === 'Enter') setModal({ type: 'planned', editId: expense.id }) }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getPayerColor(expense.payer) }} />
                        <span className="font-medium text-sm truncate">{expense.name}</span>
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        ~{formatCurrency(expense.estimatedAmount)} · {expense.targetMonth}
                      </div>
                      {expense.note && <div className="text-[10px] text-text-muted mt-0.5">{expense.note}</div>}
                    </div>
                    {/* Desktop: edit + delete inline */}
                    <div className="hidden lg:flex items-center gap-1">
                      <button
                        onClick={() => setModal({ type: 'planned', editId: expense.id })}
                        className="p-1.5 rounded-lg text-text-muted hover:text-brand transition-colors"
                        aria-label={t('common.edit')}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete('planned', expense.id, expense.name)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-danger transition-colors"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              </SwipeableCard>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Modal isOpen={modal?.type === 'fixed'} onClose={() => setModal(null)} title={modal?.editId ? t('charges.editFixedTitle') : t('charges.newFixedTitle')}>
        <ChargeForm
          initialValues={modal?.editId ? fixedCharges.find((c) => c.id === modal.editId) : undefined}
          onSubmit={(data) => {
            if (!data.amount || Number(data.amount) <= 0) {
              toast.error('Le montant doit être supérieur à 0')
              return
            }
            if (modal?.editId) updateFixedCharge(modal.editId, data as Partial<FixedCharge>)
            else { addFixedCharge(data as Omit<FixedCharge, 'id' | 'active' | 'createdAt' | 'updatedAt'>); toast.success(t('charges.added', { name: data.name })) }
            setModal(null)
          }}
          onCancel={() => setModal(null)}
          household={household}
          t={t}
        />
      </Modal>

      <Modal isOpen={modal?.type === 'installment'} onClose={() => setModal(null)} title={modal?.editId ? t('charges.editInstallmentTitle') : t('charges.newInstallmentTitle')}>
        <InstallmentForm
          initialValues={modal?.editId ? installmentPayments.find((p) => p.id === modal.editId) : undefined}
          onSubmit={(data) => {
            if (!data.totalAmount || Number(data.totalAmount) <= 0) {
              toast.error('Le montant doit être supérieur à 0')
              return
            }
            if (modal?.editId) updateInstallment(modal.editId, data as Partial<InstallmentPayment>)
            else { addInstallment(data as Omit<InstallmentPayment, 'id' | 'createdAt' | 'updatedAt'>); toast.success(t('charges.installmentAdded', { name: data.name })) }
            setModal(null)
          }}
          onCancel={() => setModal(null)}
          household={household}
          t={t}
        />
      </Modal>

      <Modal isOpen={modal?.type === 'planned'} onClose={() => setModal(null)} title={modal?.editId ? t('charges.editPlannedTitle') : t('charges.newPlannedTitle')}>
        <PlannedExpenseForm
          initialValues={modal?.editId ? plannedExpenses.find((e) => e.id === modal.editId) : undefined}
          onSubmit={(data) => {
            if (!data.estimatedAmount || Number(data.estimatedAmount) <= 0) {
              toast.error('Le montant doit être supérieur à 0')
              return
            }
            if (modal?.editId) updatePlannedExpense(modal.editId, data as Partial<PlannedExpense>)
            else { addPlannedExpense(data as Omit<PlannedExpense, 'id' | 'createdAt' | 'updatedAt'>); toast.success(t('charges.added', { name: data.name })) }
            setModal(null)
          }}
          onCancel={() => setModal(null)}
          household={household}
          t={t}
        />
      </Modal>
    </div>
  )
}

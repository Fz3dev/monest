import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { formatCurrency, PAYER_OPTIONS, getTranslatedCategories, getTranslatedFrequencies, getCategoryLabel, getFrequencyLabel } from '../utils/format'
import { syncToSupabase } from '../lib/syncBridge'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import { Plus, Trash2, ToggleLeft, ToggleRight, Edit3 } from 'lucide-react'
import { toast } from 'sonner'

function SwipeableCard({ actions = [], children }) {
  const x = useMotionValue(0)
  const totalWidth = actions.length * 70

  const handleDragEnd = (_, info) => {
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

function ChargeForm({ initialValues, onSubmit, onCancel, household, t }) {
  const payerOptions = PAYER_OPTIONS(household, t)
  const categories = getTranslatedCategories(t)
  const frequencies = getTranslatedFrequencies(t)
  const [form, setForm] = useState(
    initialValues || {
      name: '',
      amount: '',
      payer: payerOptions[0]?.value || 'common',
      frequency: 'monthly',
      startMonth: 1,
      dayOfMonth: 1,
      category: 'autre',
      paymentDelayMonths: 0,
    }
  )
  const [submitting, setSubmitting] = useState(false)
  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const showStartMonth = form.frequency !== 'monthly'

  const handleSubmit = () => {
    if (submitting) return
    setSubmitting(true)
    onSubmit({ ...form, amount: parseFloat(form.amount) || 0 })
    setTimeout(() => setSubmitting(false), 200)
  }

  return (
    <div className="space-y-4">
      <Input label={t('charges.formName')} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder={t('charges.formNamePlaceholder')} />
      <Input label={t('charges.formAmount')} type="number" value={form.amount} onChange={(e) => update('amount', e.target.value)} placeholder="0" suffix="\u20ac" />
      <Select label={t('charges.formWhoPays')} value={form.payer} onChange={(e) => update('payer', e.target.value)} options={payerOptions} />
      <Select label={t('charges.formFrequency')} value={form.frequency} onChange={(e) => update('frequency', e.target.value)} options={frequencies} />
      {showStartMonth && (
        <Input
          label={t('charges.formStartMonth')}
          type="number"
          min="1"
          max="12"
          value={form.startMonth}
          onChange={(e) => update('startMonth', parseInt(e.target.value) || 1)}
        />
      )}
      <Input label={t('charges.formDayOfMonth')} type="number" min="1" max="31" value={form.dayOfMonth} onChange={(e) => update('dayOfMonth', parseInt(e.target.value) || 1)} />
      <Select label={t('charges.formCategory')} value={form.category} onChange={(e) => update('category', e.target.value)} options={categories} />
      <Input label={t('charges.formPaymentDelay')} type="number" min="0" value={form.paymentDelayMonths} onChange={(e) => update('paymentDelayMonths', parseInt(e.target.value) || 0)} />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">{t('common.cancel')}</Button>
        <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.amount || submitting} className="flex-1">
          {initialValues ? t('common.edit') : t('common.add')}
        </Button>
      </div>
    </div>
  )
}

function InstallmentForm({ initialValues, onSubmit, onCancel, household, t }) {
  const payerOptions = PAYER_OPTIONS(household, t)
  const [form, setForm] = useState(
    initialValues || {
      name: '',
      totalAmount: '',
      installmentCount: 3,
      installmentAmount: '',
      firstPaymentDate: '',
      payer: payerOptions[0]?.value || 'common',
    }
  )
  const [submitting, setSubmitting] = useState(false)

  const update = (field, value) => {
    const next = { ...form, [field]: value }
    if (field === 'totalAmount' || field === 'installmentCount') {
      const total = field === 'totalAmount' ? parseFloat(value) : parseFloat(form.totalAmount)
      const count = field === 'installmentCount' ? parseInt(value) : form.installmentCount
      if (total && count) next.installmentAmount = Math.round((total / count) * 100) / 100
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
      <Input label={t('charges.formTotalAmount')} type="number" value={form.totalAmount} onChange={(e) => update('totalAmount', e.target.value)} suffix="\u20ac" />
      <Input label={t('charges.formInstallmentCount')} type="number" min="2" value={form.installmentCount} onChange={(e) => update('installmentCount', parseInt(e.target.value) || 2)} />
      <Input label={t('charges.formInstallmentAmount')} type="number" value={form.installmentAmount} onChange={(e) => update('installmentAmount', e.target.value)} suffix="\u20ac" />
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

function PlannedExpenseForm({ initialValues, onSubmit, onCancel, household, t }) {
  const payerOptions = PAYER_OPTIONS(household, t)
  const [form, setForm] = useState(
    initialValues || {
      name: '',
      estimatedAmount: '',
      targetMonth: '',
      payer: payerOptions[0]?.value || 'common',
      note: '',
    }
  )
  const [submitting, setSubmitting] = useState(false)
  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = () => {
    if (submitting) return
    setSubmitting(true)
    onSubmit({ ...form, estimatedAmount: parseFloat(form.estimatedAmount) || 0 })
    setTimeout(() => setSubmitting(false), 200)
  }

  return (
    <div className="space-y-4">
      <Input label={t('charges.formName')} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder={t('charges.plannedNamePlaceholder')} />
      <Input label={t('charges.formEstimatedAmount')} type="number" value={form.estimatedAmount} onChange={(e) => update('estimatedAmount', e.target.value)} suffix="\u20ac" />
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
  const {
    fixedCharges, installmentPayments, plannedExpenses,
    addFixedCharge, updateFixedCharge, removeFixedCharge, toggleFixedCharge,
    addInstallment, updateInstallment, removeInstallment,
    addPlannedExpense, updatePlannedExpense, removePlannedExpense,
  } = useChargesStore()

  const [modal, setModal] = useState(null)
  const [tab, setTab] = useState('fixed')

  const tabs = [
    { id: 'fixed', label: t('charges.fixedTab'), count: fixedCharges.length },
    { id: 'installment', label: t('charges.installmentTab'), count: installmentPayments.length },
    { id: 'planned', label: t('charges.plannedTab'), count: plannedExpenses.length },
  ]

  const totalMonthly = fixedCharges
    .filter((c) => c.active)
    .reduce((sum, c) => {
      if (c.frequency === 'monthly') return sum + c.amount
      if (c.frequency === 'bimonthly') return sum + c.amount / 2
      if (c.frequency === 'quarterly') return sum + c.amount / 3
      if (c.frequency === 'annual') return sum + c.amount / 12
      return sum + c.amount
    }, 0)

  const getPayerLabel = (payer) => {
    if (payer === 'person_a') return household?.personAName || 'A'
    if (payer === 'person_b') return household?.personBName || 'B'
    return t('payer.common')
  }

  const getPayerColor = (payer) => {
    if (payer === 'person_a') return household?.personAColor
    if (payer === 'person_b') return household?.personBColor
    return '#6C63FF'
  }

  const handleDelete = useCallback((type, id, name) => {
    const tableMap = { fixed: 'fixedCharges', installment: 'installmentPayments', planned: 'plannedExpenses' }
    const supaTableMap = { fixed: 'fixed_charges', installment: 'installment_payments', planned: 'planned_expenses' }
    const storeKey = tableMap[type]
    const item = useChargesStore.getState()[storeKey].find((c) => c.id === id)

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
        <motion.h1
          className="text-2xl font-bold"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {t('charges.title')}
        </motion.h1>
        <Button size="sm" onClick={() => setModal({ type: tab })}>
          <Plus size={14} className="inline mr-1" /> {t('common.add')}
        </Button>
      </div>

      {/* Monthly total summary */}
      {fixedCharges.length > 0 && (
        <Card className="glass !border-brand/10">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">{t('charges.totalMonthly')}</span>
            <span className="text-lg font-bold text-brand tabular-nums">{formatCurrency(Math.round(totalMonthly))}</span>
          </div>
        </Card>
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
            {fixedCharges.length === 0 && (
              <Card><p className="text-center text-text-muted py-6 text-sm">{t('charges.noFixed')}</p></Card>
            )}
            {fixedCharges.map((charge) => (
              <SwipeableCard
                key={charge.id}
                actions={[
                  {
                    icon: charge.active ? ToggleRight : ToggleLeft,
                    color: charge.active ? '#4ADE80' : '#48484A',
                    label: charge.active ? t('charges.deactivate') : t('charges.activate'),
                    onClick: () => toggleFixedCharge(charge.id),
                  },
                  {
                    icon: Edit3,
                    color: '#6C63FF',
                    label: t('common.edit'),
                    onClick: () => setModal({ type: 'fixed', editId: charge.id }),
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
                      className="flex-1 min-w-0 lg:cursor-pointer"
                      onClick={() => setModal({ type: 'fixed', editId: charge.id })}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getPayerColor(charge.payer) }} />
                        <span className="font-medium text-sm truncate">{charge.name}</span>
                        {charge.category && charge.category !== 'autre' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-text-muted flex-shrink-0">
                            {getCategoryLabel(charge.category)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        {formatCurrency(charge.amount)} · {getPayerLabel(charge.payer)} · {getFrequencyLabel(charge.frequency)}
                      </div>
                    </div>
                    {/* Desktop: toggle + edit + delete inline */}
                    <div className="hidden lg:flex items-center gap-2">
                      <button
                        onClick={() => toggleFixedCharge(charge.id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-white transition-colors"
                        aria-label={charge.active ? t('charges.deactivate') : t('charges.activate')}
                      >
                        {charge.active ? <ToggleRight size={28} className="text-success" /> : <ToggleLeft size={28} />}
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
          </motion.div>
        )}

        {tab === 'installment' && (
          <motion.div key="installment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {installmentPayments.length === 0 && (
              <Card><p className="text-center text-text-muted py-6 text-sm">{t('charges.noInstallment')}</p></Card>
            )}
            {installmentPayments.map((payment) => (
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
                      className="flex-1 min-w-0 lg:cursor-pointer"
                      onClick={() => setModal({ type: 'installment', editId: payment.id })}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getPayerColor(payment.payer) }} />
                        <span className="font-medium text-sm truncate">{payment.name}</span>
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        {t('charges.installmentSummary', { total: formatCurrency(payment.totalAmount), count: payment.installmentCount, monthly: formatCurrency(payment.installmentAmount) })}
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
            {plannedExpenses.length === 0 && (
              <Card><p className="text-center text-text-muted py-6 text-sm">{t('charges.noPlanned')}</p></Card>
            )}
            {plannedExpenses.map((expense) => (
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
                      className="flex-1 min-w-0 lg:cursor-pointer"
                      onClick={() => setModal({ type: 'planned', editId: expense.id })}
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
            if (modal?.editId) updateFixedCharge(modal.editId, data)
            else { addFixedCharge(data); toast.success(t('charges.added', { name: data.name })) }
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
            if (modal?.editId) updateInstallment(modal.editId, data)
            else { addInstallment(data); toast.success(t('charges.installmentAdded', { name: data.name })) }
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
            if (modal?.editId) updatePlannedExpense(modal.editId, data)
            else { addPlannedExpense(data); toast.success(t('charges.added', { name: data.name })) }
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

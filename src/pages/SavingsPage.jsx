import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react'
import { useSavingsStore } from '../stores/savingsStore'
import { formatCurrency } from '../utils/format'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import ProgressBar from '../components/ui/ProgressBar'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import { Plus, Trash2, Edit3, Target, Sparkles, Calendar, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

// --- Constants ---

const EMOJIS = ['\u{1F3E0}', '\u{1F697}', '\u2708\uFE0F', '\u{1F393}', '\u{1F48D}', '\u{1F381}', '\u{1F6E1}\uFE0F', '\u{1F4B0}', '\u{1F4F1}', '\u{1F3D6}\uFE0F', '\u{1F476}', '\u{1F3CB}\uFE0F']

const GOAL_COLORS = [
  '#6C63FF',
  '#818CF8',
  '#4ADE80',
  '#FBBF24',
  '#F87171',
  '#38BDF8',
]

const QUICK_AMOUNTS = [50, 100, 200, 500]

// --- Circular Progress Ring ---

function CircularProgress({ percentage, size = 160, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    const target = circumference - (Math.min(percentage, 100) / 100) * circumference
    const timeout = setTimeout(() => setOffset(target), 100)
    return () => clearTimeout(timeout)
  }, [percentage, circumference])

  const gradientId = 'progress-gradient'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6C63FF" />
            <stop offset="50%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`url(#${gradientId})`} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} filter="url(#glow)" style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber value={Math.round(percentage)} format={(v) => `${Math.round(v)}%`} className="text-3xl font-bold bg-gradient-to-r from-brand to-success bg-clip-text text-transparent" />
        <span className="text-[10px] text-text-muted mt-0.5">{/* t provided via parent */}</span>
      </div>
    </div>
  )
}

// --- Swipe To Delete ---

function SwipeToDelete({ onDelete, children }) {
  const x = useMotionValue(0)
  const bgOpacity = useTransform(x, [-120, -60, 0], [1, 0.5, 0])

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -100) {
      animate(x, -300, { duration: 0.2 })
      setTimeout(onDelete, 200)
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 })
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <motion.div className="absolute inset-0 bg-danger/20 flex items-center justify-end pr-6" style={{ opacity: bgOpacity }}>
        <Trash2 size={18} className="text-danger" />
      </motion.div>
      <motion.div style={{ x }} drag="x" dragConstraints={{ left: -120, right: 0 }} dragElastic={0.1} onDragEnd={handleDragEnd}>
        {children}
      </motion.div>
    </div>
  )
}

// --- Emoji Selector ---

function EmojiSelector({ value, onChange, t }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('savings.icon')}</label>
      <div className="grid grid-cols-6 gap-2">
        {EMOJIS.map((emoji) => (
          <motion.button
            key={emoji}
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(emoji)}
            className={`text-xl h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
              value === emoji
                ? 'bg-brand/20 border-2 border-brand ring-2 ring-brand/20'
                : 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]'
            }`}
          >
            {emoji}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// --- Color Picker ---

function ColorPicker({ value, onChange, t }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('savings.color')}</label>
      <div className="flex gap-2.5">
        {GOAL_COLORS.map((color) => (
          <motion.button
            key={color}
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={() => onChange(color)}
            className={`w-9 h-9 rounded-full cursor-pointer transition-all ${
              value === color ? 'ring-2 ring-offset-2 ring-offset-bg-primary' : 'hover:scale-110'
            }`}
            style={{ backgroundColor: color, ringColor: value === color ? color : undefined }}
          />
        ))}
      </div>
    </div>
  )
}

// --- Goal Form ---

function GoalForm({ initialValues, onSubmit, onCancel, t }) {
  const [form, setForm] = useState(
    initialValues
      ? { name: initialValues.name, targetAmount: String(initialValues.targetAmount), icon: initialValues.icon, color: initialValues.color, deadline: initialValues.deadline || '' }
      : { name: '', targetAmount: '', icon: '\u{1F4B0}', color: GOAL_COLORS[0], deadline: '' }
  )
  const [submitting, setSubmitting] = useState(false)
  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = () => {
    if (submitting) return
    setSubmitting(true)
    onSubmit({ name: form.name, targetAmount: parseFloat(form.targetAmount) || 0, icon: form.icon, color: form.color, deadline: form.deadline || null })
    setTimeout(() => setSubmitting(false), 200)
  }

  return (
    <div className="space-y-4">
      <Input label={t('savings.goalName')} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder={t('savings.goalNamePlaceholder')} />
      <Input label={t('savings.targetAmount')} type="number" value={form.targetAmount} onChange={(e) => update('targetAmount', e.target.value)} placeholder="0" suffix="\u20ac" />
      <EmojiSelector value={form.icon} onChange={(v) => update('icon', v)} t={t} />
      <ColorPicker value={form.color} onChange={(v) => update('color', v)} t={t} />
      <Input label={t('savings.deadline')} type="month" value={form.deadline} onChange={(e) => update('deadline', e.target.value)} />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">{t('common.cancel')}</Button>
        <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.targetAmount || submitting} className="flex-1">
          {initialValues ? t('common.edit') : t('savings.create')}
        </Button>
      </div>
    </div>
  )
}

// --- Contribute Form ---

function ContributeForm({ goal, onSubmit, onCancel, t }) {
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const remaining = goal.targetAmount - goal.currentAmount

  const handleSubmit = () => {
    if (submitting) return
    setSubmitting(true)
    onSubmit(parseFloat(amount) || 0)
    setTimeout(() => setSubmitting(false), 200)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        <span className="text-2xl">{goal.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{goal.name}</p>
          <p className="text-xs text-text-muted">
            {t('savings.remaining')}{' '}
            <span className="text-text-secondary">{formatCurrency(Math.max(remaining, 0))}</span>
          </p>
        </div>
      </div>
      <Input label={t('savings.amountToAdd')} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" suffix="\u20ac" />
      <div className="grid grid-cols-4 gap-2">
        {QUICK_AMOUNTS.map((qa) => (
          <motion.button
            key={qa}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => setAmount(String(qa))}
            className={`py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
              amount === String(qa)
                ? 'bg-brand/20 text-brand-light border border-brand/30'
                : 'bg-white/[0.04] text-text-secondary border border-white/[0.06] hover:bg-white/[0.08]'
            }`}
          >
            {qa} €
          </motion.button>
        ))}
      </div>
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setAmount(String(remaining))}
          className="w-full text-xs text-brand-light hover:text-white transition-colors cursor-pointer py-1"
        >
          {t('savings.fillRemaining', { amount: formatCurrency(remaining) })}
        </button>
      )}
      <div className="flex gap-3 pt-1">
        <Button variant="secondary" onClick={onCancel} className="flex-1">{t('common.cancel')}</Button>
        <Button onClick={handleSubmit} disabled={!amount || parseFloat(amount) <= 0 || submitting} className="flex-1">{t('savings.contribute')}</Button>
      </div>
    </div>
  )
}

// --- Goal Card ---

function GoalCard({ goal, index, onEdit, onContribute, onDelete, t }) {
  const percentage = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0
  const isComplete = percentage >= 100

  const deadlineLabel = goal.deadline
    ? (() => {
        const [year, month] = goal.deadline.split('-')
        const months = ['Jan', 'F\u00e9v', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Ao\u00fb', 'Sep', 'Oct', 'Nov', 'D\u00e9c']
        return `${months[parseInt(month, 10) - 1]} ${year}`
      })()
    : null

  return (
    <SwipeToDelete onDelete={onDelete}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06, duration: 0.3 }}>
        <Card animate={false} className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] opacity-60" style={{ background: `linear-gradient(90deg, ${goal.color}, ${goal.color}00)` }} />
          {isComplete && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3">
              <div className="bg-success/15 text-success text-[10px] font-semibold px-2 py-0.5 rounded-full border border-success/20 flex items-center gap-1">
                <Sparkles size={10} />
                {t('savings.reached')}
              </div>
            </motion.div>
          )}
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: `${goal.color}18` }}>{goal.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm truncate pr-2">{goal.name}</h3>
                {!isComplete && <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: goal.color }}>{Math.round(percentage)}%</span>}
              </div>
              <ProgressBar value={goal.currentAmount} max={goal.targetAmount} color={goal.color} />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-text-secondary tabular-nums">
                  <AnimatedNumber value={goal.currentAmount} format={formatCurrency} className="text-text-primary font-medium" />
                  {' '}/ {formatCurrency(goal.targetAmount)}
                </span>
                {deadlineLabel && (
                  <span className="text-[10px] text-text-muted flex items-center gap-1"><Calendar size={10} />{deadlineLabel}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" onClick={onContribute} disabled={isComplete} className="flex-1 !text-[11px] !min-h-[32px] !py-1.5">
                  <TrendingUp size={12} className="inline mr-1" />
                  {t('savings.contribute')}
                </Button>
                <button onClick={onEdit} className="p-2 text-text-muted hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer" aria-label={t('common.edit')}>
                  <Edit3 size={13} />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </SwipeToDelete>
  )
}

// --- Empty State ---

function EmptyState({ onAdd, t }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-col items-center py-16 px-6">
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand/20 to-brand-light/10 border border-brand/20 flex items-center justify-center mb-5">
        <Target size={32} className="text-brand-light" />
      </motion.div>
      <h3 className="text-base font-semibold mb-2">{t('savings.noGoals')}</h3>
      <p className="text-text-muted text-sm text-center max-w-[260px] mb-6 leading-relaxed">{t('savings.noGoalsDescription')}</p>
      <Button onClick={onAdd} size="md">
        <Plus size={16} className="inline mr-1.5" />
        {t('savings.createGoal')}
      </Button>
    </motion.div>
  )
}

// --- Main Page ---

export default function SavingsPage() {
  const { t } = useTranslation()
  const { goals, addGoal, updateGoal, removeGoal, contribute, getTotalSaved, getTotalTarget } = useSavingsStore()

  const [modal, setModal] = useState(null)

  const totalSaved = getTotalSaved()
  const totalTarget = getTotalTarget()
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  const handleAddGoal = useCallback((data) => {
    addGoal(data)
    toast.success(t('savings.goalCreated', { name: data.name }))
    setModal(null)
  }, [addGoal, t])

  const handleEditGoal = useCallback((data) => {
    if (!modal?.goalId) return
    updateGoal(modal.goalId, data)
    toast.success(t('savings.goalEdited'))
    setModal(null)
  }, [modal, updateGoal, t])

  const handleContribute = useCallback((amount) => {
    if (!modal?.goalId || amount <= 0) return
    contribute(modal.goalId, amount)
    toast.success(t('savings.contributed', { amount: formatCurrency(amount) }))
    setModal(null)
  }, [modal, contribute, t])

  const handleDelete = useCallback((id, name) => {
    removeGoal(id)
    toast.success(t('savings.goalDeleted', { name }))
  }, [removeGoal, t])

  const editingGoal = modal?.type === 'edit' ? goals.find((g) => g.id === modal.goalId) : null
  const contributingGoal = modal?.type === 'contribute' ? goals.find((g) => g.id === modal.goalId) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo-crown-sm.webp" alt="Monest" className="w-7 h-7 lg:hidden" />
          <motion.h1 className="text-2xl font-bold" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            {t('savings.title')}
          </motion.h1>
        </div>
        {goals.length > 0 && (
          <Button size="sm" onClick={() => setModal({ type: 'add' })}>
            <Plus size={14} className="inline mr-1" /> {t('common.add')}
          </Button>
        )}
      </div>

      {goals.length > 0 && (
        <Card className="glass !border-brand/10">
          <div className="flex items-center gap-5">
            <CircularProgress percentage={overallPct} size={130} strokeWidth={9} />
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">{t('savings.totalSaved')}</p>
                <AnimatedNumber value={totalSaved} format={formatCurrency} className="text-xl font-bold text-text-primary" />
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">{t('savings.totalGoal')}</p>
                <AnimatedNumber value={totalTarget} format={formatCurrency} className="text-sm font-semibold text-text-secondary" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                <Sparkles size={10} className="text-brand-light" />
                {t('savings.goalCount', { count: goals.length })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {goals.length === 0 && <EmptyState onAdd={() => setModal({ type: 'add' })} t={t} />}

      {goals.length > 0 && (
        <>
          <p className="text-[10px] text-text-muted text-center">{t('savings.swipeHint')}</p>
          <div className="space-y-2.5">
            <AnimatePresence>
              {goals.map((goal, i) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  index={i}
                  onEdit={() => setModal({ type: 'edit', goalId: goal.id })}
                  onContribute={() => setModal({ type: 'contribute', goalId: goal.id })}
                  onDelete={() => handleDelete(goal.id, goal.name)}
                  t={t}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      <Modal isOpen={modal?.type === 'add'} onClose={() => setModal(null)} title={t('savings.newGoalTitle')}>
        <GoalForm onSubmit={handleAddGoal} onCancel={() => setModal(null)} t={t} />
      </Modal>

      <Modal isOpen={modal?.type === 'edit'} onClose={() => setModal(null)} title={t('savings.editGoalTitle')}>
        {editingGoal && <GoalForm initialValues={editingGoal} onSubmit={handleEditGoal} onCancel={() => setModal(null)} t={t} />}
      </Modal>

      <Modal isOpen={modal?.type === 'contribute'} onClose={() => setModal(null)} title={t('savings.contributeTitle')}>
        {contributingGoal && <ContributeForm goal={contributingGoal} onSubmit={handleContribute} onCancel={() => setModal(null)} t={t} />}
      </Modal>
    </div>
  )
}

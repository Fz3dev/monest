import { useState, useMemo, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { useExpenseStore } from '../stores/expenseStore'
import { useHouseholdStore } from '../stores/householdStore'
import { useCategoriesStore } from '../stores/categoriesStore'
import { formatCurrency, getCurrentMonth, formatMonth, getCategoryLabel } from '../utils/format'
import { syncToSupabase } from '../lib/syncBridge'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import SwipeToDelete from '../components/ui/SwipeToDelete'
import { ChevronLeft, ChevronRight, Receipt } from 'lucide-react'
import { addMonths, subMonths, format, isToday, isYesterday, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Expense, Payer } from '../types'
import type { TFunction } from 'i18next'

function formatDateLabel(dateStr: string, t: TFunction) {
  const date = parseISO(dateStr)
  if (isToday(date)) return t('expenses.today')
  if (isYesterday(date)) return t('expenses.yesterday')
  return format(date, 'EEEE d MMMM', { locale: fr })
}

export default function ExpensesPage() {
  const { t } = useTranslation()
  const household = useHouseholdStore((s) => s.household)
  const expenses = useExpenseStore((s) => s.expenses)
  const removeExpense = useExpenseStore((s) => s.removeExpense)
  const updateExpense = useExpenseStore((s) => s.updateExpense)
  const getTotalByMonth = useExpenseStore((s) => s.getTotalByMonth)
  const getCategoryColor = useCategoriesStore((s) => s.getCategoryColor)
  const getCategoryEmoji = useCategoriesStore((s) => s.getCategoryEmoji)

  const [currentMonth, setCurrentMonth] = useState(() => getCurrentMonth())
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [payerFilter, setPayerFilter] = useState<string | null>(null) // null = all, 'common', 'person_a', 'person_b'
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editForm, setEditForm] = useState({ note: '', amount: '', category: '', date: '' })
  const touchStartX = useRef<number | null>(null)

  const navigateMonth = (direction: 'prev' | 'next') => {
    const date = new Date(currentMonth + '-01')
    const newDate = direction === 'next' ? addMonths(date, 1) : subMonths(date, 1)
    setCurrentMonth(format(newDate, 'yyyy-MM'))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    touchStartX.current = null
    if (Math.abs(diff) > 60) navigateMonth(diff > 0 ? 'next' : 'prev')
  }

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date?.startsWith(currentMonth)),
    [expenses, currentMonth]
  )

  const payerFilteredExpenses = useMemo(
    () => payerFilter ? monthExpenses.filter((e) => e.payer === payerFilter) : monthExpenses,
    [monthExpenses, payerFilter]
  )

  const monthTotalAll = getTotalByMonth(currentMonth)
  const monthTotal = payerFilter
    ? payerFilteredExpenses.reduce((sum, e) => sum + e.amount, 0)
    : monthTotalAll

  const filteredExpenses = useMemo(
    () =>
      activeCategory
        ? payerFilteredExpenses.filter((e) => (e.category || 'autre') === activeCategory)
        : payerFilteredExpenses,
    [payerFilteredExpenses, activeCategory]
  )

  // Category breakdown for pills (respects payer filter)
  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, number> = {}
    payerFilteredExpenses.forEach((e) => {
      const key = e.category || 'autre'
      cats[key] = (cats[key] || 0) + e.amount
    })
    return Object.entries(cats)
      .sort(([, a], [, b]) => b - a)
      .map(([category, total]) => ({ category, total }))
  }, [payerFilteredExpenses])

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {}
    const sorted = [...filteredExpenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    sorted.forEach((expense) => {
      const dateKey = expense.date?.slice(0, 10) || 'inconnu'
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(expense)
    })
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredExpenses])

  const getPayerColor = (payer: Payer) => {
    if (payer === 'person_a') return household?.personAColor || '#6C63FF'
    if (payer === 'person_b') return household?.personBColor || '#818CF8'
    return '#6C63FF'
  }

  const CATEGORY_OPTIONS = [
    { value: 'alimentation', label: getCategoryLabel('alimentation'), emoji: getCategoryEmoji('alimentation') },
    { value: 'loisirs', label: getCategoryLabel('loisirs'), emoji: getCategoryEmoji('loisirs') },
    { value: 'transport', label: getCategoryLabel('transport'), emoji: getCategoryEmoji('transport') },
    { value: 'sante', label: getCategoryLabel('sante'), emoji: getCategoryEmoji('sante') },
    { value: 'logement', label: getCategoryLabel('logement'), emoji: getCategoryEmoji('logement') },
    { value: 'abonnement', label: getCategoryLabel('abonnement'), emoji: getCategoryEmoji('abonnement') },
    { value: 'enfants', label: getCategoryLabel('enfants'), emoji: getCategoryEmoji('enfants') },
    { value: 'autre', label: getCategoryLabel('autre'), emoji: getCategoryEmoji('autre') },
  ]

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setEditForm({
      note: expense.note || '',
      amount: String(expense.amount),
      category: expense.category || 'autre',
      date: expense.date || '',
    })
  }

  const handleEditSave = () => {
    if (!editingExpense) return
    const amount = parseFloat(editForm.amount)
    if (!amount || amount <= 0) {
      toast.error('Le montant doit être supérieur à 0')
      return
    }
    updateExpense(editingExpense.id, {
      note: editForm.note.trim() || undefined,
      amount,
      category: editForm.category,
      date: editForm.date,
    })
    toast.success(t('expenses.updated'))
    setEditingExpense(null)
  }

  const handleDelete = useCallback(
    (id: string, note: string | undefined) => {
      const item = useExpenseStore.getState().expenses.find((e) => e.id === id)
      removeExpense(id)
      const name = note || t('expenses.defaultExpenseName')
      toast(t('expenses.deleted', { name }), {
        action: item ? {
          label: t('common.cancel'),
          onClick: () => {
            useExpenseStore.setState((state) => ({
              expenses: [item, ...state.expenses],
            }))
            syncToSupabase('expenses', item)
            toast.success(t('expenses.restored', { name }))
          },
        } : undefined,
      })
    },
    [removeExpense, t]
  )

  return (
    <div className="space-y-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Month navigation */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 text-text-muted hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors"
          aria-label={t('expenses.prevMonth')}
        >
          <ChevronLeft size={20} />
        </button>
        <AnimatePresence mode="wait">
          <motion.h1
            key={currentMonth}
            className="text-xl font-bold min-w-[120px] text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            {formatMonth(currentMonth)}
          </motion.h1>
        </AnimatePresence>
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 text-text-muted hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors"
          aria-label={t('expenses.nextMonth')}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Total spent card */}
      <Card className="glass !border-brand/20 text-center">
        <div className="text-3xl font-bold text-danger">
          <AnimatedNumber
            value={monthTotal}
            format={(v) => `- ${formatCurrency(Math.round(v))}`}
          />
        </div>
        <p className="text-xs text-text-muted mt-1">
          {t('expenses.expenseCount', { count: payerFilteredExpenses.length })}
        </p>
      </Card>

      {/* Payer filter pills — couple mode only */}
      {household?.personBName && (
        <div className="flex gap-1.5 flex-wrap">
          {[
            { value: null, label: t('common.all') },
            { value: 'common', label: t('common.common') },
            { value: 'person_a', label: household.personAName },
            { value: 'person_b', label: household.personBName },
          ].map((opt) => (
            <button
              key={opt.value ?? 'all'}
              onClick={() => setPayerFilter(payerFilter === opt.value ? null : opt.value)}
              className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                payerFilter === opt.value
                  ? 'bg-brand/15 text-brand border border-brand/30'
                  : 'bg-white/[0.04] text-text-muted border border-white/[0.08]'
              }`}
              style={payerFilter === opt.value && opt.value === 'person_a' ? { backgroundColor: `${household.personAColor}15`, color: household.personAColor, borderColor: `${household.personAColor}40` } :
                     payerFilter === opt.value && opt.value === 'person_b' ? { backgroundColor: `${household.personBColor}15`, color: household.personBColor, borderColor: `${household.personBColor}40` } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Category breakdown pills */}
      {categoryBreakdown.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeCategory === null
                ? 'bg-brand text-white shadow-lg shadow-brand/20'
                : 'bg-white/[0.06] text-text-muted hover:text-white'
            }`}
          >
            {t('common.all')}
          </button>
          {categoryBreakdown.map(({ category, total }) => (
            <button
              key={category}
              onClick={() =>
                setActiveCategory(activeCategory === category ? null : category)
              }
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === category
                  ? 'text-white shadow-lg'
                  : 'bg-white/[0.06] text-text-muted hover:text-white'
              }`}
              style={
                activeCategory === category
                  ? { backgroundColor: getCategoryColor(category) }
                  : undefined
              }
            >
              <span>{getCategoryEmoji(category)}</span>
              <span>{formatCurrency(Math.round(total))}</span>
            </button>
          ))}
        </div>
      )}

      {/* Expenses list grouped by date */}
      {groupedExpenses.length > 0 && (
        <p className="text-[10px] text-text-muted text-center">
          <span className="lg:hidden">{t('expenses.swipeHintMobile')}</span>
          <span className="hidden lg:inline">{t('expenses.swipeHintDesktop')}</span>
        </p>
      )}

      <AnimatePresence mode="wait">
        {groupedExpenses.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="text-center py-10">
              <Receipt size={40} className="text-text-muted mx-auto mb-3 opacity-40" />
              <p className="text-text-secondary font-medium">{t('expenses.noExpenses')}</p>
              <p className="text-xs text-text-muted mt-1">
                {activeCategory
                  ? t('expenses.noExpensesInCategory')
                  : t('expenses.expensesWillAppear')}
              </p>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key={`${currentMonth}-${activeCategory || 'all'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {groupedExpenses.map(([dateKey, dayExpenses], groupIndex) => {
              const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0)

              return (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.05, duration: 0.25 }}
                  className="space-y-1.5"
                >
                  {/* Date group header */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-text-secondary capitalize">
                      {formatDateLabel(dateKey, t)}
                    </span>
                    <span className="text-xs font-medium text-danger tabular-nums">
                      - {formatCurrency(Math.round(dayTotal))}
                    </span>
                  </div>

                  {/* Day expenses */}
                  <div className="space-y-1">
                    {dayExpenses.map((expense, itemIndex) => (
                      <motion.div
                        key={expense.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: groupIndex * 0.05 + itemIndex * 0.03,
                          duration: 0.2,
                        }}
                      >
                        <SwipeToDelete
                          onDelete={() => handleDelete(expense.id, expense.note)}
                          deleteLabel={t('common.delete')}
                        >
                          <Card animate={false} className="cursor-pointer" onClick={() => handleEdit(expense)}>
                            <div className="flex items-center gap-3">
                              {/* Category emoji */}
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                style={{
                                  backgroundColor: `${getCategoryColor(expense.category)}15`,
                                }}
                              >
                                {getCategoryEmoji(expense.category)}
                              </div>

                              {/* Name + category */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium truncate">
                                    {expense.note || getCategoryLabel(expense.category || 'autre')}
                                  </span>
                                  {expense.payer && (
                                    <div
                                      className="w-2 h-2 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: getPayerColor(expense.payer) }}
                                    />
                                  )}
                                </div>
                                <span className="text-[11px] text-text-muted">
                                  {getCategoryLabel(expense.category || 'autre')}
                                </span>
                              </div>

                              {/* Amount */}
                              <span className="text-sm font-bold text-danger tabular-nums flex-shrink-0">
                                - {formatCurrency(expense.amount, expense.amount % 1 !== 0)}
                              </span>
                            </div>
                          </Card>
                        </SwipeToDelete>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit expense modal */}
      <Modal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        title={t('expenses.editExpense')}
      >
        <div className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              {t('common.amount')}
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">€</span>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              {t('expenses.note')}
            </label>
            <input
              type="text"
              value={editForm.note}
              onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
              placeholder={t('quickAdd.notePlaceholder')}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-base text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              {t('expenses.category')}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setEditForm({ ...editForm, category: cat.value })}
                  className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-all cursor-pointer text-center ${
                    editForm.category === cat.value
                      ? 'bg-brand/15 border-2 border-brand'
                      : 'bg-white/[0.03] border-2 border-transparent hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className={`text-[10px] font-medium leading-tight ${
                    editForm.category === cat.value ? 'text-brand-light' : 'text-text-secondary'
                  }`}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              {t('expenses.date')}
            </label>
            <input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              style={{ colorScheme: 'dark' }}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleEditSave}
            className="w-full py-3 rounded-2xl text-sm font-semibold bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/25 transition-all cursor-pointer"
          >
            {t('common.save')}
          </button>
        </div>
      </Modal>
    </div>
  )
}

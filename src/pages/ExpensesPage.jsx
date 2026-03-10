import { useState, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react'
import { useExpenseStore } from '../stores/expenseStore'
import { useHouseholdStore } from '../stores/householdStore'
import { formatCurrency, getCurrentMonth, formatMonth, CATEGORIES } from '../utils/format'
import Card from '../components/ui/Card'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import { ChevronLeft, ChevronRight, Trash2, Receipt } from 'lucide-react'
import { addMonths, subMonths, format, isToday, isYesterday, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

const CATEGORY_EMOJIS = {
  alimentation: '\u{1F6D2}',
  loisirs: '\u{1F3AE}',
  transport: '\u26FD',
  sante: '\u{1F3E5}',
  enfants: '\u{1F476}',
  logement: '\u{1F3E0}',
  abonnement: '\u{1F4F1}',
  autre: '\u{1F381}',
  restaurant: '\u{1F37D}\uFE0F',
  education: '\u{1F393}',
  credit: '\u{1F4B3}',
  assurance: '\u{1F6E1}\uFE0F',
  impot: '\u{1F4CB}',
}

const CATEGORY_COLORS = {
  logement: '#6C63FF',
  assurance: '#818CF8',
  credit: '#F87171',
  abonnement: '#38BDF8',
  impot: '#FBBF24',
  transport: '#FB923C',
  alimentation: '#4ADE80',
  sante: '#F472B6',
  education: '#A78BFA',
  loisirs: '#34D399',
  enfants: '#E879F9',
  autre: '#94A3B8',
}

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
      <motion.div
        className="absolute inset-0 bg-danger/20 flex items-center justify-end pr-6"
        style={{ opacity: bgOpacity }}
      >
        <Trash2 size={18} className="text-danger" />
      </motion.div>
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  )
}

function formatDateLabel(dateStr) {
  const date = parseISO(dateStr)
  if (isToday(date)) return "Aujourd'hui"
  if (isYesterday(date)) return 'Hier'
  return format(date, 'EEEE d MMMM', { locale: fr })
}

function getCategoryLabel(categoryKey) {
  const found = CATEGORIES.find((c) => c.value === categoryKey)
  return found ? found.label : categoryKey
}

export default function ExpensesPage() {
  const household = useHouseholdStore((s) => s.household)
  const expenses = useExpenseStore((s) => s.expenses)
  const removeExpense = useExpenseStore((s) => s.removeExpense)
  const getTotalByMonth = useExpenseStore((s) => s.getTotalByMonth)

  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [activeCategory, setActiveCategory] = useState(null)
  const touchStartX = useRef(null)

  const navigateMonth = (direction) => {
    const date = new Date(currentMonth + '-01')
    const newDate = direction === 'next' ? addMonths(date, 1) : subMonths(date, 1)
    setCurrentMonth(format(newDate, 'yyyy-MM'))
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    touchStartX.current = null
    if (Math.abs(diff) > 60) navigateMonth(diff > 0 ? 'next' : 'prev')
  }

  const monthTotal = getTotalByMonth(currentMonth)

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date?.startsWith(currentMonth)),
    [expenses, currentMonth]
  )

  const filteredExpenses = useMemo(
    () =>
      activeCategory
        ? monthExpenses.filter((e) => (e.category || 'autre') === activeCategory)
        : monthExpenses,
    [monthExpenses, activeCategory]
  )

  // Category breakdown for pills
  const categoryBreakdown = useMemo(() => {
    const cats = {}
    monthExpenses.forEach((e) => {
      const key = e.category || 'autre'
      cats[key] = (cats[key] || 0) + e.amount
    })
    return Object.entries(cats)
      .sort(([, a], [, b]) => b - a)
      .map(([category, total]) => ({ category, total }))
  }, [monthExpenses])

  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    const groups = {}
    const sorted = [...filteredExpenses].sort(
      (a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt)
    )
    sorted.forEach((expense) => {
      const dateKey = expense.date?.slice(0, 10) || 'inconnu'
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(expense)
    })
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filteredExpenses])

  const getPayerColor = (payer) => {
    if (payer === 'person_a') return household?.personAColor || '#6C63FF'
    if (payer === 'person_b') return household?.personBColor || '#818CF8'
    return '#6C63FF'
  }

  const handleDelete = useCallback(
    (id, note) => {
      removeExpense(id)
      toast.success(`"${note || 'Depense'}" supprimee`)
    },
    [removeExpense]
  )

  return (
    <div className="space-y-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 text-text-muted hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors"
          aria-label="Mois precedent"
        >
          <ChevronLeft size={22} />
        </button>
        <AnimatePresence mode="wait">
          <motion.h1
            key={currentMonth}
            className="text-xl font-bold"
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
          aria-label="Mois suivant"
        >
          <ChevronRight size={22} />
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
          {monthExpenses.length} depense{monthExpenses.length !== 1 ? 's' : ''} ce mois
        </p>
      </Card>

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
            Tout
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
                  ? { backgroundColor: CATEGORY_COLORS[category] || '#94A3B8' }
                  : undefined
              }
            >
              <span>{CATEGORY_EMOJIS[category] || '\u{1F381}'}</span>
              <span>{formatCurrency(Math.round(total))}</span>
            </button>
          ))}
        </div>
      )}

      {/* Expenses list grouped by date */}
      {groupedExpenses.length > 0 && (
        <p className="text-[10px] text-text-muted text-center">
          Glissez vers la gauche pour supprimer
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
              <p className="text-text-secondary font-medium">Aucune depense enregistree</p>
              <p className="text-xs text-text-muted mt-1">
                {activeCategory
                  ? 'Aucune depense dans cette categorie'
                  : 'Les depenses ajoutees apparaitront ici'}
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
                      {formatDateLabel(dateKey)}
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
                        >
                          <Card animate={false}>
                            <div className="flex items-center gap-3">
                              {/* Category emoji */}
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                style={{
                                  backgroundColor: `${CATEGORY_COLORS[expense.category] || '#94A3B8'}15`,
                                }}
                              >
                                {CATEGORY_EMOJIS[expense.category] || '\u{1F381}'}
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
    </div>
  )
}

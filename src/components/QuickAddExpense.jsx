import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useExpenseStore } from '../stores/expenseStore'
import { useHouseholdStore } from '../stores/householdStore'

const CATEGORIES = [
  { emoji: '\u{1F6D2}', labelKey: 'quickAdd.categories.courses', value: 'alimentation' },
  { emoji: '\u{1F37D}\uFE0F', labelKey: 'quickAdd.categories.restaurant', value: 'loisirs' },
  { emoji: '\u26FD', labelKey: 'quickAdd.categories.transport', value: 'transport' },
  { emoji: '\u{1F3E5}', labelKey: 'quickAdd.categories.sante', value: 'sante' },
  { emoji: '\u{1F3AE}', labelKey: 'quickAdd.categories.loisirs', value: 'loisirs' },
  { emoji: '\u{1F476}', labelKey: 'quickAdd.categories.enfants', value: 'enfants' },
  { emoji: '\u{1F3E0}', labelKey: 'quickAdd.categories.logement', value: 'logement' },
  { emoji: '\u{1F4F1}', labelKey: 'quickAdd.categories.abonnement', value: 'abonnement' },
  { emoji: '\u{1F381}', labelKey: 'quickAdd.categories.autre', value: 'autre' },
]

const todayISO = () => new Date().toISOString().split('T')[0]

export default function QuickAddExpense() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(null)
  const [payer, setPayer] = useState('common')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO)

  const amountRef = useRef(null)
  const addExpense = useExpenseStore((s) => s.addExpense)
  const household = useHouseholdStore((s) => s.household)

  const isCouple =
    household?.configModel &&
    household.configModel !== 'solo' &&
    household.configModel !== 'full_personal'

  const resetForm = useCallback(() => {
    setAmount('')
    setCategory(null)
    setPayer('common')
    setNote('')
    setDate(todayISO())
  }, [])

  const handleOpen = () => {
    setIsOpen(true)
    resetForm()
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  useEffect(() => {
    if (isOpen && amountRef.current) {
      const timer = setTimeout(() => amountRef.current?.focus(), 150)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) handleClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen])

  const [submitting, setSubmitting] = useState(false)
  const canSubmit = amount && parseFloat(amount) > 0 && category !== null && !submitting

  const handleSubmit = () => {
    if (!canSubmit) return
    setSubmitting(true)

    const selected = CATEGORIES[category]
    addExpense({
      amount: parseFloat(amount),
      category: selected.value,
      note: note.trim() || undefined,
      date,
      payer: isCouple ? payer : 'person_a',
    })

    toast.success(`${selected.emoji} ${t(selected.labelKey)} \u2014 ${parseFloat(amount).toFixed(2)} \u20ac`, {
      duration: 2000,
    })

    handleClose()
    setTimeout(() => setSubmitting(false), 200)
  }

  const payerOptions = [
    { value: 'common', label: t('payer.common') },
    { value: 'person_a', label: household?.personAName || t('common.personA'), color: household?.personAColor },
    ...(household?.personBName
      ? [{ value: 'person_b', label: household.personBName, color: household?.personBColor }]
      : []),
  ]

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={handleOpen}
        className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-30 w-14 h-14 rounded-full bg-brand text-white shadow-lg shadow-brand/30 flex items-center justify-center cursor-pointer"
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.05 }}
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(108, 99, 255, 0.4)',
            '0 0 0 12px rgba(108, 99, 255, 0)',
            '0 0 0 0 rgba(108, 99, 255, 0)',
          ],
        }}
        transition={{
          boxShadow: {
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 1,
            ease: 'easeOut',
          },
        }}
        aria-label={t('quickAdd.addExpense')}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Plus size={26} strokeWidth={2.5} />
        </motion.div>
      </motion.button>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70"
              onClick={handleClose}
            />

            {/* Sheet */}
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full max-w-lg bg-bg-primary border-t border-white/[0.08] rounded-t-3xl max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label={t('quickAdd.addExpense')}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/[0.15]" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3">
                <h2 className="text-lg font-semibold text-text-primary">{t('quickAdd.title')}</h2>
                <button
                  onClick={handleClose}
                  className="text-text-secondary hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                  aria-label={t('common.close')}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-5 pb-6 space-y-5">
                {/* Amount */}
                <div className="flex items-center justify-center py-3">
                  <div className="relative inline-flex items-baseline gap-1">
                    <input
                      ref={amountRef}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="bg-transparent text-center text-4xl font-bold text-text-primary placeholder-text-muted/50 focus:outline-none w-40 tabular-nums"
                    />
                    <span className="text-2xl font-semibold text-text-secondary">€</span>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map((cat, idx) => {
                      const isSelected = category === idx
                      return (
                        <motion.button
                          key={cat.labelKey}
                          type="button"
                          whileTap={{ scale: 0.92 }}
                          onClick={() => setCategory(idx)}
                          className={`flex flex-col items-center gap-1 py-3 px-1 rounded-2xl transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-brand/15 border-2 border-brand shadow-md shadow-brand/10'
                              : 'bg-white/[0.03] border-2 border-transparent hover:bg-white/[0.06]'
                          }`}
                        >
                          <motion.span
                            className="text-2xl"
                            animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.25 }}
                          >
                            {cat.emoji}
                          </motion.span>
                          <span
                            className={`text-[11px] font-medium leading-tight ${
                              isSelected ? 'text-brand-light' : 'text-text-secondary'
                            }`}
                          >
                            {t(cat.labelKey)}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Payer selector (couple mode) */}
                {isCouple && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <label className="block text-xs font-medium text-text-secondary mb-2">
                      {t('quickAdd.paidBy')}
                    </label>
                    <div className="flex gap-1.5 bg-white/[0.03] rounded-2xl p-1 border border-white/[0.06]">
                      {payerOptions.map((opt) => (
                        <motion.button
                          key={opt.value}
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPayer(opt.value)}
                          className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                            payer === opt.value
                              ? 'bg-brand text-white shadow-md shadow-brand/20'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {opt.label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Note + Date row */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t('quickAdd.notePlaceholder')}
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all"
                  />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all w-[130px]"
                  />
                </div>

                {/* Submit */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                  className={`w-full py-3.5 rounded-2xl text-base font-semibold transition-all cursor-pointer ${
                    canSubmit
                      ? 'bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/25'
                      : 'bg-white/[0.06] text-text-muted cursor-not-allowed'
                  }`}
                >
                  {t('quickAdd.submit')}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { computeMonth } from '../utils/calculations'
import { formatCurrency, formatMonth, getCurrentMonth } from '../utils/format'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import ProgressBar from '../components/ui/ProgressBar'
import { ChevronLeft, ChevronRight, Wallet, TrendingDown } from 'lucide-react'
import { addMonths, subMonths, format } from 'date-fns'

export default function MonthlyPage() {
  const household = useHouseholdStore((s) => s.household)
  const { fixedCharges, installmentPayments, plannedExpenses } = useChargesStore()
  const entries = useMonthlyStore((s) => s.entries)
  const setEntry = useMonthlyStore((s) => s.setEntry)
  const updateVariable = useMonthlyStore((s) => s.updateVariable)

  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [swipeDir, setSwipeDir] = useState(0)
  const touchStartX = useRef(null)

  const entry = entries[currentMonth] || null
  const result = useMemo(
    () => computeMonth(currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entry),
    [currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entry]
  )

  const navigateMonth = (direction) => {
    setSwipeDir(direction === 'next' ? 1 : -1)
    const date = new Date(currentMonth + '-01')
    const newDate = direction === 'next' ? addMonths(date, 1) : subMonths(date, 1)
    setCurrentMonth(format(newDate, 'yyyy-MM'))
  }

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    touchStartX.current = null
    if (Math.abs(diff) > 60) navigateMonth(diff > 0 ? 'next' : 'prev')
  }

  const handleIncomeChange = (field, value) => {
    const num = parseFloat(value) || 0
    setEntry(currentMonth, { ...(entry || {}), [field]: num })
  }

  const getResteColor = (reste) => {
    if (reste >= 1500) return 'text-success'
    if (reste >= 500) return 'text-warning'
    return 'text-danger'
  }

  return (
    <div className="space-y-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Month navigation — swipe left/right to change month */}
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

      {/* Revenus */}
      <Card>
        <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">Revenus</h2>
        <div className="space-y-3">
          <Input
            label={`Salaire ${household?.personAName || 'Personne A'}`}
            type="number"
            value={entry?.incomeA || ''}
            onChange={(e) => handleIncomeChange('incomeA', e.target.value)}
            placeholder="0"
            suffix="€"
          />
          {household?.personBName && (
            <Input
              label={`Salaire ${household.personBName}`}
              type="number"
              value={entry?.incomeB || ''}
              onChange={(e) => handleIncomeChange('incomeB', e.target.value)}
              placeholder="0"
              suffix="€"
            />
          )}
          <Input
            label={`Remboursement pro ${household?.personAName || ''}`}
            type="number"
            value={entry?.proReimbursementA || ''}
            onChange={(e) => handleIncomeChange('proReimbursementA', e.target.value)}
            placeholder="0"
            suffix="€"
          />
          {household?.personBName && (
            <Input
              label={`Remboursement pro ${household.personBName}`}
              type="number"
              value={entry?.proReimbursementB || ''}
              onChange={(e) => handleIncomeChange('proReimbursementB', e.target.value)}
              placeholder="0"
              suffix="€"
            />
          )}
        </div>
      </Card>

      {/* Charges */}
      <Card>
        <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">Charges du mois</h2>
        <div className="space-y-1">
          {result.charges.map((charge) => (
            <div key={charge.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      charge.payer === 'person_a' ? household?.personAColor
                      : charge.payer === 'person_b' ? household?.personBColor
                      : '#6C63FF',
                  }}
                />
                <span className="text-sm text-text-secondary truncate">{charge.name}</span>
              </div>
              {charge.type === 'fixed' ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={
                      entry?.variableOverrides?.[charge.id] !== undefined
                        ? entry.variableOverrides[charge.id]
                        : charge.originalAmount
                    }
                    onChange={(e) =>
                      updateVariable(currentMonth, charge.id, parseFloat(e.target.value) || 0)
                    }
                    className="w-24 text-right bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand/50"
                  />
                  <span className="text-xs text-text-muted">€</span>
                </div>
              ) : (
                <span className="text-sm font-medium tabular-nums">{formatCurrency(charge.amount)}</span>
              )}
            </div>
          ))}

          {result.charges.length === 0 && (
            <p className="text-sm text-text-muted text-center py-6">
              Aucune charge configuree. Ajoutez-en dans l'onglet Charges.
            </p>
          )}
        </div>
      </Card>

      {/* Reste a vivre */}
      <Card className="glass !border-brand/20">
        <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">Reste a vivre</h2>
        <div className="space-y-3">
          {/* Income vs charges bar */}
          {(result.incomeA > 0 || result.incomeB > 0) && (
            <div className="space-y-1.5 mb-2">
              <div className="flex justify-between text-[10px] text-text-muted">
                <div className="flex items-center gap-1"><Wallet size={10} /> Revenus</div>
                <div className="flex items-center gap-1"><TrendingDown size={10} /> Charges</div>
              </div>
              <ProgressBar
                value={result.totalCommon + result.personalACharges + result.personalBCharges}
                max={result.incomeA + result.incomeB + result.proReimbA + result.proReimbB}
                color={result.resteFoyer >= 1000 ? '#4ADE80' : result.resteFoyer >= 0 ? '#FBBF24' : '#F87171'}
              />
              <div className="flex justify-between text-[10px] text-text-muted tabular-nums">
                <span>{formatCurrency(result.incomeA + result.incomeB + result.proReimbA + result.proReimbB)}</span>
                <span>{formatCurrency(result.totalCommon + result.personalACharges + result.personalBCharges)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: household?.personAColor }}>{household?.personAName}</span>
            <span className={`text-xl font-bold ${getResteColor(result.resteA)}`}>
              <AnimatedNumber value={result.resteA} format={(v) => formatCurrency(Math.round(v))} />
            </span>
          </div>
          {household?.personBName && (
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: household?.personBColor }}>{household.personBName}</span>
              <span className={`text-xl font-bold ${getResteColor(result.resteB)}`}>
                <AnimatedNumber value={result.resteB} format={(v) => formatCurrency(Math.round(v))} />
              </span>
            </div>
          )}
          <div className="border-t border-white/[0.06] pt-3 flex justify-between items-center">
            <span className="text-text-secondary font-medium">Foyer</span>
            <span className={`text-2xl font-bold ${getResteColor(result.resteFoyer)}`}>
              <AnimatedNumber value={result.resteFoyer} format={(v) => formatCurrency(Math.round(v))} />
            </span>
          </div>
        </div>
      </Card>

      {/* Repartition */}
      {household?.personBName && (
        <Card>
          <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">Repartition</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-text-muted">
              <span>Charges communes</span>
              <span className="tabular-nums">{formatCurrency(result.totalCommon)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: household?.personAColor }}>
                Part {household.personAName} ({Math.round((result.ratio || 0.5) * 100)}%)
              </span>
              <span className="tabular-nums">{formatCurrency(result.shareA)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: household?.personBColor }}>
                Part {household.personBName} ({Math.round((1 - (result.ratio || 0.5)) * 100)}%)
              </span>
              <span className="tabular-nums">{formatCurrency(result.shareB)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

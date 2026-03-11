import { useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
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
import { ChevronLeft, ChevronRight, Wallet, TrendingDown, AlertTriangle, CheckCircle2, ArrowUpDown } from 'lucide-react'
import { addMonths, subMonths, format } from 'date-fns'

export default function MonthlyPage() {
  const { t } = useTranslation()
  const household = useHouseholdStore((s) => s.household)
  const fixedCharges = useChargesStore((s) => s.fixedCharges)
  const installmentPayments = useChargesStore((s) => s.installmentPayments)
  const plannedExpenses = useChargesStore((s) => s.plannedExpenses)
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

      {/* Revenus + Solde — side by side on desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 lg:space-y-0">
        <Card>
          <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">{t('monthly.income')}</h2>
          <div className="space-y-3">
            <Input
              label={t('monthly.salary', { name: household?.personAName || t('common.personA') })}
              type="number"
              value={entry?.incomeA || ''}
              onChange={(e) => handleIncomeChange('incomeA', e.target.value)}
              placeholder="0"
              suffix="€"
            />
            {household?.personBName && (
              <Input
                label={t('monthly.salary', { name: household.personBName })}
                type="number"
                value={entry?.incomeB || ''}
                onChange={(e) => handleIncomeChange('incomeB', e.target.value)}
                placeholder="0"
                suffix="€"
              />
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={12} className="text-warning" />
            <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('monthly.balanceBefore')}</h2>
            <div className="relative group ml-auto">
              <span className="text-text-muted text-[10px] cursor-help border border-white/10 rounded-full w-4 h-4 flex items-center justify-center hover:text-text-secondary transition-colors">?</span>
              <div className="absolute right-0 top-6 w-56 p-2.5 rounded-xl bg-bg-elevated border border-white/10 text-[11px] text-text-muted shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-20">
                {t('monthly.balanceBeforeHint')}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-text-muted mb-3 lg:hidden">
            {t('monthly.balanceBeforeHintMobile')}
          </p>
          <div className="space-y-3">
            <Input
              label={t('monthly.balance', { name: household?.personAName || t('common.personA') })}
              type="number"
              value={entry?.startingBalanceA ?? ''}
              onChange={(e) => handleIncomeChange('startingBalanceA', e.target.value)}
              placeholder="0"
              suffix="€"
            />
            {household?.personBName && (
              <Input
                label={t('monthly.balance', { name: household.personBName })}
                type="number"
                value={entry?.startingBalanceB ?? ''}
                onChange={(e) => handleIncomeChange('startingBalanceB', e.target.value)}
                placeholder="0"
                suffix="€"
              />
            )}
          </div>
        </Card>
      </div>

      {/* Charges */}
      <Card>
        <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">{t('monthly.monthCharges')}</h2>
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
                    value={String(
                      entry?.variableOverrides?.[charge.id] !== undefined
                        ? entry.variableOverrides[charge.id]
                        : charge.originalAmount
                    )}
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
              {t('monthly.noCharges')}
            </p>
          )}
        </div>
      </Card>

      {/* Reste a vivre + Repartition — side by side on desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 lg:space-y-0">
      <Card className="glass !border-brand/20">
        <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">{t('monthly.remainingToLive')}</h2>
        <div className="space-y-3">
          {/* Income vs charges bar */}
          {(result.incomeA > 0 || result.incomeB > 0) && (
            <div className="space-y-1.5 mb-2">
              <div className="flex justify-between text-[10px] text-text-muted">
                <div className="flex items-center gap-1"><Wallet size={10} /> {t('monthly.incomeLabel')}</div>
                <div className="flex items-center gap-1"><TrendingDown size={10} /> {t('monthly.chargesLabel')}</div>
              </div>
              <ProgressBar
                value={result.totalCommon + result.personalACharges + result.personalBCharges}
                max={result.incomeA + result.incomeB}
                color={result.resteFoyer >= 1000 ? '#4ADE80' : result.resteFoyer >= 0 ? '#FBBF24' : '#F87171'}
              />
              <div className="flex justify-between text-[10px] text-text-muted tabular-nums">
                <span>{formatCurrency(result.incomeA + result.incomeB)}</span>
                <span>{formatCurrency(result.totalCommon + result.personalACharges + result.personalBCharges)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm" style={{ color: household?.personAColor }}>{household?.personAName}</span>
              {result.startingBalanceA < 0 && (
                <span className="text-[10px] text-danger ml-1.5">({formatCurrency(result.startingBalanceA)})</span>
              )}
            </div>
            <span className={`text-xl font-bold ${getResteColor(result.resteA)}`}>
              <AnimatedNumber value={result.resteA} format={(v) => formatCurrency(Math.round(v))} />
            </span>
          </div>
          {household?.personBName && (
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm" style={{ color: household?.personBColor }}>{household.personBName}</span>
                {result.startingBalanceB < 0 && (
                  <span className="text-[10px] text-danger ml-1.5">({formatCurrency(result.startingBalanceB)})</span>
                )}
              </div>
              <span className={`text-xl font-bold ${getResteColor(result.resteB)}`}>
                <AnimatedNumber value={result.resteB} format={(v) => formatCurrency(Math.round(v))} />
              </span>
            </div>
          )}
          <div className="border-t border-white/[0.06] pt-3 flex justify-between items-center">
            <span className="text-text-secondary font-medium">{t('monthly.household')}</span>
            <span className={`text-2xl font-bold ${getResteColor(result.resteFoyer)}`}>
              <AnimatedNumber value={result.resteFoyer} format={(v) => formatCurrency(Math.round(v))} />
            </span>
          </div>
        </div>
      </Card>

      {/* Repartition */}
      {household?.personBName ? (
        <Card>
          <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">{t('monthly.distribution')}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-text-muted">
              <span>{t('monthly.commonCharges')}</span>
              <span className="tabular-nums">{formatCurrency(result.totalCommon)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: household?.personAColor }}>
                {t('monthly.share', { name: household.personAName, percent: Math.round((result.ratio || 0.5) * 100) })}
              </span>
              <span className="tabular-nums">{formatCurrency(result.shareA)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: household?.personBColor }}>
                {t('monthly.share', { name: household.personBName, percent: Math.round((1 - (result.ratio || 0.5)) * 100) })}
              </span>
              <span className="tabular-nums">{formatCurrency(result.shareB)}</span>
            </div>
          </div>
        </Card>
      ) : <div className="hidden lg:block" />}
      </div>

      {/* Virements effectues + Regularisation */}
      {household?.personBName && result.totalCommon > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={12} className="text-success" />
            <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('monthly.transfersDone')}</h2>
          </div>
          <p className="text-[11px] text-text-muted mb-3">
            {t('monthly.transfersHint')}
          </p>
          <div className="space-y-3">
            <Input
              label={t('monthly.transferredBy', { name: household.personAName })}
              type="number"
              value={entry?.transferredA ?? ''}
              onChange={(e) => handleIncomeChange('transferredA', e.target.value)}
              placeholder="0"
              suffix="€"
            />
            <Input
              label={t('monthly.transferredBy', { name: household.personBName })}
              type="number"
              value={entry?.transferredB ?? ''}
              onChange={(e) => handleIncomeChange('transferredB', e.target.value)}
              placeholder="0"
              suffix="€"
            />
          </div>

          {/* Regularisation */}
          {((entry?.transferredA || 0) > 0 || (entry?.transferredB || 0) > 0) && (() => {
            const transferredA = entry?.transferredA || 0
            const transferredB = entry?.transferredB || 0
            const regulA = Math.round((result.shareA - transferredA) * 100) / 100
            const regulB = Math.round((result.shareB - transferredB) * 100) / 100
            const hasRegul = Math.abs(regulA) >= 0.01 || Math.abs(regulB) >= 0.01

            return (
              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpDown size={12} className={hasRegul ? 'text-warning' : 'text-success'} />
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                    {hasRegul ? t('monthly.regularization') : t('monthly.upToDate')}
                  </span>
                </div>
                {!hasRegul ? (
                  <p className="text-sm text-success">{t('monthly.transfersMatch')}</p>
                ) : (
                  <div className="space-y-2">
                    {Math.abs(regulA) >= 0.01 && (
                      <div className="flex justify-between items-center text-sm">
                        <span style={{ color: household.personAColor }}>{household.personAName}</span>
                        <span className={`font-semibold ${regulA > 0 ? 'text-danger' : 'text-success'}`}>
                          {regulA > 0 ? t('monthly.mustTransfer', { amount: formatCurrency(regulA) }) : t('monthly.overTransferred', { amount: formatCurrency(Math.abs(regulA)) })}
                        </span>
                      </div>
                    )}
                    {Math.abs(regulB) >= 0.01 && (
                      <div className="flex justify-between items-center text-sm">
                        <span style={{ color: household.personBColor }}>{household.personBName}</span>
                        <span className={`font-semibold ${regulB > 0 ? 'text-danger' : 'text-success'}`}>
                          {regulB > 0 ? t('monthly.mustTransfer', { amount: formatCurrency(regulB) }) : t('monthly.overTransferred', { amount: formatCurrency(Math.abs(regulB)) })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}
        </Card>
      )}
    </div>
  )
}

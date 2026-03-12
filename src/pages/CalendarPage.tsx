import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { computeMonth } from '../utils/calculations'
import { formatCurrency, formatMonthShort, getCurrentMonth, getCategoryLabel } from '../utils/format'
import { PAYER, PAYER_ORDER } from '../types'
import type { Payer, ComputeMonthResult } from '../types'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import { addMonths, format } from 'date-fns'
import { TrendingDown, TrendingUp, Minus, ChevronDown } from 'lucide-react'

interface MonthData {
  month: string
  label: string
  result: ComputeMonthResult
  totalCharges: number
  status: 'green' | 'yellow' | 'red'
  hasSpecial: boolean
  catBreakdown: { name: string; label: string; value: number }[]
  isCurrent: boolean
}

interface StatusConfig {
  bg: string
  text: string
  icon: ReactNode
}

export default function CalendarPage() {
  const { t } = useTranslation()
  const household = useHouseholdStore((s) => s.household)
  const fixedCharges = useChargesStore((s) => s.fixedCharges)
  const installmentPayments = useChargesStore((s) => s.installmentPayments)
  const plannedExpenses = useChargesStore((s) => s.plannedExpenses)
  const entries = useMonthlyStore((s) => s.entries)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [calPayerFilter, setCalPayerFilter] = useState<Payer | null>(null)

  const months = useMemo(() => {
    const current = getCurrentMonth()
    const results: Omit<MonthData, 'status'>[] = []
    for (let i = 0; i < 12; i++) {
      const m = format(addMonths(new Date(current + '-01'), i), 'yyyy-MM')
      const entry = entries[m] || null
      const result = computeMonth(m, household, fixedCharges, installmentPayments, plannedExpenses, entry)
      const totalCharges = result.totalCommon + result.personalACharges + result.personalBCharges

      const catBreakdown: Record<string, number> = {}
      result.charges.forEach((c) => {
        const key = c.category || 'autre'
        catBreakdown[key] = (catBreakdown[key] || 0) + c.amount
      })

      results.push({
        month: m,
        label: formatMonthShort(m),
        result,
        totalCharges,
        hasSpecial: result.charges.some((c) => c.type === 'installment' || c.type === 'planned'),
        catBreakdown: Object.entries(catBreakdown)
          .map(([name, value]) => ({ name, label: getCategoryLabel(name), value }))
          .sort((a, b) => b.value - a.value),
        isCurrent: m === current,
      })
    }

    // Status based on charges relative to the current month
    const baseCharges = results[0]?.totalCharges || 1
    return results.map((m) => {
      let status: 'green' | 'yellow' | 'red' = 'yellow'
      if (m.totalCharges < baseCharges * 0.9) status = 'green'
      else if (m.totalCharges > baseCharges * 1.1) status = 'red'
      return { ...m, status }
    })
  }, [household, fixedCharges, installmentPayments, plannedExpenses, entries])

  const selected: MonthData | null = selectedMonth ? months.find((m) => m.month === selectedMonth) ?? null : null

  const maxCharges = useMemo(() => {
    return Math.max(...months.map((m) => m.totalCharges), 1)
  }, [months])

  const statusConfig: Record<string, StatusConfig> = {
    green: {
      bg: 'bg-success/10 border-success/20',
      text: 'text-success',
      icon: <TrendingDown size={10} className="text-success" />,
    },
    yellow: {
      bg: 'bg-white/[0.04] border-white/[0.08]',
      text: 'text-text-primary',
      icon: <Minus size={10} className="text-text-muted" />,
    },
    red: {
      bg: 'bg-danger/10 border-danger/20',
      text: 'text-danger',
      icon: <TrendingUp size={10} className="text-danger" />,
    },
  }

  return (
    <div className="space-y-4">
      <motion.h1
        className="text-2xl font-bold"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {t('calendar.title')}
      </motion.h1>

      <div className="grid grid-cols-4 gap-2 lg:grid-cols-6 lg:gap-3">
        {months.map((m, i) => {
          const cfg = statusConfig[m.status]
          const intensity = m.totalCharges / maxCharges
          return (
            <motion.button
              key={m.month}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedMonth(m.month === selectedMonth ? null : m.month)}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative overflow-hidden ${cfg.bg} ${
                selectedMonth === m.month ? 'ring-2 ring-white/30 scale-105' : 'hover:scale-[1.03]'
              } ${m.isCurrent ? 'ring-1 ring-brand/40' : ''}`}
            >
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/[0.03]">
                <motion.div
                  className="h-full bg-white/10"
                  initial={{ width: 0 }}
                  animate={{ width: `${intensity * 100}%` }}
                  transition={{ delay: i * 0.05 + 0.3, duration: 0.4 }}
                />
              </div>
              <div className="text-[10px] font-medium text-text-secondary">{m.label}</div>
              <div className={`text-base font-bold mt-0.5 tabular-nums ${cfg.text}`}>
                {formatCurrency(m.totalCharges)}
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                {cfg.icon}
                {m.hasSpecial && <span className="text-[8px] text-text-muted">+</span>}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[10px] text-text-muted justify-center">
        <div className="flex items-center gap-1.5">
          <TrendingDown size={10} className="text-success" /> {t('calendar.lighter')}
        </div>
        <div className="flex items-center gap-1.5">
          <Minus size={10} className="text-text-muted" /> {t('calendar.stable')}
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp size={10} className="text-danger" /> {t('calendar.heavier')}
        </div>
      </div>

      {/* Detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.month}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">{selected.label}</h2>
                <button
                  onClick={() => setSelectedMonth(null)}
                  className="p-1 text-text-muted hover:text-white"
                  aria-label={t('common.close')}
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-3 mb-4">
                <div className="text-[10px] text-text-muted uppercase tracking-wider">{t('calendar.totalCharges')}</div>
                <div className={`text-lg font-bold tabular-nums ${statusConfig[selected.status].text}`}>
                  {formatCurrency(selected.totalCharges)}
                </div>
                {months[0] && selected.month !== months[0].month && (
                  <div className="text-[10px] text-text-muted mt-1">
                    {selected.totalCharges < months[0].totalCharges
                      ? `${formatCurrency(months[0].totalCharges - selected.totalCharges)} ${t('calendar.lessVsCurrent')}`
                      : selected.totalCharges > months[0].totalCharges
                        ? `+${formatCurrency(selected.totalCharges - months[0].totalCharges)} ${t('calendar.moreVsCurrent')}`
                        : t('calendar.sameAsCurrent')
                    }
                  </div>
                )}
              </div>

              {/* Payer filter — couple mode */}
              {household?.personBName && (
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {([
                    { value: null, label: t('common.all') },
                    { value: PAYER.Common, label: t('common.common') },
                    { value: PAYER.PersonA, label: household.personAName },
                    { value: PAYER.PersonB, label: household.personBName },
                  ] satisfies { value: Payer | null; label: string }[]).map((opt) => (
                    <button
                      key={opt.value ?? 'all'}
                      onClick={() => setCalPayerFilter(calPayerFilter === opt.value ? null : opt.value)}
                      className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                        calPayerFilter === opt.value
                          ? 'bg-brand/15 text-brand border border-brand/30'
                          : 'bg-white/[0.04] text-text-muted border border-white/[0.08]'
                      }`}
                      style={calPayerFilter === opt.value && opt.value === 'person_a' ? { backgroundColor: `${household.personAColor}15`, color: household.personAColor, borderColor: `${household.personAColor}40` } :
                             calPayerFilter === opt.value && opt.value === 'person_b' ? { backgroundColor: `${household.personBColor}15`, color: household.personBColor, borderColor: `${household.personBColor}40` } : undefined}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {(() => {
                const filteredCharges = calPayerFilter
                  ? selected.result.charges.filter((c) => c.payer === calPayerFilter)
                  : selected.result.charges
                const filteredTotal = filteredCharges.reduce((s, c) => s + c.amount, 0)
                const filteredCats: Record<string, number> = {}
                filteredCharges.forEach((c) => {
                  const key = c.category || 'autre'
                  filteredCats[key] = (filteredCats[key] || 0) + c.amount
                })
                const catList = Object.entries(filteredCats)
                  .map(([name, value]) => ({ name, label: getCategoryLabel(name), value: value as number }))
                  .sort((a, b) => b.value - a.value)

                return (
                  <>
                    {catList.length > 0 && (
                      <div className="border-t border-white/[0.06] pt-3 mb-3">
                        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">{t('calendar.byCategory')}</div>
                        <div className="space-y-2">
                          {catList.map((cat) => (
                            <div key={cat.name}>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-text-secondary">{cat.label}</span>
                                <span className="tabular-nums text-text-muted">{formatCurrency(cat.value)}</span>
                              </div>
                              <ProgressBar value={cat.value} max={filteredTotal} color="#6C63FF" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredCharges.length > 0 && (
                      <div className="border-t border-white/[0.06] pt-3">
                        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">{t('calendar.chargesLabel')}</div>
                        {[...filteredCharges].sort((a, b) => (PAYER_ORDER[a.payer] ?? 9) - (PAYER_ORDER[b.payer] ?? 9) || b.amount - a.amount).map((c) => (
                          <div key={c.id} className="flex justify-between text-sm py-1">
                            <span className="text-text-secondary truncate">
                              {c.name}
                              {household?.personBName && (
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded-full ml-1.5"
                                  style={c.payer === 'common'
                                    ? { backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)' }
                                    : { backgroundColor: `${c.payer === 'person_a' ? household.personAColor : household.personBColor}15`, color: c.payer === 'person_a' ? household.personAColor : household.personBColor }
                                  }
                                >
                                  {c.payer === 'common' ? t('common.common') : c.payer === 'person_a' ? household.personAName : household.personBName}
                                </span>
                              )}
                              {c.type === 'installment' && <span className="text-[9px] text-brand ml-1">{t('calendar.installmentBadge')}</span>}
                              {c.type === 'planned' && <span className="text-[9px] text-warning ml-1">{t('calendar.plannedBadge')}</span>}
                            </span>
                            <span className="tabular-nums ml-2">{formatCurrency(c.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {filteredCharges.length === 0 && calPayerFilter && (
                      <p className="text-sm text-text-muted text-center py-4">{t('charges.noResults')}</p>
                    )}
                  </>
                )
              })()}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

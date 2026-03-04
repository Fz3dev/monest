import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { computeMonth } from '../utils/calculations'
import { formatCurrency, formatMonthShort, getCurrentMonth, CATEGORIES } from '../utils/format'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import { addMonths, format } from 'date-fns'
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown } from 'lucide-react'

export default function CalendarPage() {
  const household = useHouseholdStore((s) => s.household)
  const { fixedCharges, installmentPayments, plannedExpenses } = useChargesStore()
  const entries = useMonthlyStore((s) => s.entries)
  const [selectedMonth, setSelectedMonth] = useState(null)

  const months = useMemo(() => {
    const current = getCurrentMonth()
    const results = []
    for (let i = 0; i < 12; i++) {
      const m = format(addMonths(new Date(current + '-01'), i), 'yyyy-MM')
      const entry = entries[m] || null
      const result = computeMonth(m, household, fixedCharges, installmentPayments, plannedExpenses, entry)
      const totalCharges = result.totalCommon + result.personalACharges + result.personalBCharges

      let status = 'green'
      if (result.resteFoyer < 500) status = 'red'
      else if (result.resteFoyer < 1500) status = 'yellow'

      // Category breakdown for detail view
      const catBreakdown = {}
      result.charges.forEach((c) => {
        const key = c.category || 'autre'
        catBreakdown[key] = (catBreakdown[key] || 0) + c.amount
      })

      results.push({
        month: m,
        label: formatMonthShort(m),
        result,
        totalCharges,
        status,
        hasSpecial: result.charges.some((c) => c.type === 'installment' || c.type === 'planned'),
        catBreakdown: Object.entries(catBreakdown)
          .map(([name, value]) => ({ name, label: CATEGORIES.find((c) => c.value === name)?.label || name, value }))
          .sort((a, b) => b.value - a.value),
        isCurrent: m === current,
      })
    }
    return results
  }, [household, fixedCharges, installmentPayments, plannedExpenses, entries])

  const selected = selectedMonth ? months.find((m) => m.month === selectedMonth) : null

  // Find max charges for relative intensity
  const maxCharges = useMemo(() => {
    return Math.max(...months.map((m) => m.totalCharges), 1)
  }, [months])

  const statusConfig = {
    green: {
      bg: 'bg-success/10 border-success/20',
      text: 'text-success',
      icon: <CheckCircle2 size={10} className="text-success" />,
    },
    yellow: {
      bg: 'bg-warning/10 border-warning/20',
      text: 'text-warning',
      icon: <AlertTriangle size={10} className="text-warning" />,
    },
    red: {
      bg: 'bg-danger/10 border-danger/20',
      text: 'text-danger',
      icon: <XCircle size={10} className="text-danger" />,
    },
  }

  return (
    <div className="space-y-4">
      <motion.h1
        className="text-2xl font-bold"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        Calendrier previsionnel
      </motion.h1>

      <div className="grid grid-cols-4 gap-2">
        {months.map((m, i) => {
          const cfg = statusConfig[m.status]
          // Spending intensity: darker = more charges relative to max
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
              {/* Intensity bar at bottom */}
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
                {formatCurrency(m.result.resteFoyer)}
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
          <CheckCircle2 size={10} className="text-success" /> &gt; 1 500 €
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={10} className="text-warning" /> 500–1 500 €
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle size={10} className="text-danger" /> &lt; 500 €
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
                  aria-label="Fermer"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {/* Summary numbers */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/[0.03] rounded-xl p-3">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">Reste foyer</div>
                  <div className={`text-lg font-bold tabular-nums ${statusConfig[selected.status].text}`}>
                    {formatCurrency(selected.result.resteFoyer)}
                  </div>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">Total charges</div>
                  <div className="text-lg font-bold tabular-nums text-text-primary">
                    {formatCurrency(selected.totalCharges)}
                  </div>
                </div>
              </div>

              {/* Person breakdown */}
              <div className="space-y-2 mb-4">
                {household?.personAName && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: household.personAColor }}>{household.personAName}</span>
                    <span className="tabular-nums">{formatCurrency(selected.result.resteA)}</span>
                  </div>
                )}
                {household?.personBName && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: household.personBColor }}>{household.personBName}</span>
                    <span className="tabular-nums">{formatCurrency(selected.result.resteB)}</span>
                  </div>
                )}
              </div>

              {/* Category breakdown with progress bars */}
              {selected.catBreakdown.length > 0 && (
                <div className="border-t border-white/[0.06] pt-3 mb-3">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Par categorie</div>
                  <div className="space-y-2">
                    {selected.catBreakdown.map((cat) => (
                      <div key={cat.name}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-text-secondary">{cat.label}</span>
                          <span className="tabular-nums text-text-muted">{formatCurrency(cat.value)}</span>
                        </div>
                        <ProgressBar value={cat.value} max={selected.totalCharges} color="#6C63FF" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual charges */}
              {selected.result.charges.length > 0 && (
                <div className="border-t border-white/[0.06] pt-3">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Charges</div>
                  {selected.result.charges.map((c) => (
                    <div key={c.id} className="flex justify-between text-sm py-1">
                      <span className="text-text-secondary truncate">
                        {c.name}
                        {c.type === 'installment' && <span className="text-[9px] text-brand ml-1">ech.</span>}
                        {c.type === 'planned' && <span className="text-[9px] text-warning ml-1">prevu</span>}
                      </span>
                      <span className="tabular-nums ml-2">{formatCurrency(c.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

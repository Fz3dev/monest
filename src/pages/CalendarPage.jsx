import { useMemo } from 'react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { computeMonth } from '../utils/calculations'
import { formatCurrency, formatMonthShort, getCurrentMonth } from '../utils/format'
import Card from '../components/ui/Card'
import { addMonths, format } from 'date-fns'
import { useState } from 'react'

export default function CalendarPage() {
  const household = useHouseholdStore((s) => s.household)
  const { fixedCharges, installmentPayments, plannedExpenses } = useChargesStore()
  const getEntry = useMonthlyStore((s) => s.getEntry)
  const [selectedMonth, setSelectedMonth] = useState(null)

  const months = useMemo(() => {
    const current = getCurrentMonth()
    const results = []
    for (let i = 0; i < 12; i++) {
      const m = format(addMonths(new Date(current + '-01'), i), 'yyyy-MM')
      const entry = getEntry(m)
      const result = computeMonth(m, household, fixedCharges, installmentPayments, plannedExpenses, entry)
      const totalCharges = result.totalCommon + result.personalACharges + result.personalBCharges

      let status = 'green'
      if (result.resteFoyer < 500) status = 'red'
      else if (result.resteFoyer < 1500) status = 'yellow'

      results.push({
        month: m,
        label: formatMonthShort(m),
        result,
        totalCharges,
        status,
        hasSpecial: result.charges.some((c) => c.type === 'installment' || c.type === 'planned'),
      })
    }
    return results
  }, [household, fixedCharges, installmentPayments, plannedExpenses, getEntry])

  const selected = selectedMonth ? months.find((m) => m.month === selectedMonth) : null

  const statusColors = {
    green: 'bg-green-500/20 border-green-500/40 text-green-400',
    yellow: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
    red: 'bg-red-500/20 border-red-500/40 text-red-400',
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Calendrier prévisionnel</h1>

      {/* Grid 12 months */}
      <div className="grid grid-cols-4 gap-2">
        {months.map((m) => (
          <button
            key={m.month}
            onClick={() => setSelectedMonth(m.month === selectedMonth ? null : m.month)}
            className={`p-3 rounded-xl border text-center transition-all ${
              statusColors[m.status]
            } ${selectedMonth === m.month ? 'ring-2 ring-white scale-105' : 'hover:scale-102'}`}
          >
            <div className="text-xs font-medium">{m.label}</div>
            <div className="text-lg font-bold mt-1">{formatCurrency(m.result.resteFoyer)}</div>
            {m.hasSpecial && <div className="text-xs mt-1">*</div>}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-slate-400 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500/30" /> &gt; 1 500 €
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500/30" /> 500-1 500 €
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/30" /> &lt; 500 €
        </div>
      </div>

      {/* Selected month detail */}
      {selected && (
        <Card>
          <h2 className="font-semibold mb-3">{selected.label}</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Reste foyer</span>
              <span className="font-bold">{formatCurrency(selected.result.resteFoyer)}</span>
            </div>
            {household?.personAName && (
              <div className="flex justify-between text-sm">
                <span style={{ color: household.personAColor }}>{household.personAName}</span>
                <span>{formatCurrency(selected.result.resteA)}</span>
              </div>
            )}
            {household?.personBName && (
              <div className="flex justify-between text-sm">
                <span style={{ color: household.personBColor }}>{household.personBName}</span>
                <span>{formatCurrency(selected.result.resteB)}</span>
              </div>
            )}

            {selected.result.charges.length > 0 && (
              <>
                <div className="border-t border-slate-700 pt-2 mt-2">
                  <div className="text-xs text-slate-500 mb-2">Charges ce mois</div>
                  {selected.result.charges.map((c) => (
                    <div key={c.id} className="flex justify-between text-sm py-1">
                      <span className="text-slate-300">
                        {c.name}
                        {c.type === 'installment' && (
                          <span className="text-xs text-slate-500 ml-1">échéancier</span>
                        )}
                        {c.type === 'planned' && (
                          <span className="text-xs text-amber-500 ml-1">prévu</span>
                        )}
                      </span>
                      <span>{formatCurrency(c.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

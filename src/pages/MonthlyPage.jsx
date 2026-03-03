import { useState, useMemo } from 'react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { computeMonth } from '../utils/calculations'
import { formatCurrency, formatMonth, getCurrentMonth } from '../utils/format'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, subMonths, format } from 'date-fns'

export default function MonthlyPage() {
  const household = useHouseholdStore((s) => s.household)
  const { fixedCharges, installmentPayments, plannedExpenses } = useChargesStore()
  const { getEntry, setEntry, updateVariable } = useMonthlyStore()

  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())

  const entry = getEntry(currentMonth) || {}
  const result = useMemo(
    () => computeMonth(currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entry),
    [currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entry]
  )

  const navigateMonth = (direction) => {
    const date = new Date(currentMonth + '-01')
    const newDate = direction === 'next' ? addMonths(date, 1) : subMonths(date, 1)
    setCurrentMonth(format(newDate, 'yyyy-MM'))
  }

  const handleIncomeChange = (field, value) => {
    const num = parseFloat(value) || 0
    setEntry(currentMonth, { ...entry, [field]: num })
  }

  const getResteColor = (reste) => {
    if (reste >= 1500) return 'text-green-400'
    if (reste >= 500) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigateMonth('prev')} className="p-2 text-slate-400 hover:text-white">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">{formatMonth(currentMonth)}</h1>
        <button onClick={() => navigateMonth('next')} className="p-2 text-slate-400 hover:text-white">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Revenus */}
      <Card>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Revenus</h2>
        <div className="space-y-3">
          <Input
            label={`Salaire ${household?.personAName || 'Personne A'}`}
            type="number"
            value={entry.incomeA || ''}
            onChange={(e) => handleIncomeChange('incomeA', e.target.value)}
            placeholder="0"
            suffix="€"
          />
          {household?.personBName && (
            <Input
              label={`Salaire ${household.personBName}`}
              type="number"
              value={entry.incomeB || ''}
              onChange={(e) => handleIncomeChange('incomeB', e.target.value)}
              placeholder="0"
              suffix="€"
            />
          )}
          <Input
            label={`Remboursement pro ${household?.personAName || ''}`}
            type="number"
            value={entry.proReimbursementA || ''}
            onChange={(e) => handleIncomeChange('proReimbursementA', e.target.value)}
            placeholder="0"
            suffix="€"
          />
        </div>
      </Card>

      {/* Charges */}
      <Card>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Charges du mois</h2>
        <div className="space-y-2">
          {result.charges.map((charge) => (
            <div key={charge.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
              <div className="flex items-center gap-2 flex-1">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      charge.payer === 'person_a'
                        ? household?.personAColor
                        : charge.payer === 'person_b'
                          ? household?.personBColor
                          : '#64748b',
                  }}
                />
                <span className="text-sm text-slate-300 truncate">{charge.name}</span>
              </div>
              {charge.type === 'fixed' ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={
                      entry.variableOverrides?.[charge.id] !== undefined
                        ? entry.variableOverrides[charge.id]
                        : charge.originalAmount
                    }
                    onChange={(e) =>
                      updateVariable(currentMonth, charge.id, parseFloat(e.target.value) || 0)
                    }
                    className="w-24 text-right bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                  />
                  <span className="text-sm text-slate-500">€</span>
                </div>
              ) : (
                <span className="text-sm font-medium">{formatCurrency(charge.amount)}</span>
              )}
            </div>
          ))}

          {result.charges.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">
              Aucune charge configurée. Ajoutez-en dans l'onglet Charges.
            </p>
          )}
        </div>
      </Card>

      {/* Reste à vivre */}
      <Card className="border-brand/30">
        <h2 className="text-sm font-medium text-slate-400 mb-3">Reste à vivre</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span style={{ color: household?.personAColor }}>{household?.personAName}</span>
            <span className={`text-xl font-bold ${getResteColor(result.resteA)}`}>
              {formatCurrency(result.resteA)}
            </span>
          </div>
          {household?.personBName && (
            <div className="flex justify-between items-center">
              <span style={{ color: household?.personBColor }}>{household.personBName}</span>
              <span className={`text-xl font-bold ${getResteColor(result.resteB)}`}>
                {formatCurrency(result.resteB)}
              </span>
            </div>
          )}
          <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
            <span className="text-slate-300 font-medium">Foyer</span>
            <span className={`text-2xl font-bold ${getResteColor(result.resteFoyer)}`}>
              {formatCurrency(result.resteFoyer)}
            </span>
          </div>
        </div>
      </Card>

      {/* Details */}
      {household?.personBName && (
        <Card>
          <h2 className="text-sm font-medium text-slate-400 mb-3">Répartition</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Charges communes</span>
              <span>{formatCurrency(result.totalCommon)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: household?.personAColor }}>
                Part {household.personAName} ({Math.round((household.splitRatio || 0.5) * 100)}%)
              </span>
              <span>{formatCurrency(result.shareA)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: household?.personBColor }}>
                Part {household.personBName} ({Math.round((1 - (household.splitRatio || 0.5)) * 100)}%)
              </span>
              <span>{formatCurrency(result.shareB)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

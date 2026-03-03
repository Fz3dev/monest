import { useMemo } from 'react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { computeMonth } from '../utils/calculations'
import { formatCurrency, formatMonth, getCurrentMonth, formatMonthShort } from '../utils/format'
import Card from '../components/ui/Card'
import { addMonths, format } from 'date-fns'

export default function DashboardPage() {
  const household = useHouseholdStore((s) => s.household)
  const { fixedCharges, installmentPayments, plannedExpenses } = useChargesStore()
  const getEntry = useMonthlyStore((s) => s.getEntry)

  const currentMonth = getCurrentMonth()
  const entry = getEntry(currentMonth)

  const result = useMemo(
    () => computeMonth(currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entry),
    [currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entry]
  )

  // Preview next 3 months for alerts
  const alerts = useMemo(() => {
    const items = []
    for (let i = 1; i <= 3; i++) {
      const m = format(addMonths(new Date(), i), 'yyyy-MM')
      const futureEntry = getEntry(m)
      const futureResult = computeMonth(m, household, fixedCharges, installmentPayments, plannedExpenses, futureEntry)
      const totalCharges = futureResult.totalCommon + futureResult.personalACharges + futureResult.personalBCharges
      const heavyCharges = futureResult.charges.filter((c) => c.type === 'installment' || c.type === 'planned')
      if (heavyCharges.length > 0) {
        items.push({
          month: m,
          label: formatMonthShort(m),
          details: heavyCharges.map((c) => `${c.name}: ${formatCurrency(c.amount)}`).join(' + '),
          total: totalCharges,
        })
      }
    }
    return items
  }, [household, fixedCharges, installmentPayments, plannedExpenses, getEntry])

  const hasIncome = result.incomeA > 0 || result.incomeB > 0

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{formatMonth(currentMonth)}</h1>

      {!hasIncome && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <p className="text-amber-300 text-sm">
            Saisissez vos revenus du mois dans l'onglet Mensuel pour voir votre reste à vivre.
          </p>
        </Card>
      )}

      {/* Reste à vivre cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-sm text-slate-400 mb-1">{household?.personAName || 'Personne A'}</div>
          <div
            className="text-2xl font-bold"
            style={{ color: household?.personAColor || '#6366f1' }}
          >
            {formatCurrency(result.resteA)}
          </div>
          <div className="text-xs text-slate-500 mt-1">ce mois</div>
        </Card>

        {household?.personBName && (
          <Card>
            <div className="text-sm text-slate-400 mb-1">{household.personBName}</div>
            <div
              className="text-2xl font-bold"
              style={{ color: household?.personBColor || '#ec4899' }}
            >
              {formatCurrency(result.resteB)}
            </div>
            <div className="text-xs text-slate-500 mt-1">ce mois</div>
          </Card>
        )}
      </div>

      <Card>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-slate-400">Reste foyer</div>
            <div className="text-3xl font-bold text-white">{formatCurrency(result.resteFoyer)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Charges communes</div>
            <div className="text-lg text-slate-300">{formatCurrency(result.totalCommon)}</div>
          </div>
        </div>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-amber-500/30">
          <div className="text-sm font-medium text-amber-400 mb-2">Mois chargés à venir</div>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.month} className="text-sm text-slate-300">
                <span className="font-medium">{alert.label}</span> : {alert.details}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charges summary */}
      {result.charges.length > 0 && (
        <Card>
          <div className="text-sm font-medium text-slate-400 mb-3">Détail des charges</div>
          <div className="space-y-2">
            {result.charges.map((charge) => (
              <div key={charge.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        charge.payer === 'person_a'
                          ? household?.personAColor
                          : charge.payer === 'person_b'
                            ? household?.personBColor
                            : '#64748b',
                    }}
                  />
                  <span className="text-slate-300">{charge.name}</span>
                  {charge.type === 'installment' && (
                    <span className="text-xs text-slate-500">échéancier</span>
                  )}
                  {charge.type === 'planned' && (
                    <span className="text-xs text-amber-500">prévu</span>
                  )}
                </div>
                <span className="font-medium">{formatCurrency(charge.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

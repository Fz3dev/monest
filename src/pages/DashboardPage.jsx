import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { computeMonth } from '../utils/calculations'
import { formatCurrency, formatMonth, getCurrentMonth, formatMonthShort } from '../utils/format'
import Card from '../components/ui/Card'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import { addMonths, format } from 'date-fns'
import { AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const PIE_COLORS = ['#6C63FF', '#F87171', '#FBBF24', '#4ADE80', '#818CF8', '#FB923C', '#38BDF8', '#A78BFA']

export default function DashboardPage() {
  const household = useHouseholdStore((s) => s.household)
  const { fixedCharges, installmentPayments, plannedExpenses } = useChargesStore()
  const entries = useMonthlyStore((s) => s.entries)

  const currentMonth = getCurrentMonth()
  const entry = entries[currentMonth] || null

  const result = useMemo(
    () => computeMonth(currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entry),
    [currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entry]
  )

  const alerts = useMemo(() => {
    const items = []
    for (let i = 1; i <= 3; i++) {
      const m = format(addMonths(new Date(), i), 'yyyy-MM')
      const futureEntry = entries[m] || null
      const r = computeMonth(m, household, fixedCharges, installmentPayments, plannedExpenses, futureEntry)
      const heavyCharges = r.charges.filter((c) => c.type === 'installment' || c.type === 'planned')
      if (heavyCharges.length > 0) {
        items.push({
          month: m,
          label: formatMonthShort(m),
          details: heavyCharges.map((c) => `${c.name}: ${formatCurrency(c.amount)}`).join(', '),
        })
      }
    }
    return items
  }, [household, fixedCharges, installmentPayments, plannedExpenses, entries])

  const hasIncome = result.incomeA > 0 || result.incomeB > 0

  const getHealthColor = (val) => {
    if (val >= 1500) return 'text-success'
    if (val >= 500) return 'text-warning'
    return 'text-danger'
  }

  const getHealthIcon = (val) => {
    if (val >= 1000) return <ArrowUpRight size={14} className="text-success" />
    if (val >= 0) return <TrendingUp size={14} className="text-warning" />
    return <ArrowDownRight size={14} className="text-danger" />
  }

  const categoryData = useMemo(() => {
    const cats = {}
    result.charges.forEach((c) => {
      const key = c.category || 'autre'
      cats[key] = (cats[key] || 0) + c.amount
    })
    return Object.entries(cats).map(([name, value]) => ({ name, value }))
  }, [result.charges])

  return (
    <div className="space-y-4">
      <motion.h1
        className="text-2xl font-bold"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {formatMonth(currentMonth)}
      </motion.h1>

      {!hasIncome && (
        <Card className="!border-warning/20 !bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-warning mt-0.5 flex-shrink-0" />
            <p className="text-warning/90 text-sm">
              Saisissez vos revenus dans l'onglet <strong>Mensuel</strong> pour voir votre reste a vivre.
            </p>
          </div>
        </Card>
      )}

      {/* Hero card */}
      <Card className="glass !border-brand/20">
        <div className="text-center py-2">
          <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Reste a vivre foyer</div>
          <div className={`text-4xl font-bold tracking-tight ${getHealthColor(result.resteFoyer)}`}>
            <AnimatedNumber value={result.resteFoyer} format={(v) => formatCurrency(Math.round(v))} />
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-text-secondary">
            {getHealthIcon(result.resteFoyer)}
            <span>Charges : {formatCurrency(result.totalCommon)}</span>
          </div>
        </div>
      </Card>

      {/* Person cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-xs text-text-secondary mb-1">{household?.personAName || 'Personne A'}</div>
          <div className="text-2xl font-bold" style={{ color: household?.personAColor }}>
            <AnimatedNumber value={result.resteA} format={(v) => formatCurrency(Math.round(v))} />
          </div>
          <div className="flex items-center gap-1 mt-1">
            {getHealthIcon(result.resteA)}
            <span className="text-[10px] text-text-muted">ce mois</span>
          </div>
        </Card>
        {household?.personBName && (
          <Card>
            <div className="text-xs text-text-secondary mb-1">{household.personBName}</div>
            <div className="text-2xl font-bold" style={{ color: household?.personBColor }}>
              <AnimatedNumber value={result.resteB} format={(v) => formatCurrency(Math.round(v))} />
            </div>
            <div className="flex items-center gap-1 mt-1">
              {getHealthIcon(result.resteB)}
              <span className="text-[10px] text-text-muted">ce mois</span>
            </div>
          </Card>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="!border-warning/15">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-warning" />
            <span className="text-[10px] font-bold text-warning uppercase tracking-widest">Mois charges</span>
          </div>
          <div className="space-y-1.5">
            {alerts.map((a) => (
              <div key={a.month} className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">{a.label}</span> — {a.details}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charges breakdown */}
      {result.charges.length > 0 && (
        <Card>
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">
            Detail des charges
          </div>

          {categoryData.length > 1 && (
            <div className="flex justify-center mb-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="space-y-2">
            {result.charges.map((charge) => (
              <div key={charge.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        charge.payer === 'person_a' ? household?.personAColor
                        : charge.payer === 'person_b' ? household?.personBColor
                        : '#6C63FF',
                    }}
                  />
                  <span className="text-text-secondary truncate">{charge.name}</span>
                  {charge.type === 'installment' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand/10 text-brand flex-shrink-0">ech.</span>
                  )}
                  {charge.type === 'planned' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning flex-shrink-0">prevu</span>
                  )}
                </div>
                <span className="font-medium tabular-nums ml-2">{formatCurrency(charge.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

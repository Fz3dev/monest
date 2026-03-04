import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { computeMonth } from '../utils/calculations'
import { generateInsights } from '../utils/insights'
import { formatCurrency, formatMonth, getCurrentMonth, formatMonthShort, CATEGORIES } from '../utils/format'
import Card from '../components/ui/Card'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import ProgressBar from '../components/ui/ProgressBar'
import { subMonths, format } from 'date-fns'
import {
  AlertTriangle, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Wallet, PiggyBank, Lightbulb, ShieldCheck, ShieldAlert,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts'

const PIE_COLORS = ['#6C63FF', '#F87171', '#FBBF24', '#4ADE80', '#818CF8', '#FB923C', '#38BDF8', '#A78BFA', '#F472B6', '#34D399', '#E879F9', '#FCA5A5']

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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 shadow-xl text-xs">
      <div className="text-text-secondary mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.color }} />
          <span className="text-text-primary font-medium">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

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

  // 6-month trend data
  const trendData = useMemo(() => {
    const data = []
    for (let i = 5; i >= 0; i--) {
      const m = format(subMonths(new Date(), i), 'yyyy-MM')
      const e = entries[m] || null
      const r = computeMonth(m, household, fixedCharges, installmentPayments, plannedExpenses, e)
      const totalCharges = r.totalCommon + r.personalACharges + r.personalBCharges
      data.push({
        month: formatMonthShort(m),
        reste: Math.max(r.resteFoyer, 0),
        charges: totalCharges,
      })
    }
    return data
  }, [household, fixedCharges, installmentPayments, plannedExpenses, entries])

  // Alerts for next 3 months
  const alerts = useMemo(() => {
    const items = []
    for (let i = 1; i <= 3; i++) {
      const m = format(subMonths(new Date(), -i), 'yyyy-MM')
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

  // Spending insights
  const insights = useMemo(() => {
    return generateInsights(currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entries)
  }, [currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entries])

  const totalIncome = result.incomeA + result.incomeB + result.proReimbA + result.proReimbB
  const totalCharges = result.totalCommon + result.personalACharges + result.personalBCharges
  const hasIncome = result.incomeA > 0 || result.incomeB > 0
  const savingsRate = totalIncome > 0 ? Math.round((result.resteFoyer / totalIncome) * 100) : 0

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

  // Category breakdown with colors
  const categoryData = useMemo(() => {
    const cats = {}
    result.charges.forEach((c) => {
      const key = c.category || 'autre'
      cats[key] = (cats[key] || 0) + c.amount
    })
    return Object.entries(cats)
      .map(([name, value]) => ({
        name,
        label: CATEGORIES.find((c) => c.value === name)?.label || name,
        value,
        color: CATEGORY_COLORS[name] || '#94A3B8',
      }))
      .sort((a, b) => b.value - a.value)
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
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Wallet size={12} className="text-brand" />
              <span>{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <TrendingDown size={12} className="text-danger" />
              <span>{formatCurrency(totalCharges)}</span>
            </div>
            {hasIncome && (
              <div className="flex items-center gap-1.5 text-xs">
                <PiggyBank size={12} className={savingsRate >= 20 ? 'text-success' : savingsRate >= 10 ? 'text-warning' : 'text-danger'} />
                <span className={savingsRate >= 20 ? 'text-success' : savingsRate >= 10 ? 'text-warning' : 'text-danger'}>
                  {savingsRate}%
                </span>
              </div>
            )}
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

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="text-brand" />
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Insights</span>
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                {insight.type === 'positive' ? (
                  <ShieldCheck size={14} className="text-success flex-shrink-0 mt-0.5" />
                ) : insight.type === 'warning' ? (
                  <ShieldAlert size={14} className="text-warning flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={14} className="text-danger flex-shrink-0 mt-0.5" />
                )}
                <span className="text-text-secondary">{insight.message}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 6-month trend */}
      {trendData.some((d) => d.reste > 0 || d.charges > 0) && (
        <Card>
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">
            Tendance 6 mois
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={trendData} barGap={2}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="reste" fill="#4ADE80" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="charges" fill="#F87171" radius={[4, 4, 0, 0]} maxBarSize={24} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2 text-[10px] text-text-muted">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success" /> Reste a vivre
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-danger/50" /> Charges
            </div>
          </div>
        </Card>
      )}

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

      {/* Category breakdown with progress bars */}
      {result.charges.length > 0 && (
        <Card>
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">
            Repartition par categorie
          </div>

          {categoryData.length > 1 && (
            <div className="flex justify-center mb-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="space-y-3">
            {categoryData.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between items-center text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-text-secondary">{cat.label}</span>
                  </div>
                  <span className="font-medium tabular-nums">{formatCurrency(cat.value)}</span>
                </div>
                <ProgressBar value={cat.value} max={totalCharges} color={cat.color} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charges detail */}
      {result.charges.length > 0 && (
        <Card>
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">
            Detail des charges
          </div>
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

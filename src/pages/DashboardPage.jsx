import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { useSavingsStore } from '../stores/savingsStore'
import { useExpenseStore } from '../stores/expenseStore'
import { computeMonth } from '../utils/calculations'
import { generateInsights } from '../utils/insights'
import { formatCurrency, formatMonth, getCurrentMonth, formatMonthShort, getCategoryLabel } from '../utils/format'
import { useCategoriesStore } from '../stores/categoriesStore'
import Card from '../components/ui/Card'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import ProgressBar from '../components/ui/ProgressBar'
import DashboardGrid, { EditModeButton } from '../components/dashboard/DashboardGrid'
import { subMonths, format } from 'date-fns'
import {
  AlertTriangle, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Wallet, PiggyBank, Lightbulb, ShieldCheck, ShieldAlert,
  Target, ChevronRight, ShoppingBag,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts'


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
  const { t } = useTranslation()
  const household = useHouseholdStore((s) => s.household)
  const { fixedCharges, installmentPayments, plannedExpenses } = useChargesStore()
  const entries = useMonthlyStore((s) => s.entries)
  const savingsGoals = useSavingsStore((s) => s.goals)
  const expenseStore = useExpenseStore()
  const getCategoryColor = useCategoriesStore((s) => s.getCategoryColor)

  const currentMonth = getCurrentMonth()
  const entry = entries[currentMonth] || null

  const result = useMemo(
    () => computeMonth(currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entry),
    [currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entry]
  )

  const monthExpenses = useMemo(
    () => expenseStore.getTotalByMonth(currentMonth),
    [expenseStore, currentMonth]
  )

  const trendData = useMemo(() => {
    const data = []
    for (let i = 5; i >= 0; i--) {
      const m = format(subMonths(new Date(), i), 'yyyy-MM')
      const e = entries[m] || null
      const r = computeMonth(m, household, fixedCharges, installmentPayments, plannedExpenses, e)
      const tc = r.totalCommon + r.personalACharges + r.personalBCharges
      data.push({
        month: formatMonthShort(m),
        reste: Math.max(r.resteFoyer, 0),
        charges: tc,
      })
    }
    return data
  }, [household, fixedCharges, installmentPayments, plannedExpenses, entries])

  const insights = useMemo(() => {
    return generateInsights(currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entries)
  }, [currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entries])

  const totalIncome = result.incomeA + result.incomeB
  const totalCharges = result.totalCommon + result.personalACharges + result.personalBCharges
  const hasIncome = result.incomeA > 0 || result.incomeB > 0
  const chargesRate = totalIncome > 0 ? Math.round((totalCharges / totalIncome) * 100) : 0
  const flexNumber = result.resteFoyer - monthExpenses

  const getFlexColor = (val) => {
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
    return Object.entries(cats)
      .map(([name, value]) => ({
        name,
        label: getCategoryLabel(name),
        value,
        color: getCategoryColor(name),
      }))
      .sort((a, b) => b.value - a.value)
  }, [result.charges])

  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0)
  const savingsProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  // Build widgets map — only include visible widgets
  const widgets = {}

  // Hero — always visible
  widgets.hero = (
    <Card animate={false} className="glass !border-brand/20 h-full">
      <div className="text-center py-3 lg:py-5">
        <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1 lg:text-xs">
          {household?.configModel === 'solo' ? t('dashboard.remainingSolo') : t('dashboard.remainingCouple')}
        </div>
        <div className={`text-5xl font-black tracking-tight lg:text-6xl ${getFlexColor(flexNumber)}`}>
          <AnimatedNumber value={flexNumber} format={(v) => formatCurrency(Math.round(v))} />
        </div>
        <div className="text-[11px] text-text-muted mt-2 lg:text-sm">{t('dashboard.toSpendThisMonth')}</div>

        <div className="flex items-center justify-center gap-5 mt-4 lg:gap-10 lg:mt-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-text-muted mb-0.5">
              <Wallet size={11} className="text-brand" />
              <span>{t('dashboard.income')}</span>
            </div>
            <span className="text-sm font-semibold lg:text-base">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="w-px h-8 bg-white/[0.08]" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-text-muted mb-0.5">
              <TrendingDown size={11} className="text-danger" />
              <span>{t('dashboard.charges')}</span>
            </div>
            <span className="text-sm font-semibold lg:text-base">{formatCurrency(totalCharges)}</span>
          </div>
          <div className="w-px h-8 bg-white/[0.08]" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-text-muted mb-0.5">
              <ShoppingBag size={11} className="text-warning" />
              <span>{t('dashboard.expense')}</span>
            </div>
            <span className="text-sm font-semibold lg:text-base">{formatCurrency(monthExpenses)}</span>
          </div>
        </div>

        {hasIncome && (
          <div className="mt-4 pt-3 border-t border-white/[0.06] lg:mt-6 lg:pt-4">
            <div className="flex items-center justify-center gap-2">
              <Wallet size={14} className={chargesRate <= 40 ? 'text-success' : chargesRate <= 60 ? 'text-warning' : 'text-danger'} />
              <span className={`text-sm font-semibold ${chargesRate <= 40 ? 'text-success' : chargesRate <= 60 ? 'text-warning' : 'text-danger'}`}>
                {t('dashboard.chargesRate', { rate: chargesRate })}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )

  // Persons — always visible
  widgets.persons = (
    <div className={`grid gap-3 h-full ${household?.personBName ? 'grid-cols-2' : 'grid-cols-1'}`}>
      <Card animate={false} className="h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-text-secondary font-medium">{household?.personAName || t('common.personA')}</div>
          <div className="flex items-center gap-1">{getHealthIcon(result.resteA)}</div>
        </div>
        <div className="text-2xl font-bold lg:text-3xl" style={{ color: household?.personAColor }}>
          <AnimatedNumber value={result.resteA} format={(v) => formatCurrency(Math.round(v))} />
        </div>
        <div className="text-[10px] text-text-muted mb-2">{t('dashboard.remainingToSpend')}</div>
        {hasIncome && (
          <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
            <div className="flex justify-between text-[11px]">
              <span className="text-text-muted">{t('dashboard.personalIncome')}</span>
              <span className="text-text-secondary tabular-nums">{formatCurrency(result.incomeA)}</span>
            </div>
            {result.startingBalanceA !== 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-text-muted">{t('dashboard.startingBalance')}</span>
                <span className={`tabular-nums ${result.startingBalanceA < 0 ? 'text-danger' : 'text-text-secondary'}`}>
                  {formatCurrency(result.startingBalanceA)}
                </span>
              </div>
            )}
            {result.shareA > 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-text-muted">{t('dashboard.commonShare', { percent: Math.round(result.ratio * 100) })}</span>
                <span className="text-danger tabular-nums">- {formatCurrency(Math.round(result.shareA))}</span>
              </div>
            )}
            {result.personalACharges > 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-text-muted">{t('dashboard.personalCharges')}</span>
                <span className="text-danger tabular-nums">- {formatCurrency(result.personalACharges)}</span>
              </div>
            )}
          </div>
        )}
      </Card>
      {household?.personBName && (
        <Card animate={false} className="h-full">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-text-secondary font-medium">{household.personBName}</div>
            <div className="flex items-center gap-1">{getHealthIcon(result.resteB)}</div>
          </div>
          <div className="text-2xl font-bold lg:text-3xl" style={{ color: household?.personBColor }}>
            <AnimatedNumber value={result.resteB} format={(v) => formatCurrency(Math.round(v))} />
          </div>
          <div className="text-[10px] text-text-muted mb-2">{t('dashboard.remainingToSpend')}</div>
          {hasIncome && (
            <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
              <div className="flex justify-between text-[11px]">
                <span className="text-text-muted">{t('dashboard.personalIncome')}</span>
                <span className="text-text-secondary tabular-nums">{formatCurrency(result.incomeB)}</span>
              </div>
              {result.startingBalanceB !== 0 && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted">{t('dashboard.startingBalance')}</span>
                  <span className={`tabular-nums ${result.startingBalanceB < 0 ? 'text-danger' : 'text-text-secondary'}`}>
                    {formatCurrency(result.startingBalanceB)}
                  </span>
                </div>
              )}
              {result.shareB > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted">{t('dashboard.commonShare', { percent: Math.round((1 - result.ratio) * 100) })}</span>
                  <span className="text-danger tabular-nums">- {formatCurrency(Math.round(result.shareB))}</span>
                </div>
              )}
              {result.personalBCharges > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted">{t('dashboard.personalCharges')}</span>
                  <span className="text-danger tabular-nums">- {formatCurrency(result.personalBCharges)}</span>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )

  // Quick links — always visible
  widgets.quickLinks = (
    <div className="grid grid-cols-2 gap-3 h-full lg:grid-cols-4">
      <Link to="/mensuel">
        <Card animate={false} className="hover:border-brand/20 transition-colors cursor-pointer h-full">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-brand" />
            <span className="text-sm font-medium">{t('dashboard.monthly')}</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">{t('dashboard.enterIncome')}</p>
        </Card>
      </Link>
      <Link to="/calendrier">
        <Card animate={false} className="hover:border-brand/20 transition-colors cursor-pointer h-full">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-brand" />
            <span className="text-sm font-medium">{t('dashboard.calendar')}</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">{t('dashboard.forecast12Months')}</p>
        </Card>
      </Link>
      <Link to="/import" className="hidden lg:block">
        <Card animate={false} className="hover:border-brand/20 transition-colors cursor-pointer h-full">
          <div className="flex items-center gap-2">
            <ArrowUpRight size={16} className="text-brand" />
            <span className="text-sm font-medium">{t('dashboard.import')}</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">{t('dashboard.importCSV')}</p>
        </Card>
      </Link>
      <Link to="/depenses" className="hidden lg:block">
        <Card animate={false} className="hover:border-brand/20 transition-colors cursor-pointer h-full">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-brand" />
            <span className="text-sm font-medium">{t('dashboard.expensesLink')}</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">{t('dashboard.viewAll')}</p>
        </Card>
      </Link>
    </div>
  )

  // Savings — conditional
  if (savingsGoals.length > 0) {
    widgets.savings = (
      <Link to="/epargne" className="block h-full">
        <Card animate={false} className="hover:border-brand/20 transition-colors cursor-pointer h-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-brand" />
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('dashboard.goals')}</span>
            </div>
            <ChevronRight size={14} className="text-text-muted" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-text-secondary">{formatCurrency(totalSaved)}</span>
                <span className="text-text-muted">{formatCurrency(totalTarget)}</span>
              </div>
              <ProgressBar value={totalSaved} max={totalTarget} color="#6C63FF" />
            </div>
            <span className="text-lg font-bold text-brand">{savingsProgress}%</span>
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {savingsGoals.slice(0, 4).map((goal) => (
              <div key={goal.id} className="flex items-center gap-1.5 bg-white/[0.04] rounded-lg px-2.5 py-1.5 flex-shrink-0">
                <span className="text-sm">{goal.icon || '\u{1F4B0}'}</span>
                <span className="text-[11px] text-text-secondary">{goal.name}</span>
                <span className="text-[10px] text-text-muted">
                  {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </Link>
    )
  }

  // Insights — conditional
  if (insights.length > 0) {
    widgets.insights = (
      <Card animate={false} className="h-full">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} className="text-brand" />
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('dashboard.insights')}</span>
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
    )
  }

  // Categories — conditional
  if (result.charges.length > 0) {
    widgets.categories = (
      <Card animate={false} className="h-full overflow-y-auto">
        <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">
          {t('dashboard.categoryBreakdown')}
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
    )
  }

  // Trend — conditional
  if (trendData.some((d) => d.reste > 0 || d.charges > 0)) {
    widgets.trend = (
      <Card animate={false} className="h-full">
        <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">
          {t('dashboard.trend6Months')}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={trendData} barGap={2}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="reste" fill="#4ADE80" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="charges" fill="#F87171" radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center mt-2 text-[10px] text-text-muted">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success" /> {t('dashboard.remainingToLive')}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-danger/50" /> {t('dashboard.charges')}
          </div>
        </div>
      </Card>
    )
  }

  // Charges detail — conditional
  if (result.charges.length > 0) {
    widgets.chargesDetail = (
      <Card animate={false} className="h-full overflow-y-auto">
        <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">
          {t('dashboard.chargesDetail')}
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
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand/10 text-brand flex-shrink-0">{t('dashboard.installmentBadge')}</span>
                )}
                {charge.type === 'planned' && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning flex-shrink-0">{t('dashboard.plannedBadge')}</span>
                )}
              </div>
              <span className="font-medium tabular-nums ml-2">{formatCurrency(charge.amount)}</span>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo-crown.png" alt="Monest" className="w-7 h-7 lg:hidden" />
          <motion.h1
            className="text-2xl font-bold lg:text-3xl"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {formatMonth(currentMonth)}
          </motion.h1>
        </div>
        <EditModeButton />
      </div>

      {!hasIncome && (
        <Card className="!border-warning/20 !bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-warning mt-0.5 flex-shrink-0" />
            <p className="text-warning/90 text-sm" dangerouslySetInnerHTML={{ __html: t('dashboard.noIncomeWarning') }} />
          </div>
        </Card>
      )}

      <DashboardGrid widgets={widgets} />
    </div>
  )
}

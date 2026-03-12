import { useCallback, useMemo, type ReactNode } from 'react'
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
import { calculateStreak, calculateBadges } from '../utils/streaks'
import { formatMonth, getCurrentMonth, formatMonthShort } from '../utils/format'
import { useCategoriesStore } from '../stores/categoriesStore'
import Card from '../components/ui/Card'
import DashboardGrid, { EditModeButton } from '../components/dashboard/DashboardGrid'
import PageHeader from '../components/layout/PageHeader'
import { subMonths, format, getDaysInMonth, getDate } from 'date-fns'
import { AlertTriangle } from 'lucide-react'

// Widget components
import HeroWidget from '../components/dashboard/widgets/HeroWidget'
import PersonsWidget from '../components/dashboard/widgets/PersonsWidget'
import ShortcutsWidget from '../components/dashboard/widgets/ShortcutsWidget'
import BadgesWidget from '../components/dashboard/widgets/BadgesWidget'
import SavingsWidget from '../components/dashboard/widgets/SavingsWidget'
import InsightsWidget from '../components/dashboard/widgets/InsightsWidget'
import CategoriesWidget from '../components/dashboard/widgets/CategoriesWidget'
import ChargesDetailWidget from '../components/dashboard/widgets/ChargesDetailWidget'
import HistoryWidget from '../components/dashboard/widgets/HistoryWidget'

export default function DashboardPage() {
  const { t } = useTranslation()
  const household = useHouseholdStore((s) => s.household)
  const fixedCharges = useChargesStore((s) => s.fixedCharges)
  const installmentPayments = useChargesStore((s) => s.installmentPayments)
  const plannedExpenses = useChargesStore((s) => s.plannedExpenses)
  const entries = useMonthlyStore((s) => s.entries)
  const savingsGoals = useSavingsStore((s) => s.goals)
  const expenses = useExpenseStore((s) => s.expenses)
  const getCategoryColor = useCategoriesStore((s) => s.getCategoryColor)

  const currentMonth = getCurrentMonth()
  const entry = entries[currentMonth] || null

  const result = useMemo(
    () => computeMonth(currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entry),
    [currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entry]
  )

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date?.startsWith(currentMonth)).reduce((sum, e) => sum + e.amount, 0),
    [expenses, currentMonth]
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

  const streak = useMemo(
    () => calculateStreak(currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entries),
    [currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entries]
  )

  const totalIncome = result.incomeA + result.incomeB
  const totalCharges = result.totalCommon + result.personalACharges + result.personalBCharges
  const hasIncome = result.incomeA > 0 || result.incomeB > 0
  const chargesRate = totalIncome > 0 ? Math.round((totalCharges / totalIncome) * 100) : 0
  const badges = useMemo(
    () => calculateBadges(streak, totalCharges, totalIncome, savingsGoals),
    [streak, totalCharges, totalIncome, savingsGoals]
  )
  const flexNumber = result.resteFoyer - monthExpenses
  const today = new Date()
  const daysLeft = getDaysInMonth(today) - getDate(today) + 1

  const getFlexColor = useCallback((val: number): string => {
    if (val >= 1500) return 'text-success'
    if (val >= 500) return 'text-warning'
    return 'text-danger'
  }, [])

  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0)
  const savingsProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  // Build widgets map — only include visible widgets
  const widgets: Record<string, ReactNode> = {}

  // Hero — always visible
  widgets.hero = (
    <HeroWidget
      configModel={household?.configModel}
      flexNumber={flexNumber}
      daysLeft={daysLeft}
      totalIncome={totalIncome}
      totalCharges={totalCharges}
      monthExpenses={monthExpenses}
      hasIncome={hasIncome}
      chargesRate={chargesRate}
      getFlexColor={getFlexColor}
    />
  )

  // Persons — always visible
  widgets.persons = (
    <PersonsWidget
      personAName={household?.personAName || ''}
      personAColor={household?.personAColor || ''}
      personBName={household?.personBName}
      personBColor={household?.personBColor}
      resteA={result.resteA}
      resteB={result.resteB}
      incomeA={result.incomeA}
      incomeB={result.incomeB}
      startingBalanceA={result.startingBalanceA}
      startingBalanceB={result.startingBalanceB}
      shareA={result.shareA}
      shareB={result.shareB}
      personalACharges={result.personalACharges}
      personalBCharges={result.personalBCharges}
      ratio={result.ratio}
      hasIncome={hasIncome}
    />
  )

  // Quick links — always visible
  widgets.quickLinks = <ShortcutsWidget />

  // Streak & Badges
  widgets.streakBadges = <BadgesWidget streak={streak} badges={badges} />

  // Savings — conditional
  if (savingsGoals.length > 0) {
    widgets.savings = (
      <SavingsWidget
        savingsGoals={savingsGoals}
        totalSaved={totalSaved}
        totalTarget={totalTarget}
        savingsProgress={savingsProgress}
      />
    )
  }

  // Insights — conditional
  if (insights.length > 0) {
    widgets.insights = <InsightsWidget insights={insights} />
  }

  // Categories — conditional
  if (result.charges.length > 0) {
    widgets.categories = (
      <CategoriesWidget
        charges={result.charges}
        personAName={household?.personAName || ''}
        personAColor={household?.personAColor || ''}
        personBName={household?.personBName}
        personBColor={household?.personBColor}
        getCategoryColor={getCategoryColor}
      />
    )
  }

  // Trend — conditional
  if (trendData.some((d) => d.reste > 0 || d.charges > 0)) {
    widgets.trend = <HistoryWidget trendData={trendData} />
  }

  // Charges detail — conditional
  if (result.charges.length > 0) {
    widgets.chargesDetail = (
      <ChargesDetailWidget
        charges={result.charges}
        flexNumber={flexNumber}
        personAName={household?.personAName || ''}
        personAColor={household?.personAColor || ''}
        personBName={household?.personBName}
        personBColor={household?.personBColor}
        getCategoryColor={getCategoryColor}
      />
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader rightSlot={<EditModeButton />}>
        <div className="flex items-center gap-2.5">
          <img src="/logo-crown-sm.webp" alt="Monest" className="w-7 h-7 lg:hidden" />
          <motion.h1
            className="text-xl font-bold tracking-tight"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {formatMonth(currentMonth)}
          </motion.h1>
        </div>
      </PageHeader>

      {!hasIncome && (
        <Card className="!border-warning/20 !bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-warning mt-0.5 flex-shrink-0" />
            <p className="text-warning/90 text-sm">
              {(t('dashboard.noIncomeWarning') as string).split(t('dashboard.noIncomeWarningBold') as string).map((part: string, i: number, arr: string[]) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && <Link to="/mensuel" className="font-semibold underline underline-offset-2">{t('dashboard.noIncomeWarningBold')}</Link>}
                </span>
              ))}
            </p>
          </div>
        </Card>
      )}

      <DashboardGrid widgets={widgets} flowWidgetIds={['categories', 'chargesDetail']} />
    </div>
  )
}

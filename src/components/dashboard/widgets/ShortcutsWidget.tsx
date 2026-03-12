import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Card from '../../ui/Card'
import { Wallet, Target, ArrowUpRight, ShoppingBag } from 'lucide-react'

export default memo(function ShortcutsWidget() {
  const { t } = useTranslation()

  return (
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
})

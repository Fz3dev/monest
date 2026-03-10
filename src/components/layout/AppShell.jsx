import { NavLink } from 'react-router-dom'
import { Home, Receipt, CreditCard, PiggyBank, Calendar, Settings, ShoppingBag } from 'lucide-react'
import QuickAddExpense from '../QuickAddExpense'

const navItems = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/depenses', icon: ShoppingBag, label: 'Depenses' },
  { to: '/charges', icon: CreditCard, label: 'Charges' },
  { to: '/epargne', icon: PiggyBank, label: 'Epargne' },
  { to: '/parametres', icon: Settings, label: 'Reglages' },
]

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-20">
      <main className="max-w-lg mx-auto px-4 py-4">{children}</main>

      <QuickAddExpense />

      <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/90 backdrop-blur-xl border-t border-white/[0.06] safe-area-bottom z-40">
        <div className="max-w-lg mx-auto flex justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2.5 px-3 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-brand' : 'text-text-muted hover:text-text-secondary'
                }`
              }
            >
              <item.icon size={20} strokeWidth={1.8} />
              <span className="mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

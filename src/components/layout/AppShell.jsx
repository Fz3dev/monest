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
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-56 lg:flex-col lg:border-r lg:border-white/[0.06] lg:bg-bg-primary z-40">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/[0.06]">
          <img src="/logo-crown.png" alt="Monest" className="w-7 h-7" />
          <span className="text-base font-bold tracking-tight">Monest</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/[0.04]'
                }`
              }
            >
              <item.icon size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="pb-20 lg:pb-0 lg:pl-56">
        <main className="max-w-lg mx-auto px-4 py-4 lg:max-w-5xl lg:px-8 lg:py-6">
          {children}
        </main>
      </div>

      <QuickAddExpense />

      {/* Mobile bottom nav — hidden on desktop */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/90 backdrop-blur-xl border-t border-white/[0.06] safe-area-bottom z-40 lg:hidden">
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

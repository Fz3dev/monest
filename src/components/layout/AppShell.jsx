import { NavLink } from 'react-router-dom'
import { Home, Receipt, CreditCard, Calendar, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/mensuel', icon: Receipt, label: 'Mensuel' },
  { to: '/charges', icon: CreditCard, label: 'Charges' },
  { to: '/calendrier', icon: Calendar, label: 'Calendrier' },
  { to: '/parametres', icon: Settings, label: 'Réglages' },
]

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary pb-20">
      <main className="max-w-lg mx-auto px-4 py-4">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/90 backdrop-blur-xl border-t border-white/[0.06] safe-area-bottom z-40">
        <div className="max-w-lg mx-auto flex justify-around">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2.5 px-3 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-brand' : 'text-text-muted hover:text-text-secondary'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.8} />
              <span className="mt-1">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

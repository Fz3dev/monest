import { NavLink } from 'react-router-dom'
import { Home, Receipt, Calendar, Upload, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/mensuel', icon: Receipt, label: 'Mensuel' },
  { to: '/charges', icon: Settings, label: 'Charges' },
  { to: '/calendrier', icon: Calendar, label: 'Calendrier' },
  { to: '/import', icon: Upload, label: 'Import' },
]

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <main className="max-w-lg mx-auto px-4 py-4">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 safe-area-bottom">
        <div className="max-w-lg mx-auto flex justify-around">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                  isActive ? 'text-brand' : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              <Icon size={20} />
              <span className="mt-1">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

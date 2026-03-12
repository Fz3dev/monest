import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { Home, CreditCard, PiggyBank, Settings, ShoppingBag, Bell, CreditCard as ChargeIcon, Wallet, Trash2, UserPlus, TrendingUp, WifiOff, LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useNotificationStore } from '../../stores/notificationStore'
import { flushOfflineQueue } from '../../lib/syncBridge'
import QuickAddExpense from '../QuickAddExpense'
import NotificationBanner from '../NotificationBanner'
import { checkAndShowWeeklyNotification } from '../../utils/notifications'
import type { AppNotification } from '../../types'

const TYPE_ICONS: Record<string, LucideIcon> = {
  member_joined: UserPlus,
  charge_added: ChargeIcon,
  charge_updated: ChargeIcon,
  charge_deleted: Trash2,
  expense_added: ShoppingBag,
  salary_updated: Wallet,
  savings_updated: TrendingUp,
}

interface NotificationPanelProps {
  onClose: () => void
  bellRef: React.RefObject<HTMLButtonElement | null>
}

function NotificationPanel({ onClose, bellRef }: NotificationPanelProps) {
  const { t } = useTranslation()
  const notifications = useNotificationStore((s) => s.notifications)
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        bellRef?.current && !bellRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, bellRef])

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-bg-surface/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl z-50"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-sm font-semibold text-text-primary">{t('notifications.title')}</span>
        {unreadCount() > 0 && (
          <button
            onClick={() => { markAllAsRead(); }}
            className="text-xs text-brand hover:text-brand/80 transition-colors"
          >
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center text-text-muted text-sm">
          {t('notifications.noNotifications')}
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {notifications.slice(0, 30).map((notif: AppNotification) => {
            const Icon = TYPE_ICONS[notif.type] || Bell
            return (
              <div
                key={notif.id}
                role="button"
                tabIndex={0}
                className={`flex gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-white/[0.03] ${
                  !notif.read ? 'bg-brand/[0.04]' : ''
                }`}
                onClick={() => { if (!notif.read) markAsRead(notif.id) }}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' && !notif.read) markAsRead(notif.id) }}
              >
                <div className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${
                  !notif.read ? 'bg-brand/10 text-brand' : 'bg-white/[0.06] text-text-muted'
                }`}>
                  <Icon size={14} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!notif.read ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p className="text-xs text-text-muted mt-0.5 truncate">{notif.body}</p>
                  )}
                  <p className="text-[11px] text-text-muted mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { locale: fr, addSuffix: true })}
                  </p>
                </div>
                {!notif.read && (
                  <div className="flex-shrink-0 mt-2 w-2 h-2 rounded-full bg-brand" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function NotificationBell() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const bellRef = useRef<HTMLButtonElement>(null)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const count = unreadCount()

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors"
        aria-label={t('notifications.title')}
      >
        <Bell size={18} strokeWidth={1.8} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      {open && <NotificationPanel onClose={() => setOpen(false)} bellRef={bellRef} />}
    </div>
  )
}

function OfflineToasts() {
  const { t } = useTranslation()

  useEffect(() => {
    let offlineToastId: string | number | null = null

    const handleOffline = () => {
      offlineToastId = toast(t('offline.banner'), {
        description: t('offline.syncPending'),
        duration: Infinity,
        icon: <WifiOff size={16} />,
      })
    }

    const handleOnline = async () => {
      if (offlineToastId) {
        toast.dismiss(offlineToastId)
        offlineToastId = null
      }
      const syncId = toast.loading(t('offline.syncing'))
      try {
        const count = await flushOfflineQueue()
        toast.dismiss(syncId)
        if (count > 0) {
          toast.success(t('offline.synced'))
        }
      } catch {
        toast.dismiss(syncId)
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [t])

  return null
}

interface AppShellProps {
  children: React.ReactNode
  memberCount?: number
}

export default function AppShell({ children, memberCount = 0 }: AppShellProps) {
  const { t } = useTranslation()
  const isShared = memberCount >= 2

  // Check for weekly push notification on app open
  useEffect(() => {
    checkAndShowWeeklyNotification()
  }, [])

  const navItems = [
    { to: '/dashboard', icon: Home, label: t('nav.home') },
    { to: '/depenses', icon: ShoppingBag, label: t('nav.expenses') },
    { to: '/charges', icon: CreditCard, label: t('nav.charges') },
    { to: '/epargne', icon: PiggyBank, label: t('nav.savings') },
    { to: '/parametres', icon: Settings, label: t('nav.settings') },
  ]

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary safe-area-top">
      <OfflineToasts />
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-56 lg:flex-col lg:border-r lg:border-white/[0.06] lg:bg-bg-primary z-40">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/[0.06]">
          <img src="/logo-crown-sm.webp" alt="Monest" className="w-7 h-7" />
          <span className="text-base font-bold tracking-tight">Monest</span>
          {isShared && (
            <div className="ml-auto">
              <NotificationBell />
            </div>
          )}
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

      <div className="pb-20 lg:pb-0 lg:pl-56">
        <main className="max-w-lg mx-auto px-4 py-4 lg:max-w-5xl lg:px-8 lg:py-6">
          <NotificationBanner />
          {children}
        </main>
      </div>

      <QuickAddExpense />

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

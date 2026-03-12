import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { AppNotification } from '../types'

interface NotificationState {
  notifications: AppNotification[]
  initialized: boolean

  unreadCount: () => number
  setNotifications: (notifications: AppNotification[]) => void
  addNotification: (notif: AppNotification) => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      initialized: false,

      unreadCount: (): number => get().notifications.filter((n) => !n.read).length,

      setNotifications: (notifications: AppNotification[]) => set({ notifications, initialized: true }),

      addNotification: (notif: AppNotification) =>
        set((state) => ({
          notifications: [notif, ...state.notifications],
        })),

      markAsRead: async (id: string): Promise<void> => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }))
        if (isSupabaseConfigured()) {
          await supabase!.from('notifications').update({ read: true }).eq('id', id)
        }
      },

      markAllAsRead: async (): Promise<void> => {
        const unreadIds = get()
          .notifications.filter((n) => !n.read)
          .map((n) => n.id)
        if (!unreadIds.length) return

        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }))
        if (isSupabaseConfigured()) {
          await supabase!
            .from('notifications')
            .update({ read: true })
            .in('id', unreadIds)
        }
      },
    }),
    {
      name: 'monest-notifications',
      version: 1,
      partialize: (state) => ({ notifications: state.notifications }) as NotificationState,
      migrate: (state) => state as NotificationState,
    }
  )
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      initialized: false,

      unreadCount: () => get().notifications.filter((n) => !n.read).length,

      setNotifications: (notifications) => set({ notifications, initialized: true }),

      addNotification: (notif) =>
        set((state) => ({
          notifications: [notif, ...state.notifications],
        })),

      markAsRead: async (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }))
        if (isSupabaseConfigured()) {
          await supabase.from('notifications').update({ read: true }).eq('id', id)
        }
      },

      markAllAsRead: async () => {
        const unreadIds = get()
          .notifications.filter((n) => !n.read)
          .map((n) => n.id)
        if (!unreadIds.length) return

        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }))
        if (isSupabaseConfigured()) {
          await supabase
            .from('notifications')
            .update({ read: true })
            .in('id', unreadIds)
        }
      },
    }),
    {
      name: 'monest-notifications',
      version: 1,
      partialize: (state) => ({ notifications: state.notifications }),
      migrate: (state) => state,
    }
  )
)

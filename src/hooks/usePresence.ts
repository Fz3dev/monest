import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useHouseholdStore } from '../stores/householdStore'
import { getUserInfo } from '../lib/syncBridge'

export interface PresenceUser {
  userId: string
  name: string
  color: string
  isOnline: boolean
}

export function usePresence(isShared: boolean): PresenceUser[] {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const household = useHouseholdStore((s) => s.household)

  useEffect(() => {
    if (!isShared || !isSupabaseConfigured() || !supabase || !household) return

    const { userId, userName, householdId } = getUserInfo()
    if (!userId || !householdId) return

    const myName = userName || 'User'
    let myColor: string
    if (myName === household.personBName) {
      myColor = household.personBColor || '#6C63FF'
    } else {
      myColor = household.personAColor || '#6C63FF'
    }

    const channel = supabase.channel(`presence:${householdId}`, {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: PresenceUser[] = []

        for (const [key, presences] of Object.entries(state)) {
          const presence = presences[0] as { name?: string; color?: string }
          if (presence) {
            users.push({
              userId: key,
              name: presence.name || 'User',
              color: presence.color || '#6C63FF',
              isOnline: true,
            })
          }
        }
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ name: myName, color: myColor })
        }
      })

    // Re-track on visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        channel.track({ name: myName, color: myColor })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      channel.untrack()
      supabase!.removeChannel(channel)
    }
  }, [isShared, household])

  return onlineUsers
}

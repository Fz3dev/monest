import { supabase, isSupabaseConfigured } from './supabase'

export interface CreateNotificationParams {
  householdId: string
  actorId: string
  type: string
  title: string
  body?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Create a notification for all household members except the actor.
 * If the household has only 1 member (solo), does nothing.
 */
export async function createNotification({
  householdId,
  actorId,
  type,
  title,
  body = null,
  metadata = {},
}: CreateNotificationParams): Promise<void> {
  if (!isSupabaseConfigured() || !householdId || !actorId) return
  if (!supabase) return

  try {
    // Get all household members
    const { data: members, error } = await supabase
      .from('household_members')
      .select('user_id')
      .eq('household_id', householdId)

    if (error || !members) return

    // Solo user — no notifications needed
    if (members.length <= 1) return

    // Create a notification for each member except the actor
    const recipients = members.filter((m: { user_id: string }) => m.user_id !== actorId)
    if (!recipients.length) return

    const rows = recipients.map((m: { user_id: string }) => ({
      household_id: householdId,
      user_id: m.user_id,
      actor_id: actorId,
      type,
      title,
      body,
      metadata,
    }))

    await supabase.from('notifications').insert(rows)

    // Trigger Web Push for recipients (non-blocking, best-effort)
    const recipientIds = recipients.map((m: { user_id: string }) => m.user_id)
    supabase.functions
      .invoke('send-push', {
        body: { user_ids: recipientIds, title, body, url: '/dashboard' },
      })
      .catch(() => {}) // Push is non-critical
  } catch (err) {
    // Notifications are non-critical — never break the app
    console.error('Notification creation error:', err)
  }
}

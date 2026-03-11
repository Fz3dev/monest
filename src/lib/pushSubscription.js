import { supabase, isSupabaseConfigured } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

/**
 * Convert URL-safe base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Check if push notifications are fully supported
 */
export function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !!VAPID_PUBLIC_KEY
  )
}

/**
 * Get the current push subscription, or null
 */
export async function getExistingSubscription() {
  if (!('serviceWorker' in navigator)) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

/**
 * Subscribe the user to push notifications.
 * Stores the subscription in Supabase.
 */
export async function subscribeToPush(userId) {
  if (!isPushSupported() || !isSupabaseConfigured() || !userId) return null

  const registration = await navigator.serviceWorker.ready

  // Check existing subscription
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  // Save to Supabase
  const sub = subscription.toJSON()
  await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: navigator.userAgent.slice(0, 200),
    },
    { onConflict: 'endpoint' }
  )

  return subscription
}

/**
 * Unsubscribe from push notifications.
 * Removes the subscription from the browser and Supabase.
 */
export async function unsubscribeFromPush(userId) {
  if (!('serviceWorker' in navigator) || !isSupabaseConfigured()) return

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    const endpoint = subscription.endpoint
    await subscription.unsubscribe()

    // Remove from Supabase
    if (userId) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint)
    }
  }
}

/**
 * Sync subscription state — call on app load to ensure
 * the subscription in Supabase matches the browser state.
 */
export async function syncPushSubscription(userId) {
  if (!isPushSupported() || !isSupabaseConfigured() || !userId) return

  const subscription = await getExistingSubscription()

  if (subscription && Notification.permission === 'granted') {
    // Re-save to make sure it's current
    const sub = subscription.toJSON()
    await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: navigator.userAgent.slice(0, 200),
      },
      { onConflict: 'endpoint' }
    )
  }
}

import { computeMonth } from './calculations'
import { formatCurrency, getCurrentMonth } from './format'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { useExpenseStore } from '../stores/expenseStore'
import { getDaysInMonth } from 'date-fns'

const STORAGE_KEY_ENABLED = 'monest-notifications-enabled'
const STORAGE_KEY_LAST_NOTIF = 'monest-last-notification'
const STORAGE_KEY_BANNER_DISMISSED = 'monest-notifications-banner-dismissed'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Check if push notifications are supported in this browser
 */
export function isNotificationSupported() {
  return 'Notification' in window
}

/**
 * Check if user has enabled notifications
 */
export function isNotificationEnabled() {
  return localStorage.getItem(STORAGE_KEY_ENABLED) === 'true'
}

/**
 * Enable notifications in localStorage
 */
export function enableNotifications() {
  localStorage.setItem(STORAGE_KEY_ENABLED, 'true')
}

/**
 * Disable notifications in localStorage
 */
export function disableNotifications() {
  localStorage.setItem(STORAGE_KEY_ENABLED, 'false')
}

/**
 * Check if the permission banner should be shown
 * - Notifications must be supported
 * - Permission must be 'default' (not granted/denied)
 * - User must not have already enabled/disabled in settings
 * - Banner must not have been dismissed within the last 7 days
 */
export function shouldShowBanner() {
  if (!isNotificationSupported()) return false
  if (Notification.permission !== 'default') return false

  const enabled = localStorage.getItem(STORAGE_KEY_ENABLED)
  if (enabled !== null) return false

  const dismissed = localStorage.getItem(STORAGE_KEY_BANNER_DISMISSED)
  if (dismissed) {
    const dismissedAt = parseInt(dismissed, 10)
    if (Date.now() - dismissedAt < WEEK_MS) return false
  }

  return true
}

/**
 * Dismiss the banner (don't show again for 7 days)
 */
export function dismissBanner() {
  localStorage.setItem(STORAGE_KEY_BANNER_DISMISSED, Date.now().toString())
}

/**
 * Request notification permission and update localStorage
 * Returns true if permission was granted
 */
export async function requestPermission() {
  if (!isNotificationSupported()) return false
  const result = await Notification.requestPermission()
  if (result === 'granted') {
    enableNotifications()
    return true
  }
  return false
}

/**
 * Compute the daily "reste a vivre" for the current month
 */
function getDailyResteAVivre() {
  const household = useHouseholdStore.getState().household
  if (!household) return null

  const month = getCurrentMonth()
  const { fixedCharges, installmentPayments, plannedExpenses } = useChargesStore.getState()
  const monthlyEntry = useMonthlyStore.getState().getEntry(month)

  const result = computeMonth(month, household, fixedCharges, installmentPayments, plannedExpenses, monthlyEntry)

  // Get total expenses for this month
  const totalExpenses = useExpenseStore.getState().getTotalByMonth(month)

  // Remaining after fixed charges and expenses
  const isSolo = household.configModel === 'solo'
  const remaining = isSolo
    ? result.resteA - totalExpenses
    : result.resteFoyer - totalExpenses

  // Days in current month
  const now = new Date()
  const daysInMonth = getDaysInMonth(now)
  const dayOfMonth = now.getDate()
  const remainingDays = daysInMonth - dayOfMonth + 1

  if (remainingDays <= 0) return null

  return Math.round(remaining / remainingDays)
}

/**
 * Try to register periodic background sync for weekly reminders
 */
export async function registerPeriodicSync() {
  if (!('serviceWorker' in navigator)) return false

  try {
    const registration = await navigator.serviceWorker.ready
    if ('periodicSync' in registration) {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' })
      if (status.state === 'granted') {
        await registration.periodicSync.register('weekly-reminder', {
          minInterval: WEEK_MS,
        })
        return true
      }
    }
  } catch {
    // Periodic sync not supported or permission denied — fall through to fallback
  }
  return false
}

/**
 * Fallback: check on app open if 7+ days since last notification, and show one
 */
export function checkAndShowWeeklyNotification() {
  if (!isNotificationSupported()) return
  if (!isNotificationEnabled()) return
  if (Notification.permission !== 'granted') return

  const lastNotif = localStorage.getItem(STORAGE_KEY_LAST_NOTIF)
  const weekAgo = Date.now() - WEEK_MS

  if (lastNotif && parseInt(lastNotif, 10) >= weekAgo) return

  const dailyAmount = getDailyResteAVivre()
  if (dailyAmount === null) return

  const formatted = formatCurrency(dailyAmount)

  try {
    new Notification('Monest', {
      body: `Il vous reste ${formatted} par jour ce mois-ci`,
      icon: '/logo-crown.png',
    })
    localStorage.setItem(STORAGE_KEY_LAST_NOTIF, Date.now().toString())
  } catch {
    // Notification constructor can fail on some platforms; silently ignore
  }
}

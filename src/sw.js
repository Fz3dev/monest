import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { createHandlerBoundToURL } from 'workbox-precaching'

// Workbox injects the precache manifest here
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA: serve index.html for all navigation requests
const denylist = [/^\/reset\.html$/, /^\/.well-known\//]
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist }))

// Auto-update
self.skipWaiting()
clientsClaim()

// ─── Web Push ───────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Monest', body: event.data.text() }
  }

  const { title = 'Monest', body, icon, url, tag } = data

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || '/pwa-192.png',
      badge: '/favicon.png',
      tag: tag || 'monest-default',
      renotify: !!tag,
      data: { url: url || '/dashboard' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(url)
    })
  )
})

// Handle periodic sync for weekly reminders
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'weekly-reminder') {
    event.waitUntil(
      self.registration.showNotification('Monest', {
        body: 'Pensez a verifier votre budget cette semaine !',
        icon: '/pwa-192.png',
        badge: '/favicon.png',
        tag: 'weekly-reminder',
        data: { url: '/dashboard' },
      })
    )
  }
})

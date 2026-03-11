import { useEffect } from 'react'

/** Set/clear app badge count on PWA icon (Chrome 81+, Safari 16.4+) */
export function useBadge(count) {
  useEffect(() => {
    if (!('setAppBadge' in navigator)) return
    if (count > 0) {
      navigator.setAppBadge(count)
    } else {
      navigator.clearAppBadge()
    }
  }, [count])
}

import { useState, useEffect, useCallback } from 'react'

const DISMISS_KEY = 'monest-install-dismissed'
const DISMISS_DAYS = 30

function isDismissed() {
  const dismissed = localStorage.getItem(DISMISS_KEY)
  if (!dismissed) return false
  const daysSince = (Date.now() - new Date(dismissed).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince < DISMISS_DAYS
}

function setDismissed() {
  localStorage.setItem(DISMISS_KEY, new Date().toISOString())
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissedState] = useState(isDismissed)

  useEffect(() => {
    // Already running as installed PWA?
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone === true // Safari iOS
    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    const handler = (e) => {
      e.preventDefault() // Prevent Chrome mini-infobar
      setDeferredPrompt(e)
    }

    const installedHandler = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return null
    const result = await deferredPrompt.prompt()
    setDeferredPrompt(null) // prompt() can only be called once
    return result.outcome // 'accepted' or 'dismissed'
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    setDismissed()
    setDismissedState(true)
    setDeferredPrompt(null)
  }, [])

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  const isMobile = isIOS || /Android/.test(navigator.userAgent)

  return {
    // Chrome/Android: can trigger native install dialog
    canPrompt: !!deferredPrompt && !isInstalled && !dismissed,
    // iOS: need to show manual instructions
    showIOSGuide: isIOS && !isInstalled && !dismissed && isMobile,
    isInstalled,
    isMobile,
    isIOS,
    promptInstall,
    dismiss,
  }
}

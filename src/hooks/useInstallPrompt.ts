import { useState, useEffect, useCallback } from 'react'

const DISMISS_KEY = 'monest-install-dismissed'
const DISMISS_DAYS = 30

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Navigator {
    standalone?: boolean
  }
}

function isDismissed(): boolean {
  const dismissed = localStorage.getItem(DISMISS_KEY)
  if (!dismissed) return false
  const daysSince = (Date.now() - new Date(dismissed).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince < DISMISS_DAYS
}

function setDismissed(): void {
  localStorage.setItem(DISMISS_KEY, new Date().toISOString())
}

function isStandalonePWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isStandalonePWA)
  const [dismissed, setDismissedState] = useState(isDismissed)

  useEffect(() => {
    if (isInstalled) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
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
  }, [isInstalled])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return null
    const result = await deferredPrompt.prompt()
    setDeferredPrompt(null)
    return result.outcome
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    setDismissed()
    setDismissedState(true)
    setDeferredPrompt(null)
  }, [])

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  const isAndroid = /Android/.test(navigator.userAgent)
  const isMobile = isIOS || isAndroid

  const showManualGuide = isMobile && !deferredPrompt && !isInstalled && !dismissed

  return {
    canPrompt: !!deferredPrompt && !isInstalled && !dismissed,
    showIOSGuide: showManualGuide,
    isInstalled,
    isMobile,
    isIOS,
    isAndroid,
    promptInstall,
    dismiss,
  }
}

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { Bell, X } from 'lucide-react'
import {
  shouldShowBanner,
  dismissBanner,
  requestPermission,
  registerPeriodicSync,
} from '../utils/notifications'
import { toast } from 'sonner'

export default function NotificationBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Small delay so the banner appears after the app has loaded
    const timer = setTimeout(() => {
      setVisible(shouldShowBanner())
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleAccept = async () => {
    const granted = await requestPermission()
    if (granted) {
      toast.success(t('notifications.enabled'))
      await registerPeriodicSync()
    } else {
      toast.error(t('notifications.permissionDenied'))
    }
    setVisible(false)
  }

  const handleLater = () => {
    dismissBanner()
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mb-4 bg-brand/[0.08] border border-brand/20 rounded-2xl p-4"
        >
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-brand/15 flex items-center justify-center">
              <Bell size={16} className="text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary leading-snug">
                {t('notifications.weeklyReminder')}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {t('notifications.askPermission')}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleAccept}
                  className="px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {t('notifications.enable')}
                </button>
                <button
                  onClick={handleLater}
                  className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-text-secondary text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {t('notifications.later')}
                </button>
              </div>
            </div>
            <button
              onClick={handleLater}
              className="flex-shrink-0 p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              aria-label={t('common.close')}
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

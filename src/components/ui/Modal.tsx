import React, { useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Focus trap: Tab cycles within the modal
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
      // Auto-focus first focusable element in the modal
      requestAnimationFrame(() => {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
        if (focusable?.length) focusable[0].focus()
      })
    }
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus to the element that opened the modal
      if (!isOpen && previousFocus.current) {
        previousFocus.current.focus?.()
        previousFocus.current = null
      }
    }
  }, [isOpen, handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70"
            onClick={onClose}
          />
          {/* Mobile: spacer pushes modal to bottom */}
          <div className="flex-1 sm:hidden" onClick={onClose} />
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative bg-bg-primary border border-white/[0.08] border-b-0 sm:border-b rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85dvh] flex flex-col overflow-hidden"
          >
            {/* Header — fixed at top */}
            <div className="flex-shrink-0 bg-bg-primary border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="text-text-secondary hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                aria-label={t('common.close')}
              >
                <X size={20} />
              </button>
            </div>
            {/* Body — scrolls with hidden scrollbar */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-5 scrollbar-hide">
              {children}
            </div>
          </motion.div>
          {/* Mobile: background fill below modal covering safe area + home indicator */}
          <div className="sm:hidden bg-bg-primary w-full safe-area-bottom" />
        </div>
      )}
    </AnimatePresence>
  )
}

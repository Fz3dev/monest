import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children }) {
  const handleKeyDown = useCallback(
    (e) => { if (e.key === 'Escape') onClose() },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative bg-bg-primary border border-white/[0.08] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-bg-primary/95 backdrop-blur-xl border-b border-white/[0.06] px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="text-text-secondary hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

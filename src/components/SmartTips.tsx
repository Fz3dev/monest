import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, X } from 'lucide-react'
import Card from './ui/Card'
import type { SmartTip } from '../utils/tips'

const DISMISSED_KEY = 'monest-dismissed-tips'

function getDismissedTips(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch { /* ignore */ }
  return new Set()
}

function saveDismissedTips(ids: Set<string>): void {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]))
}

const CATEGORY_COLORS: Record<SmartTip['category'], string> = {
  savings: 'bg-success/10 border-success/20',
  negotiation: 'bg-brand/10 border-brand/20',
  optimization: 'bg-warning/10 border-warning/20',
  warning: 'bg-danger/10 border-danger/20',
}

interface SmartTipsProps {
  tips: SmartTip[]
}

export default function SmartTips({ tips }: SmartTipsProps) {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissedTips)
  const [collapsed, setCollapsed] = useState(false)

  const visibleTips = useMemo(
    () => tips.filter((tip) => !dismissed.has(tip.id)),
    [tips, dismissed]
  )

  const handleDismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      saveDismissedTips(next)
      return next
    })
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  if (visibleTips.length === 0) return null

  return (
    <Card animate={false} className="h-full">
      {/* Header */}
      <button
        onClick={toggleCollapsed}
        className="flex items-center justify-between w-full mb-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{'\ud83d\udca1'}</span>
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            {t('tips.title')}
          </span>
        </div>
        <motion.div
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} className="text-text-muted" />
        </motion.div>
      </button>

      {/* Tips list */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {visibleTips.map((tip) => (
                  <motion.div
                    key={tip.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className={`relative rounded-xl border p-3 ${CATEGORY_COLORS[tip.category]}`}
                  >
                    {/* Dismiss button */}
                    <button
                      onClick={() => handleDismiss(tip.id)}
                      className="absolute top-2 right-2 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.08] transition-colors"
                      aria-label={t('common.close')}
                    >
                      <X size={12} />
                    </button>

                    <div className="flex items-start gap-2.5 pr-6">
                      {/* Emoji icon */}
                      <span className="text-base flex-shrink-0 mt-0.5">{tip.icon}</span>

                      <div className="min-w-0 space-y-1">
                        {/* Title */}
                        <p className="text-sm font-semibold text-text-primary">{tip.title}</p>
                        {/* Message */}
                        <p className="text-xs text-text-secondary leading-relaxed">{tip.message}</p>
                        {/* Potential saving badge */}
                        {tip.potentialSaving && (
                          <span className="inline-block mt-1 text-[10px] font-medium bg-success/10 text-success px-2 py-0.5 rounded-full">
                            {tip.potentialSaving}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Responsive, useContainerWidth } from 'react-grid-layout'
import { motion, AnimatePresence } from 'motion/react'
import { GripHorizontal, Check, RotateCcw, LayoutGrid } from 'lucide-react'
import { useDashboardLayoutStore, DEFAULT_LAYOUTS } from '../../stores/dashboardLayoutStore'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

export function EditModeButton() {
  const { t } = useTranslation()
  const isEditMode = useDashboardLayoutStore((s) => s.isEditMode)
  const toggleEditMode = useDashboardLayoutStore((s) => s.toggleEditMode)

  return (
    <button
      onClick={toggleEditMode}
      className={`hidden lg:flex p-2.5 rounded-xl transition-colors ${
        isEditMode
          ? 'bg-brand/15 text-brand'
          : 'bg-white/[0.06] text-text-secondary active:bg-white/[0.1]'
      }`}
      aria-label={t('dashboardGrid.editLayout')}
    >
      {isEditMode ? <Check size={20} strokeWidth={2} /> : <LayoutGrid size={20} strokeWidth={1.8} />}
    </button>
  )
}

export default function DashboardGrid({ widgets }) {
  const { t } = useTranslation()
  const { width, containerRef, mounted } = useContainerWidth()
  const layouts = useDashboardLayoutStore((s) => s.layouts)
  const setLayouts = useDashboardLayoutStore((s) => s.setLayouts)
  const isEditMode = useDashboardLayoutStore((s) => s.isEditMode)
  const toggleEditMode = useDashboardLayoutStore((s) => s.toggleEditMode)
  const resetLayouts = useDashboardLayoutStore((s) => s.resetLayouts)

  // Long press to enter edit mode on mobile
  const longPressTimer = useRef(null)
  const handleTouchStart = useCallback(() => {
    if (isEditMode) return
    longPressTimer.current = setTimeout(() => {
      toggleEditMode()
      if (navigator.vibrate) navigator.vibrate(50)
    }, 600)
  }, [isEditMode, toggleEditMode])
  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const visibleIds = useMemo(() => Object.keys(widgets), [widgets])

  const filteredLayouts = useMemo(() => {
    const filtered = {}
    for (const [bp, items] of Object.entries(layouts)) {
      filtered[bp] = items.filter((item) => visibleIds.includes(item.i))
    }
    // Add missing widgets with defaults
    for (const [bp, items] of Object.entries(filtered)) {
      const existing = new Set(items.map((item) => item.i))
      const defaults = DEFAULT_LAYOUTS[bp] || []
      for (const id of visibleIds) {
        if (!existing.has(id)) {
          const def = defaults.find((d) => d.i === id)
          if (def) items.push(def)
        }
      }
    }
    return filtered
  }, [layouts, visibleIds])

  const handleLayoutChange = useCallback(
    (_, allLayouts) => {
      if (isEditMode) setLayouts(allLayouts)
    },
    [setLayouts, isEditMode]
  )

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
    >
      {mounted && (
        <Responsive
          width={width}
          layouts={filteredLayouts}
          breakpoints={{ lg: 1024, md: 768, sm: 0 }}
          cols={{ lg: 3, md: 2, sm: 1 }}
          rowHeight={50}
          dragConfig={{ enabled: isEditMode, handle: '.widget-drag-handle' }}
          resizeConfig={{ enabled: false }}
          compactType="vertical"
          margin={[16, 16]}
          containerPadding={[0, 0]}
          onLayoutChange={handleLayoutChange}
        >
          {visibleIds.map((id) => (
            <div key={id} className="overflow-hidden">
              <div className={`h-full flex flex-col ${isEditMode ? 'ring-1 ring-brand/20 rounded-2xl' : ''}`}>
                {isEditMode && (
                  <div className="widget-drag-handle flex justify-center py-1 cursor-grab active:cursor-grabbing shrink-0">
                    <GripHorizontal size={14} className="text-text-muted" />
                  </div>
                )}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {widgets[id]}
                </div>
              </div>
            </div>
          ))}
        </Responsive>
      )}

      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-24 left-0 right-0 z-50 flex justify-center lg:bottom-8"
          >
            <div className="flex gap-3 bg-bg-elevated border border-white/[0.08] rounded-2xl px-5 py-3 shadow-2xl">
              <button
                onClick={resetLayouts}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors"
              >
                <RotateCcw size={14} />
                <span>{t('dashboardGrid.resetLayout')}</span>
              </button>
              <button
                onClick={toggleEditMode}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium bg-brand text-white hover:bg-brand-light transition-colors"
              >
                <Check size={14} />
                <span>{t('dashboardGrid.done')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Responsive, useContainerWidth } from 'react-grid-layout'
import { motion, AnimatePresence } from 'motion/react'
import { GripHorizontal, Check, RotateCcw, LayoutGrid, Maximize2 } from 'lucide-react'
import { useDashboardLayoutStore, DEFAULT_LAYOUTS, WIDGET_CONSTRAINTS } from '../../stores/dashboardLayoutStore'
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

// flowWidgetIds: widget IDs rendered outside the grid with natural height on desktop
export default function DashboardGrid({ widgets, flowWidgetIds = [] }) {
  const { t } = useTranslation()
  const { width, containerRef, mounted } = useContainerWidth()
  const layouts = useDashboardLayoutStore((s) => s.layouts)
  const setLayouts = useDashboardLayoutStore((s) => s.setLayouts)
  const isEditMode = useDashboardLayoutStore((s) => s.isEditMode)
  const toggleEditMode = useDashboardLayoutStore((s) => s.toggleEditMode)
  const resetLayouts = useDashboardLayoutStore((s) => s.resetLayouts)

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  const allIds = useMemo(() => Object.keys(widgets), [widgets])
  const flowSet = useMemo(() => new Set(flowWidgetIds), [flowWidgetIds])
  const visibleIds = useMemo(() => allIds.filter((id) => !flowSet.has(id)), [allIds, flowSet])
  const flowIds = useMemo(() => flowWidgetIds.filter((id) => allIds.includes(id)), [flowWidgetIds, allIds])

  // Custom resize handle component
  const resizeHandle = useMemo(() => {
    if (!isEditMode) return undefined
    return (axis, ref) => (
      <div
        ref={ref}
        className={`react-resizable-handle react-resizable-handle-${axis} !w-5 !h-5 !bottom-1 !right-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}
      >
        <Maximize2 size={10} className="text-brand rotate-90" />
      </div>
    )
  }, [isEditMode])

  // Sort mobile widgets by sm layout y position (include flow widgets)
  const mobileOrder = useMemo(() => {
    const smLayout = layouts.sm || DEFAULT_LAYOUTS.sm
    return [...allIds].sort((a, b) => {
      const ay = smLayout.find((l) => l.i === a)?.y ?? 999
      const by = smLayout.find((l) => l.i === b)?.y ?? 999
      return ay - by
    })
  }, [allIds, layouts.sm])

  const filteredLayouts = useMemo(() => {
    const filtered = {}
    for (const [bp, items] of Object.entries(layouts)) {
      filtered[bp] = items
        .filter((item) => visibleIds.includes(item.i))
        .map((item) => ({
          ...item,
          // Always inject min/max constraints so resize respects them
          ...(WIDGET_CONSTRAINTS[item.i] || {}),
        }))
    }
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

  // Mobile: reorder with up/down buttons in edit mode
  const moveWidget = useCallback((id, direction) => {
    const smLayout = layouts.sm || DEFAULT_LAYOUTS.sm
    const sorted = [...smLayout].sort((a, b) => a.y - b.y)
    const idx = sorted.findIndex((l) => l.i === id)
    if (idx < 0) return
    const swapIdx = idx + direction
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    // Swap y positions
    const newLayout = sorted.map((item, i) => {
      if (i === idx) return { ...item, y: sorted[swapIdx].y }
      if (i === swapIdx) return { ...item, y: sorted[idx].y }
      return item
    })
    setLayouts({ ...layouts, sm: newLayout })
  }, [layouts, setLayouts])

  // Mobile normal: simple vertical stack (natural height)
  // Mobile edit: show reorder buttons
  if (isMobile && !isEditMode) {
    return (
      <div
        className="space-y-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
      >
        {mobileOrder.map((id) => (
          <div key={id}>{widgets[id]}</div>
        ))}
      </div>
    )
  }

  if (isMobile && isEditMode) {
    return (
      <div className="space-y-3">
        {mobileOrder.map((id, idx) => (
          <div key={id} className="ring-1 ring-brand/20 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-brand/5">
              <span className="text-[10px] font-medium text-brand uppercase tracking-wider">
                {t(`dashboardGrid.widget_${id}`, { defaultValue: id })}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => moveWidget(id, -1)}
                  disabled={idx === 0}
                  className="p-1 rounded text-text-muted hover:text-white disabled:opacity-20 transition-colors"
                  aria-label="Monter"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                </button>
                <button
                  onClick={() => moveWidget(id, 1)}
                  disabled={idx === mobileOrder.length - 1}
                  className="p-1 rounded text-text-muted hover:text-white disabled:opacity-20 transition-colors"
                  aria-label="Descendre"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>
              </div>
            </div>
            <div className="pointer-events-none opacity-60 max-h-32 overflow-hidden">
              {widgets[id]}
            </div>
          </div>
        ))}

        {/* Floating toolbar */}
        <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center">
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
        </div>
      </div>
    )
  }

  // Tablet/Desktop: react-grid-layout
  return (
    <div ref={containerRef}>
      {mounted && (
        <Responsive
          width={width}
          layouts={filteredLayouts}
          breakpoints={{ lg: 900, md: 0 }}
          cols={{ lg: 3, md: 2 }}
          rowHeight={50}
          dragConfig={{ enabled: isEditMode, handle: '.widget-drag-handle' }}
          resizeConfig={{
            enabled: isEditMode,
            handles: ['se'],
            handleComponent: resizeHandle,
          }}
          compactType="vertical"
          margin={[16, 16]}
          containerPadding={[0, 0]}
          onLayoutChange={handleLayoutChange}
        >
          {visibleIds.map((id) => (
            <div key={id} className={`group ${isEditMode ? '' : 'overflow-hidden'}`}>
              <div className={`h-full flex flex-col ${isEditMode ? 'ring-1 ring-brand/20 rounded-2xl bg-white/[0.02]' : ''}`}>
                {isEditMode && (
                  <div className="widget-drag-handle flex items-center justify-center gap-2 py-1.5 cursor-grab active:cursor-grabbing shrink-0 border-b border-brand/10">
                    <GripHorizontal size={14} className="text-brand/40" />
                    <span className="text-[9px] font-semibold text-brand/40 uppercase tracking-widest">
                      {t(`dashboardGrid.widget_${id}`, { defaultValue: id })}
                    </span>
                  </div>
                )}
                <div className={`flex-1 min-h-0 ${isEditMode ? 'overflow-hidden opacity-80 pointer-events-none' : 'overflow-hidden'}`}>
                  {widgets[id]}
                </div>
              </div>
            </div>
          ))}
        </Responsive>
      )}

      {/* Flow widgets — natural height, outside the grid */}
      {flowIds.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {flowIds.map((id) => (
            <div key={id}>{widgets[id]}</div>
          ))}
        </div>
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

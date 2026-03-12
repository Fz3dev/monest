import React from 'react'
import { motion, useMotionValue, useTransform, animate } from 'motion/react'
import { Trash2 } from 'lucide-react'
import type { PanInfo } from 'motion/react'

interface SwipeToDeleteProps {
  onDelete: () => void
  deleteLabel?: string
  children: React.ReactNode
}

/**
 * Swipe-to-delete wrapper. Mobile: swipe left to reveal delete. Desktop: hover delete button.
 */
export default function SwipeToDelete({ onDelete, deleteLabel = 'Supprimer', children }: SwipeToDeleteProps) {
  const x = useMotionValue(0)
  const deleteOpacity = useTransform(x, [-120, -40, 0], [1, 0.5, 0])
  const iconScale = useTransform(x, [-120, -40, 0], [1.1, 0.8, 0.5])

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) {
      animate(x, -400, { duration: 0.2 })
      setTimeout(onDelete, 200)
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 })
    }
  }

  return (
    <div className="relative group overflow-hidden rounded-2xl">
      {/* Desktop: hover delete button */}
      <div className="hidden lg:flex absolute inset-y-0 right-3 items-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onDelete}
          className="p-2 rounded-lg bg-danger/10 hover:bg-danger/20 text-danger transition-colors"
          aria-label={deleteLabel}
        >
          <Trash2 size={14} />
        </button>
      </div>
      {/* Mobile: swipe to delete */}
      <motion.div
        className="absolute inset-0 bg-danger flex items-center justify-end pr-6 lg:hidden"
        style={{ opacity: deleteOpacity }}
      >
        <motion.div style={{ scale: iconScale }}>
          <Trash2 size={18} className="text-white" />
        </motion.div>
      </motion.div>
      <motion.div
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className="relative z-10 lg:!transform-none"
      >
        {children}
      </motion.div>
    </div>
  )
}

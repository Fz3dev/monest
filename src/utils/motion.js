// Motion presets for consistent animations throughout the app
// Usage: <motion.div {...fadeIn}> or <motion.div {...slideUp}>

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
}

export const slideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: 'easeOut' },
}

export const slideRight = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 12 },
  transition: { duration: 0.2, ease: 'easeOut' },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: 'easeOut' },
}

export const scalePress = {
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 400, damping: 25 },
}

export function staggerChildren(staggerDelay = 0.04) {
  return {
    initial: 'hidden',
    animate: 'show',
    variants: {
      hidden: {},
      show: {
        transition: { staggerChildren: staggerDelay },
      },
    },
  }
}

export const staggerChild = {
  variants: {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
  },
}

// Spring config for modals and overlays
export const springModal = {
  type: 'spring',
  damping: 25,
  stiffness: 300,
}

// Reduced motion check
export const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

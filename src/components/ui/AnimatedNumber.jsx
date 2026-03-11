import { useEffect, useRef, useState } from 'react'

export default function AnimatedNumber({ value, format, className = '' }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    const from = prevRef.current
    const to = value
    if (from === to) return

    const duration = 400
    const start = performance.now()

    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setDisplay(from + (to - from) * eased)
      if (progress < 1) requestAnimationFrame(tick)
      else prevRef.current = to
    }

    requestAnimationFrame(tick)
  }, [value])

  return <span className={className}>{format ? format(display) : Math.round(display)}</span>
}

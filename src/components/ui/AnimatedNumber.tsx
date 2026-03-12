import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  format?: (value: number) => string
  className?: string
}

export default function AnimatedNumber({ value, format, className = '' }: AnimatedNumberProps) {
  const [display, setDisplay] = useState<number>(value)
  const prevRef = useRef<number>(value)

  useEffect(() => {
    const from = prevRef.current
    const to = value
    if (from === to) return

    const duration = 400
    const start = performance.now()
    let frameId: number

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setDisplay(from + (to - from) * eased)
      if (progress < 1) frameId = requestAnimationFrame(tick)
      else prevRef.current = to
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [value])

  return <span className={className}>{format ? format(display) : Math.round(display)}</span>
}

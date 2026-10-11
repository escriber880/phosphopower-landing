import { useEffect, useRef, useState } from 'react'

/** Counts up to `to` the first time it scrolls into view. Reduced motion → final value. */
export default function CountUp({ to, decimals = 0, duration = 1100, className = '' }) {
  const ref = useRef(null)
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [value, setValue] = useState(reduce ? to : 0)

  useEffect(() => {
    if (reduce) return
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setValue(to)
      return
    }
    let raf = 0
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        const start = performance.now()
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - t, 3)
          setValue(to * eased)
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    io.observe(node)
    return () => {
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [to, duration, reduce])

  return (
    <span ref={ref} className={`num${className ? ' ' + className : ''}`}>
      {value.toFixed(decimals)}
    </span>
  )
}

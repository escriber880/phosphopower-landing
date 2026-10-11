import { useEffect, useRef, useState } from 'react'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—/◆'

/**
 * Decode-on-view text: characters resolve left to right out of noise.
 * Length never changes and spaces stay put, so there is no layout shift —
 * only run it on monospaced labels.
 *
 * Returns [ref, text]. Falls back to the final string for reduced motion,
 * missing IntersectionObserver, or when the element is already past on load.
 */
export default function useScramble(target, { speed = 26, hold = 0 } = {}) {
  const ref = useRef(null)
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [text, setText] = useState(() => (reduce || typeof IntersectionObserver === 'undefined' ? target : target.replace(/\S/g, ' ')))

  useEffect(() => {
    const node = ref.current
    if (!node || reduce || typeof IntersectionObserver === 'undefined') {
      setText(target)
      return
    }
    let timer = 0
    let raf = 0
    const run = () => {
      const chars = [...target]
      let revealed = 0
      const tick = () => {
        revealed += 1 / 1.6
        const cut = Math.floor(revealed)
        setText(
          chars
            .map((c, i) => {
              if (c === ' ' || i < cut) return c
              return GLYPHS[(Math.random() * GLYPHS.length) | 0]
            })
            .join(''),
        )
        if (cut < chars.length) timer = setTimeout(tick, speed)
        else setText(target)
      }
      raf = requestAnimationFrame(() => {
        timer = setTimeout(tick, hold)
      })
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        run()
      },
      { threshold: 0.6 },
    )
    io.observe(node)
    return () => {
      io.disconnect()
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [target, speed, hold, reduce])

  return [ref, text]
}

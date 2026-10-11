import { useEffect } from 'react'

/**
 * Magnetic pull on `[data-magnetic]` targets: the element leans a few pixels
 * toward the pointer and eases back on leave. One delegated listener for the
 * whole page; skipped for coarse pointers and reduced motion.
 *
 * Writes --mag-x/--mag-y so CSS stays the single owner of `transform`
 * (a JS transform would erase the :active scale and any parallax offset).
 */
export default function useMagnetic(strength = 0.28, max = 9) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    let frame = 0
    let hovered = null
    let px = 0
    let py = 0

    const apply = () => {
      frame = 0
      if (!hovered) return
      const r = hovered.getBoundingClientRect()
      const dx = px - (r.left + r.width / 2)
      const dy = py - (r.top + r.height / 2)
      const clamp = (v) => Math.max(-max, Math.min(max, v))
      hovered.style.setProperty('--mag-x', `${clamp(dx * strength).toFixed(2)}px`)
      hovered.style.setProperty('--mag-y', `${clamp(dy * strength * 0.8).toFixed(2)}px`)
    }
    const reset = (el) => {
      el?.style.removeProperty('--mag-x')
      el?.style.removeProperty('--mag-y')
    }

    const onMove = (e) => {
      const el = e.target.closest?.('[data-magnetic]')
      px = e.clientX
      py = e.clientY
      if (el !== hovered) {
        reset(hovered)
        hovered = el || null
      }
      if (!frame) frame = requestAnimationFrame(apply)
    }
    const onLeave = (e) => {
      const el = e.target.closest?.('[data-magnetic]')
      if (!el) return
      reset(el)
      if (el === hovered) hovered = null
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onLeave)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onLeave)
    }
  }, [strength, max])
}

import { useEffect } from 'react'

/**
 * Two pointer effects, one delegated listener each, no per-card listeners:
 *  .spot        → --mx/--my follow the cursor (radial highlight in CSS)
 *  [data-tilt]  → subtle 3D tilt, max ±6deg
 * Both are skipped for reduced-motion users and coarse pointers.
 */
export default function useSpotlight() {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fine.matches || calm.matches) return

    let frame = 0
    const onMove = (e) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const { clientX: x, clientY: y } = e

        const card = e.target.closest?.('.spot')
        if (card) {
          const r = card.getBoundingClientRect()
          card.style.setProperty('--mx', `${x - r.left}px`)
          card.style.setProperty('--my', `${y - r.top}px`)
        }

        const tilt = e.target.closest?.('[data-tilt]')
        if (tilt) {
          const r = tilt.getBoundingClientRect()
          const px = (x - r.left) / r.width - 0.5
          const py = (y - r.top) / r.height - 0.5
          tilt.style.transform = `rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateZ(0)`
        }
      })
    }

    const onLeave = (e) => {
      const tilt = e.target.closest?.('[data-tilt]')
      if (tilt) tilt.style.transform = ''
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])
}

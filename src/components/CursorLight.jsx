import { useEffect, useRef, useState } from 'react'

/**
 * A soft light that trails the pointer, screen-blended over the dark page.
 * Not rendered at all on coarse pointers or under reduced motion — a hidden
 * 620px blurred layer is still a composited layer — and it moves with a single
 * transform, so the cost is one paint per frame, never a layout pass.
 */
export default function CursorLight({ size = 620 }) {
  const ref = useRef(null)
  const [wanted, setWanted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const fine = window.matchMedia('(pointer: fine)')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setWanted(fine.matches && !reduce.matches)
    sync()
    fine.addEventListener('change', sync)
    reduce.addEventListener('change', sync)
    return () => {
      fine.removeEventListener('change', sync)
      reduce.removeEventListener('change', sync)
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || !wanted) return
    let frame = 0
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    const move = (e) => {
      x += (e.clientX - x) * 0.5
      y += (e.clientY - y) * 0.5
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0
          el.style.transform = `translate3d(${(x - size / 2).toFixed(1)}px, ${(y - size / 2).toFixed(1)}px, 0)`
        })
    }
    const show = () => el.classList.add('is-live')
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointermove', show, { once: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointermove', show)
    }
  }, [size, wanted])

  if (!wanted) return null
  return <i ref={ref} className="cursor-light" style={{ width: size, height: size }} aria-hidden="true" />
}

import { useEffect } from 'react'

/**
 * Scroll-linked parallax, one rAF loop for the whole page.
 *
 * JS writes --py (px offset) and --p (0 → 1 as the element crosses the viewport)
 * and CSS decides how to consume them. That keeps parallax composable with
 * hover transforms instead of fighting them for the `transform` property.
 *
 * Skipped entirely for prefers-reduced-motion.
 */
export default function useParallax() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduce.matches) return

    const root = document.documentElement
    let nodes = []
    let frame = 0

    const collect = () => {
      nodes = [...document.querySelectorAll('[data-parallax]')].map((el) => ({
        el,
        speed: Number.isFinite(Number(el.dataset.parallax)) ? Number(el.dataset.parallax) : 0.08,
      }))
    }

    const write = () => {
      frame = 0
      const vh = window.innerHeight
      const max = root.scrollHeight - vh
      root.style.setProperty('--scroll', max > 0 ? (root.scrollTop || document.body.scrollTop) / max : 0)

      for (const { el, speed } of nodes) {
        const r = el.getBoundingClientRect()
        // progress of the element centre through the viewport, -1 (below) → 1 (above)
        const rel = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)
        el.style.setProperty('--py', `${(-rel * speed * 100).toFixed(2)}px`)
        el.style.setProperty('--p', (1 - (rel + 1) / 2).toFixed(4))
      }
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(write)
    }

    collect()
    write()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', () => {
      collect()
      onScroll()
    })
    // content above the fold can change height as fonts/images settle
    const t = setTimeout(collect, 800)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      clearTimeout(t)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
}

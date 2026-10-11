import { useEffect, useRef, useState } from 'react'

/**
 * Which element of a set is "current", measured against a line in the viewport.
 * One rAF-throttled scroll listener, no library. Used for the step-by-step
 * scrollytelling (Naming, Quality) where a highlight has to follow the reader.
 */
export function useNearest(selector, { ref = null, line = 0.5 } = {}) {
  const host = useRef(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const root = (ref && ref.current) || host.current
    if (!root) return
    let frame = 0
    const measure = () => {
      frame = 0
      const items = [...root.querySelectorAll(selector)]
      if (!items.length) return
      const target = window.innerHeight * line
      // the LAST item whose head has passed the reading line owns it; once the
      // whole set is above the line the highlight stays on the final item
      // instead of snapping back to the first.
      let best = 0
      for (let i = 0; i < items.length; i += 1) {
        if (items[i].getBoundingClientRect().top - target <= 0) best = i
      }
      setActive((prev) => (prev === best ? prev : best))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [selector, ref, line])

  return [active, host]
}

/**
 * Which top-level section owns the reading line — drives the nav underline and
 * the progress rail. Returns the active section id.
 */
export function useCurrentSection(line = 0.34) {
  const [id, setId] = useState(null)
  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const sections = [...document.querySelectorAll('main > section[id]')]
      const y = window.innerHeight * line
      let current = sections[0]?.id ?? null
      for (const s of sections) {
        if (s.getBoundingClientRect().top - y <= 0) current = s.id
      }
      setId((prev) => (prev === current ? prev : current))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [line])
  return id
}

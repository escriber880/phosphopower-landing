import { useEffect, useRef, useState } from 'react'

/**
 * Kinetic display type: every word sits in its own overflow-masked box and
 * slides up with a stagger, so a headline assembles rather than fades in.
 * Self-triggering (one IntersectionObserver) so it works for the hero *and*
 * for headings far down the page. Reduced motion → words simply appear.
 *
 * Words are laid out as inline-blocks with a right margin for the space, which
 * keeps the component a pure map over `split(' ')` — no whitespace tokens to
 * index around. The mask hides that margin anyway.
 */
export default function Kinetic({
  as: Tag = 'span',
  text = '',
  className = '',
  step = 62,
  start = 0,
  outlineFrom = -1,
  italicFrom = -1,
  threshold = 0.25,
  ...rest
}) {
  const ref = useRef(null)
  const [on, setOn] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const node = ref.current
    if (!node || on) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOn(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [on, threshold])

  const words = String(text).trim().split(/ +/)

  // A real text node between the words, not just a CSS margin: the DOM has to keep
  // its spaces for screen readers, copy-paste and whatever a crawler reads.
  const nodes = words.flatMap((w, j) => {
    const word = (
      <span className="kinetic-word" key={`w${j}`} style={{ '--d': `${start + j * step}ms` }}>
        <span
          className={[
            outlineFrom >= 0 && j >= outlineFrom ? 'is-outline' : '',
            italicFrom >= 0 && j >= italicFrom ? 'is-italic' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {w}
        </span>
      </span>
    )
    return j === 0 ? [word] : [<span className="kinetic-gap" key={`g${j}`}>{' '}</span>, word]
  })

  return (
    <Tag ref={ref} className={`kinetic${on ? ' is-on' : ''} ${className}`.trim()} {...rest}>
      {nodes}
    </Tag>
  )
}

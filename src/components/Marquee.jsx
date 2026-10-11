/**
 * Kinetic marquee: one track, two identical rows side by side, translated by
 * exactly -50% so the loop is seamless. The second row is aria-hidden and the
 * whole thing pauses on hover/focus so a reader can actually take the line in.
 */
export default function Marquee({ items, dur = 44, reverse = false, outline = true, className = '', size = '' }) {
  const row = items.map((t, i) => (
    <span className={`marquee-item${outline && i % 2 ? ' is-outline' : ''}`} key={`${t}-${i}`}>
      {t}
      <i aria-hidden="true">◆</i>
    </span>
  ))
  return (
    <div className={`marquee${size ? ` marquee--${size}` : ''}${reverse ? ' marquee--rev' : ''}${className ? ' ' + className : ''}`}>
      <div className="marquee-track" style={{ '--dur': `${dur}s` }}>
        <div className="marquee-row">{row}</div>
        <div className="marquee-row" aria-hidden="true">
          {row}
        </div>
      </div>
    </div>
  )
}

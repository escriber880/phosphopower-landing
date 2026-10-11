import { useCurrentSection } from '../hooks/useSpy.js'

/**
 * Left reading rail: a hairline that fills with the page's own --scroll value,
 * plus one tick per numbered section. The active tick is the section owning the
 * reading line — no scroll-spy library, and it degrades to an inert rule when
 * JS is off.
 */
const SECTIONS = [
  ['about', '01', 'Why this bottle'],
  ['formula', '02', 'The formula'],
  ['naming', '03', 'The name'],
  ['facts', '04', 'Panel'],
  ['who', '05', 'Who it is for'],
  ['reviews', '06', 'Reviews'],
  ['quality', '07', 'Manufacturing'],
  ['social', '08', 'Channels'],
  ['contact', '09', 'Ask a question'],
]

export default function Rail() {
  const current = useCurrentSection()
  return (
    <nav className="rail" aria-label="Page progress">
      <span className="rail-line" aria-hidden="true">
        <i className="rail-fill" />
      </span>
      <ul className="rail-ticks">
        {SECTIONS.map(([id, num, label]) => (
          <li key={id}>
            <a href={`#${id}`} className={`rail-tick${current === id ? ' is-current' : ''}`} aria-current={current === id ? 'true' : undefined}>
              <span className="rail-dot" aria-hidden="true" />
              <span className="rail-num">{num}</span>
              <span className="rail-label">{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

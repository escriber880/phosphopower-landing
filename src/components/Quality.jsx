import { useRef } from 'react'
import { quality } from '../data/site.js'
import Kinetic from './Kinetic.jsx'
import Reveal from './Reveal.jsx'
import Orbs from './Orbs.jsx'
import { useNearest } from '../hooks/useSpy.js'

/** Process list on a rail: the line fills as the section passes, and the step
 *  under the reading line takes the accent. */
export default function Quality() {
  const root = useRef(null)
  const [active] = useNearest('[data-step]', { ref: root, line: 0.52 })

  return (
    <section className="section section--glass" id="quality" data-num="07" data-parallax="0" ref={root}>
      <Orbs variant="b" />
      <div className="wrap">
        <Reveal as="p" className="kicker">
          {quality.kicker}
        </Reveal>
        <div className="qual-scrolly">
          <div className="qual-aside">
            <Kinetic as="h2" className="h2" text={quality.title} step={22} />
            <ol className="qual-ticks" aria-hidden="true">
              {quality.items.map((item, i) => (
                <li key={item.title} data-on={i === active ? '1' : undefined}>
                  {String(i + 1).padStart(2, '0')}
                </li>
              ))}
            </ol>
          </div>

          <div className="qual-list">
            {quality.items.map((item, i) => (
              <Reveal
                key={item.title}
                className={`qual-card${i === active ? ' is-active' : ''}`}
                delay={i * 40}
                data-step
                data-edit={i === 2 ? 'Print the real facility registration number on the carton' : undefined}
              >
                <span className="qual-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

import { useRef } from 'react'
import { naming } from '../data/site.js'
import Molecule from './Molecule.jsx'
import Kinetic from './Kinetic.jsx'
import Reveal from './Reveal.jsx'
import { useNearest } from '../hooks/useSpy.js'

/**
 * Scrollytelling: the schematic on the left stays pinned while the steps on the
 * right pass the reading line. Which step is being read decides which region of
 * the molecule lights up and which label the caption carries.
 */
export default function Naming() {
  const root = useRef(null)
  const [active] = useNearest('[data-step]', { ref: root, line: 0.46 })
  const step = naming.steps[active] || naming.steps[0]

  return (
    <section className="section" id="naming" data-num="03" data-parallax="0" ref={root}>
      <div className="wrap">
        <Reveal as="p" className="kicker">
          {naming.kicker}
        </Reveal>

        <Kinetic as="h2" className="h2 h2--wide" text={naming.title} step={22} />

        <div className="scrolly">
          <div className="scrolly-viz">
            <div className="viz-frame">
              <Molecule active={step.part} />
              <span className="viz-glow" aria-hidden="true" />
            </div>
            <p className="viz-cap">
              <b>{step.alias}</b>
              <span>
                {String(active + 1).padStart(2, '0')} / {String(naming.steps.length).padStart(2, '0')}
              </span>
            </p>
            <ul className="viz-prog" aria-hidden="true">
              {naming.steps.map((s, i) => (
                <li key={s.title} data-on={i === active ? '1' : undefined} />
              ))}
            </ul>
          </div>

          <ol className="scrolly-steps">
            <li className="scrolly-lede">
              <p className="lead">{naming.body}</p>
            </li>
            {naming.steps.map((s, i) => (
              <li key={s.title} className={`scrolly-step${i === active ? ' is-active' : ''}`} data-step>
                <span className="step-n">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <Reveal>
          <dl className="def-table" data-edit={import.meta.env.DEV ? 'Cross-check CAS + formula against your ingredient spec sheet' : undefined}>
            {naming.rows.map((r) => (
              <div className="def-row" key={r.k}>
                <dt>{r.k}</dt>
                <dd>
                  <b>{r.v}</b>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}

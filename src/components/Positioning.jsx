import { positioning } from '../data/site.js'
import CountUp from './CountUp.jsx'
import Reveal from './Reveal.jsx'

export default function Positioning() {
  return (
    <section className="section section--grid" id="about" data-num="01" data-parallax="0">
      <div className="wrap">
        <Reveal as="p" className="kicker">
          {positioning.kicker}
        </Reveal>
        <div className="head-block">
          <Reveal as="h2" className="h2">
            {positioning.title}
          </Reveal>
          <Reveal as="p" className="lead" delay={70}>
            {positioning.body}
          </Reveal>
        </div>

        <Reveal className="bento">
          {positioning.cards.map((c, i) => (
            <article
              className={`stat-card glass spot edge ${i === 0 ? 'b-lg glass--asym' : 'b-sm'}`}
              key={c.label}
              data-parallax={i % 2 ? 0.03 : 0.012}
              style={{ '--d': `${i * 70}ms`, '--i': i }}
            >
              <p className="stat-label">{c.label}</p>
              <p className="stat-value">
                <CountUp to={Number(c.value)} />
                <span className="stat-unit">{c.unit}</span>
              </p>
              <p className="stat-note">{c.note}</p>
            </article>
          ))}

        </Reveal>
      </div>
    </section>
  )
}

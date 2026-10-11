import { audience } from '../data/site.js'
import { AudIcon, Arrow } from './Icons.jsx'
import Reveal from './Reveal.jsx'

export default function Audience() {
  return (
    <section className="section" id="who" data-num="05" data-parallax="0">
      <div className="wrap">
        <Reveal as="p" className="kicker">
          {audience.kicker}
        </Reveal>
        <div className="head-block">
          <Reveal as="h2" className="h2">
            {audience.title}
          </Reveal>
        </div>

        <div className="aud-grid">
          {audience.cards.map((card, i) => (
            <Reveal className="aud-card glass spot" key={card.title} delay={i * 80}>
              <span className="aud-icon">
                <AudIcon name={card.icon} />
              </span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <span className="pill pill--gold" style={{ alignSelf: 'start', marginTop: 'auto' }}>
                {card.tag}
              </span>
            </Reveal>
          ))}
        </div>

        <Reveal className="caution" delay={60}>
          <div>
            <h3>{audience.caution.title}</h3>
            <p>{audience.caution.body}</p>
          </div>
          <a className="btn btn-ghost" href="#contact">
            {audience.caution.cta} <Arrow />
          </a>
        </Reveal>
      </div>
    </section>
  )
}

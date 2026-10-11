import { testimonials } from '../data/site.js'
import { Star, Verified } from './Icons.jsx'
import Reveal from './Reveal.jsx'

function Stars({ n }) {
  return (
    <span className="stars" role="img" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} filled={i <= n} />
      ))}
    </span>
  )
}

export default function Testimonials() {
  return (
    <section className="section" id="reviews" data-num="06" data-parallax="0">
      <div className="wrap">
        <Reveal as="p" className="kicker">
          {testimonials.kicker}
        </Reveal>
        <div className="head-block">
          <Reveal as="h2" className="h2">
            {testimonials.title}
          </Reveal>
          <Reveal as="p" className="lead" delay={80}>
            {testimonials.intro}
          </Reveal>
        </div>

        <div className="quote-grid">
          {testimonials.items.map((t, i) => (
            <Reveal className="quote-card glass spot" data-parallax={i % 2 ? 0.05 : 0.02} key={t.name} delay={i * 70} data-edit={t.model ? 'Model quote — replace with a real, consented review' : undefined}>
              {t.model && <span className="flag-model">Model copy</span>}
              <span className="quote-mark" aria-hidden="true">
                “
              </span>
              <p className="quote-text">{t.quote}</p>
              <footer className="quote-foot">
                <div className="who">
                  <b>{t.name}</b>
                  <span>{t.role}</span>
                  {t.verified && !t.model && (
                    <span className="verified">
                      <Verified /> Verified purchaser
                    </span>
                  )}
                </div>
                <Stars n={t.stars} />
              </footer>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  )
}

import { formula } from '../data/site.js'
import Kinetic from './Kinetic.jsx'
import Reveal from './Reveal.jsx'

/**
 * Ingredient cards stack on top of each other while the section scrolls: every
 * card is `position: sticky` at a slightly lower offset, so the last one ends up
 * on top. Pure CSS stacking, driven by --i; no scroll listener involved.
 */
export default function Formula() {
  return (
    <section className="section section--stack" id="formula" data-num="02" data-parallax="0">
      <div className="wrap">
        <Reveal as="p" className="kicker">
          {formula.kicker}
        </Reveal>
        <div className="head-block">
          <Kinetic as="h2" className="h2" text={formula.title} step={26} />
          <Reveal as="p" className="lead" delay={80}>
            {formula.intro}
          </Reveal>
        </div>

        <div className="stack">
          {formula.items.map((item, i) => (
            <article
              key={item.name}
              className="ing-card stack-card glass spot"
              data-accent={item.accent}
              style={{ '--i': i }}
              data-edit={i === 0 ? 'Amounts must match your COA + printed label' : undefined}
            >
              <header className="stack-head">
                <span className="ing-index">{String(i + 1).padStart(2, '0')}</span>
                <div className="stack-title">
                  <h3 className="ing-name">{item.name}</h3>
                  <p className="ing-latin">{item.latin}</p>
                </div>
                <span className="stack-flag">{item.perServing}</span>
              </header>

              <div className="stack-body">
                <dl className="stack-specs">
                  <div className="spec-row">
                    <dt>Per serving</dt>
                    <dd>{item.perServing}</dd>
                  </div>
                  <div className="spec-row">
                    <dt>{i === 3 ? 'Shell' : 'Elemental'}</dt>
                    <dd>{item.elemental}</dd>
                  </div>
                </dl>

                <div className="stack-claims">
                  <ul className="claim-list">
                    {item.claims.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                  <p className="claim-src">{item.claimSource}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

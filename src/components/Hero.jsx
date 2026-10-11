import { brand, hero } from '../data/site.js'
import { Arrow } from './Icons.jsx'
import Orbs from './Orbs.jsx'
import Kinetic from './Kinetic.jsx'
import Reveal from './Reveal.jsx'
import useScramble from '../hooks/useScramble.js'

/* Each pill rides its own parallax plane, so the label facts separate from the
   bottle as you scroll. Offsets are decorative; hidden below 900px so they can
   never widen the layout on a phone. */
// [0] floats above the stage box so it never lands on the .product-tag that
// straddles the card's top edge (a % of the stage height, negative = up)
const PILL_STYLE = [
  { style: { top: '-6.5%', left: '0%' }, speed: '0.26' },
  { style: { top: '24%', right: '0%' }, speed: '0.34' },
  { style: { bottom: '15%', left: '1%' }, speed: '0.2' },
  { style: { bottom: '1%', right: '3%' }, speed: '0.3' },
]

export default function Hero() {
  const [eyebrowRef, eyebrow] = useScramble(hero.eyebrow, { speed: 20, hold: 120 })

  return (
    <section className="hero" id="top">
      <Orbs variant="a" />
      <span className="hero-side" aria-hidden="true">
        PhosphoPower® · Micronized
      </span>

      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="eyebrow" ref={eyebrowRef}>
            <span>{brand.company}</span>
            <i aria-hidden="true">◆</i>
            <span>{eyebrow}</span>
          </p>

          {/* the headline block drifts slower than the page: depth without nausea */}
          <h1 className="display" data-parallax="0.04">
            <Kinetic text={hero.titleA} step={70} start={80} />
            <br />
            <Kinetic text={hero.titleB} step={70} start={340} outlineFrom={0} italicFrom={0} />
          </h1>

          <Reveal as="p" className="hero-sub" delay={520}>
            {hero.sub}
          </Reveal>

          <Reveal className="cta-row" delay={600}>
            <a className="btn btn-primary" href={hero.primary.href} data-magnetic>
              {hero.primary.label} <Arrow />
            </a>
            <a className="btn btn-ghost" href={hero.secondary.href} data-magnetic>
              {hero.secondary.label}
            </a>
          </Reveal>

          <Reveal as="ul" className="hero-badges" delay={660}>
            {hero.badges.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </Reveal>
        </div>

        {/* product stage moves faster than the type — the two-plane depth read */}
        <div className="product-stage" data-parallax="0.14">
          <span className="hero-halo" aria-hidden="true" />
          <span className="hero-ring" aria-hidden="true" />
          <Reveal className="product-shell" delay={200}>
            <figure className="product-card" data-tilt data-edit={import.meta.env.DEV ? 'Replace with your own studio shot (public/product.png)' : undefined}>
              <span className="product-tag">Current retail unit</span>
              <img className="product-img" src="/product.png" alt={hero.photoCaption} width="1600" height="1600" />
              <figcaption className="product-cap">{hero.photoCaption}</figcaption>
            </figure>
          </Reveal>
          <ul className="hero-pills" aria-label="Label facts">
            {hero.pills.map((p, i) => (
              <li key={p} data-parallax={PILL_STYLE[i].speed} style={PILL_STYLE[i].style}>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="scroll-cue" aria-hidden="true">
        scroll
        <span />
      </div>
    </section>
  )
}

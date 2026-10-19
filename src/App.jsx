import { useEffect, useState } from 'react'

const Email = 'nthsupplements@gmail.com'
const CurrentYear = new Date().getFullYear()

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="PhosphoPower home">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
      <span>Phospho<span>Power</span><sup>®</sup></span>
    </a>
  )
}

function Eyebrow({ children, light = false }) {
  return <p className={`eyebrow${light ? ' eyebrow-light' : ''}`}><span />{children}</p>
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const nodes = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -25px 0px' })

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>

      <div className="announcement" role="note">
        <span className="announcement-dot" />
        Transparent formula. Third-party tested. No proprietary blends.
        <a href="#quality">See how we show our work <span aria-hidden="true">↗</span></a>
      </div>

      <header className="site-header" id="top">
        <Brand />
        <button
          className={`menu-toggle${menuOpen ? ' is-open' : ''}`}
          type="button"
          aria-controls="site-nav"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">{menuOpen ? 'Close' : 'Open'} menu</span>
          <span /><span />
        </button>
        <nav id="site-nav" className={`site-nav${menuOpen ? ' is-open' : ''}`} aria-label="Primary navigation">
          <a href="#formula" onClick={closeMenu}>Formula</a>
          <a href="#facts" onClick={closeMenu}>Supplement facts</a>
          <a href="#quality" onClick={closeMenu}>Quality</a>
          <a href="#faq" onClick={closeMenu}>FAQ</a>
          <a className="nav-cta" href={`mailto:${Email}?subject=PhosphoPower%20COA%20request`} onClick={closeMenu}>Request a COA <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <main id="main">
        <section className="hero section-shell">
          <div className="hero-copy reveal">
            <Eyebrow>PhosphoPower® Micronized</Eyebrow>
            <h1>Clear minerals.<br /><em>Everyday</em> confidence.</h1>
            <p className="hero-intro">A thoughtfully simple daily formula with calcium and zinc—exactly what is on the label, and nothing hidden behind a blend.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#formula">Explore the formula <span aria-hidden="true">↓</span></a>
              <a className="text-link" href="#facts">See the label <span aria-hidden="true">↗</span></a>
            </div>
            <ul className="hero-proof" aria-label="Product highlights">
              <li><strong>60</strong><span>vegan capsules</span></li>
              <li><strong>2</strong><span>daily capsules</span></li>
              <li><strong>0</strong><span>proprietary blends</span></li>
            </ul>
          </div>

          <div className="hero-product reveal" aria-label="PhosphoPower Micronized product bottle">
            <div className="hero-arch" />
            <span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="orbit orbit-three" />
            <div className="floating-note top-note"><span className="note-icon">✦</span> Made for your real routine</div>
            <div className="bottle-stage">
              <div className="product-shadow" />
              <img src="/product.png" width="1600" height="1600" alt="PhosphoPower Micronized bottle with 60 vegan capsules" />
            </div>
            <div className="floating-note bottom-note"><span className="check">✓</span> Calcium + Zinc, fully disclosed</div>
            <p className="hero-side-label">DAILY MINERAL SUPPORT</p>
          </div>
        </section>

        <section className="logo-line section-shell" aria-label="Formula attributes">
          <p>Thoughtfully formulated for daily consistency</p>
          <div><span>VEGAN</span><span>NON-GMO</span><span>GLUTEN FREE</span><span>NO ARTIFICIAL COLORS</span></div>
        </section>

        <section className="why section-shell" id="formula">
          <div className="section-heading reveal">
            <Eyebrow>The everyday essential</Eyebrow>
            <h2>What you need.<br /><em>Nothing</em> you don&apos;t.</h2>
            <p>Simple ingredients. Clear amounts. A formula designed to be easy to understand and easy to keep in your routine.</p>
          </div>
          <div className="benefit-grid">
            <article className="benefit-card reveal">
              <div className="card-number">01</div>
              <div className="benefit-icon icon-zinc" aria-hidden="true"><span /><span /><span /></div>
              <p className="mini-label">Zinc glycinate</p>
              <h3>Support that keeps up.</h3>
              <p>Zinc contributes to normal immune function, protein synthesis, and cell division—three everyday roles your body already knows how to perform.</p>
              <a href="#facts">40 mg per serving <span aria-hidden="true">→</span></a>
            </article>
            <article className="benefit-card benefit-card-accent reveal">
              <div className="card-number">02</div>
              <div className="benefit-icon icon-calcium" aria-hidden="true"><span /><span /><span /></div>
              <p className="mini-label">Three calcium salts</p>
              <h3>Built for the basics.</h3>
              <p>Calcium contributes to normal muscle contraction and is needed for the maintenance of bones and teeth.</p>
              <a href="#facts">70 mg per serving <span aria-hidden="true">→</span></a>
            </article>
            <article className="benefit-card reveal">
              <div className="card-number">03</div>
              <div className="benefit-icon icon-label" aria-hidden="true"><span /><span /><span /></div>
              <p className="mini-label">No black box</p>
              <h3>Every milligram has a reason.</h3>
              <p>No proprietary blend. No inflated ingredient list. We show each declared nutrient and its amount on the panel.</p>
              <a href="#quality">Why transparency matters <span aria-hidden="true">→</span></a>
            </article>
          </div>
        </section>

        <section className="facts-section" id="facts">
          <div className="section-shell facts-layout">
            <div className="facts-intro reveal">
              <Eyebrow light>Label-forward by design</Eyebrow>
              <h2>A supplement facts panel you can actually <em>read.</em></h2>
              <p>The best formula is the one you can understand. We spell out the mineral forms, serving size, and what is deliberately left out.</p>
              <a className="button button-light" href={`mailto:${Email}?subject=PhosphoPower%20Supplement%20Facts%20question`}>Ask us about the label <span aria-hidden="true">↗</span></a>
            </div>
            <div className="facts-card reveal">
              <div className="facts-topline"><span>Supplement Facts</span><span>30 servings</span></div>
              <div className="facts-serving">Serving size <strong>2 capsules</strong></div>
              <div className="facts-table" role="table" aria-label="Supplement facts">
                <div className="facts-row facts-head" role="row"><span role="columnheader">Amount per serving</span><span role="columnheader">% DV</span></div>
                <div className="facts-row" role="row"><div role="cell"><strong>Calcium</strong><small>as calcium carbonate, NutriGP® calcium glycerophosphate &amp; calcium 2-aminoethyl phosphate</small></div><strong role="cell">70 mg <i>5%</i></strong></div>
                <div className="facts-row" role="row"><div role="cell"><strong>Zinc</strong><small>as zinc glycinate</small></div><strong role="cell">40 mg <i>364%</i></strong></div>
              </div>
              <p className="facts-footnote">*Percent Daily Values are based on a 2,000 calorie diet.</p>
              <div className="facts-extras"><span>✦ Vegan capsule</span><span>✦ No added sugar</span><span>✦ No titanium dioxide</span></div>
            </div>
          </div>
        </section>

        <section className="routine section-shell">
          <div className="routine-visual reveal">
            <div className="sun sun-one" /><div className="sun sun-two" />
            <p className="routine-time">A.M. / P.M.</p>
            <div className="routine-bottle-wrap"><img src="/product.png" width="1600" height="1600" alt="" /></div>
            <div className="routine-caption"><span>01</span><p>One with breakfast.<br />One later on.</p></div>
          </div>
          <div className="routine-copy reveal">
            <Eyebrow>Small habit, clear intention</Eyebrow>
            <h2>Fits the rhythm of your <em>day.</em></h2>
            <p>Take two capsules daily—preferably one in the morning and one at night—or as directed by your healthcare professional.</p>
            <ul className="check-list">
              <li><span>✓</span><div><strong>Easy to split</strong><p>Two 00-size plant capsules per daily serving.</p></div></li>
              <li><span>✓</span><div><strong>Made for consistency</strong><p>30 days of simple, label-led support in every bottle.</p></div></li>
              <li><span>✓</span><div><strong>Vegan by choice</strong><p>Hypromellose capsule shell with no gelatin.</p></div></li>
            </ul>
            <a className="text-link text-link-dark" href="#faq">Read the common questions <span aria-hidden="true">↓</span></a>
          </div>
        </section>

        <section className="quality-section" id="quality">
          <div className="section-shell quality-wrap">
            <div className="quality-heading reveal">
              <Eyebrow>Quality, without the mystery</Eyebrow>
              <h2>We show our <em>work.</em></h2>
              <p>From a transparent panel to batch documentation, the standard is simple: say what is there, and be able to show it.</p>
            </div>
            <div className="quality-list">
              <article className="quality-item reveal"><span className="quality-index">01</span><div><h3>Third-party tested</h3><p>Each batch is tested for identity, potency, microbiology, and heavy metals.</p></div><span className="quality-arrow" aria-hidden="true">↗</span></article>
              <article className="quality-item reveal"><span className="quality-index">02</span><div><h3>COA available by batch</h3><p>Ask us for a certificate of analysis for your lot—we are happy to help you find it.</p></div><a className="quality-arrow" href={`mailto:${Email}?subject=PhosphoPower%20COA%20request`} aria-label="Request a certificate of analysis">↗</a></article>
              <article className="quality-item reveal"><span className="quality-index">03</span><div><h3>Nothing hidden in a blend</h3><p>Every declared nutrient is named individually, so you know what you are taking.</p></div><span className="quality-arrow" aria-hidden="true">↗</span></article>
            </div>
          </div>
        </section>

        <section className="faq section-shell" id="faq">
          <div className="faq-heading reveal"><Eyebrow>Good questions, answered</Eyebrow><h2>A little more <em>clarity.</em></h2></div>
          <div className="accordion reveal">
            <details open><summary>What is in PhosphoPower® Micronized?<span aria-hidden="true">+</span></summary><p>Each two-capsule serving provides 70 mg of calcium from calcium carbonate, NutriGP® calcium glycerophosphate, and calcium 2-aminoethyl phosphate, plus 40 mg of zinc as zinc glycinate.</p></details>
            <details><summary>How should I take it?<span aria-hidden="true">+</span></summary><p>Take two capsules daily, preferably one in the morning and one at night, or follow the direction of your healthcare professional. Do not exceed the labelled serving.</p></details>
            <details><summary>Is it suitable for vegan routines?<span aria-hidden="true">+</span></summary><p>Yes. The capsule shell is hypromellose and contains no gelatin. The formula is also made without artificial colors or added preservatives.</p></details>
            <details><summary>How can I get a certificate of analysis?<span aria-hidden="true">+</span></summary><p>Email us with the lot number printed on the bottle and we will help you locate the relevant batch documentation.</p></details>
          </div>
        </section>

        <section className="closing section-shell">
          <div className="closing-panel reveal">
            <span className="closing-spark spark-one">✦</span><span className="closing-spark spark-two">✦</span>
            <Eyebrow>Start with what is clear</Eyebrow>
            <h2>Your daily mineral ritual,<br /><em>simplified.</em></h2>
            <p>Questions about the formula, label, or batch documentation? We are here to help.</p>
            <a className="button button-primary" href={`mailto:${Email}?subject=PhosphoPower%20question`}>Talk to our team <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </main>

      <footer className="site-footer section-shell">
        <div className="footer-top"><Brand /><a href={`mailto:${Email}`}>{Email}</a></div>
        <div className="footer-bottom"><p>© {CurrentYear} NutriHealth USA. All rights reserved.</p><p>Consult your healthcare professional before use if you are pregnant, nursing, taking medication, or have a medical condition.</p></div>
      </footer>
    </>
  )
}

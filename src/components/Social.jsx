import { social, brand } from '../data/site.js'
import { SocialIcon, Arrow } from './Icons.jsx'
import Orbs from './Orbs.jsx'
import Reveal from './Reveal.jsx'

const tints = {
  Facebook: 'rgba(24,119,242,.30)',
  X: 'rgba(233,237,248,.18)',
  Instagram: 'rgba(214,41,118,.28)',
  TikTok: 'rgba(37,244,238,.22)',
}

export default function Social() {
  return (
    <section className="section section--grid" id="social" data-num="08" data-parallax="0">
      <Orbs variant="b" />
      <div className="wrap">
        <Reveal as="p" className="kicker">
          {social.kicker}
        </Reveal>
        <div className="head-block">
          <Reveal as="h2" className="h2">
            {social.title}
          </Reveal>
          <Reveal as="p" className="lead" delay={80}>
            {social.intro}
          </Reveal>
        </div>

        <div className="social-grid">
          {brand.social.map((net, i) => (
            <Reveal
              as="a"
              className="social-card glass spot"
              key={net.name}
              href={net.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              delay={i * 70}
              style={{ '--brand': tints[net.name] || 'rgba(201,162,39,.3)' }}
              data-edit={import.meta.env.DEV ? 'Verify this handle belongs to you before publishing' : undefined}
            >
              <span className="social-icon">
                <SocialIcon name={net.icon} />
              </span>
                <h3>{net.name}</h3>
                <span className="social-handle">{net.handle}</span>
                <p className="social-blurb">{net.blurb}</p>
                <span className="social-meta">
                  <span>{net.stat}</span>
                  <span>
                    Follow <Arrow />
                  </span>
                </span>
            </Reveal>
          ))}
        </div>

        <div className="policy">
          <Reveal as="ul" className="policy-list">
            {social.policy.map((p) => (
              <li key={p.slice(0, 30)}>{p}</li>
            ))}
          </Reveal>

          <Reveal className="callout" delay={90} style={{ marginTop: 0 }}>
            <span className="callout-icon" aria-hidden="true">
              !
            </span>
            <div>
              <h3>{social.verifyTitle}</h3>
              <p>{social.verify}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

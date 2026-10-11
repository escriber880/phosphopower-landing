import { brand } from '../data/site.js'
import { SocialIcon, Mark } from './Icons.jsx'
import Kinetic from './Kinetic.jsx'

// Computed at module scope: `new Date()` during render is an impurity (react-compiler purity rule).
const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="footer">
      <Kinetic as="p" className="footer-wordmark" text={`${brand.shortName} Micronized`} step={38} />

      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <a className="brandmark" href="#top">
              <Mark />
              <span className="brandmark-text">
                <b>{brand.product}</b>
                <span>{brand.line}</span>
              </span>
            </a>
            <p>
              {brand.company} — dietary supplements formulated to a documented standard since {brand.founded}. Manufactured in the United States from
              globally sourced ingredients.
            </p>
            <div className="footer-social">
              {brand.social.map((net) => (
                <a key={net.name} href={net.url} target="_blank" rel="noopener noreferrer nofollow" aria-label={`${brand.shortName} on ${net.name}`}>
                  <SocialIcon name={net.icon} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4>Pages</h4>
            <ul className="footer-links">
              <li>
                <a href="#formula">The formula</a>
              </li>
              <li>
                <a href="#facts">Supplement Facts</a>
              </li>
              <li>
                <a href="#reviews">Reviews policy</a>
              </li>
              <li>
                <a href="#contact">Contact &amp; adverse events</a>
              </li>
              <li>
                <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/accessibility">Accessibility</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {YEAR} {brand.company}. All rights reserved.</span>
          <span>Dietary supplement · Adults 18+ · Use exactly as directed on the label</span>
          <span>{brand.email}</span>
        </div>
      </div>
    </footer>
  )
}

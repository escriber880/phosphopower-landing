import Marquee from './Marquee.jsx'
import { marquee } from '../data/site.js'

/** Two counter-drifting bands: what it is, and what is in it. */
export default function Ticker() {
  return (
    <div className="ticker">
      <Marquee items={marquee.a} dur={54} size="lg" />
      <Marquee items={marquee.b} dur={42} reverse size="sm" />
    </div>
  )
}

import { useEffect, useState } from 'react'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Ticker from './components/Ticker.jsx'
import Positioning from './components/Positioning.jsx'
import Formula from './components/Formula.jsx'
import Naming from './components/Naming.jsx'
import Facts from './components/Facts.jsx'
import Audience from './components/Audience.jsx'
import Testimonials from './components/Testimonials.jsx'
import Quality from './components/Quality.jsx'
import Social from './components/Social.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import Rail from './components/Rail.jsx'
import CursorLight from './components/CursorLight.jsx'
import { jsonLd } from './lib/ld.js'
import useSpotlight from './hooks/useSpotlight.js'
import useParallax from './hooks/useParallax.js'
import useMagnetic from './hooks/useMagnetic.js'

/** Dev-only switch that outlines every placeholder awaiting real data. */
function EditToggle() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    document.documentElement.classList.toggle('show-edits', on)
  }, [on])
  if (!import.meta.env.DEV) return null
  return (
    <button className="edit-toggle" type="button" aria-pressed={on} onClick={() => setOn((v) => !v)}>
      <i aria-hidden="true" /> {on ? 'Hide placeholders' : 'Show placeholders'}
    </button>
  )
}

export default function App() {
  useSpotlight()
  useParallax()
  useMagnetic()

  useEffect(() => {
    const nodes = jsonLd.map((data) => {
      const el = document.createElement('script')
      el.type = 'application/ld+json'
      el.textContent = JSON.stringify(data)
      document.head.appendChild(el)
      return el
    })
    return () => nodes.forEach((el) => el.remove())
  }, [])

  return (
    <>
      <div className="progress" aria-hidden="true" />
      <a className="skip" href="#formula">
        Skip to formula
      </a>
      <CursorLight />
      <Nav />
      <Rail />
      <main id="main">
        <Hero />
        <Ticker />
        <Positioning />
        <Formula />
        <Naming />
        <Facts />
        <Audience />
        <Testimonials />
        <Quality />
        <Social />
        <Contact />
      </main>
      <Footer />
      <EditToggle />
    </>
  )
}

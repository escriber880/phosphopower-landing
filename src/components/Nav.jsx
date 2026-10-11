import { useEffect, useState } from 'react'
import { brand } from '../data/site.js'
import { Mark, Menu, Arrow } from './Icons.jsx'
import { useCurrentSection } from '../hooks/useSpy.js'

const links = [
  ['Formula', '#formula'],
  ['The name', '#naming'],
  ['Panel', '#facts'],
  ['Reviews', '#reviews'],
  ['Quality', '#quality'],
  ['Channels', '#social'],
]

export default function Nav() {
  const [stuck, setStuck] = useState(false)
  const [open, setOpen] = useState(false)
  const current = useCurrentSection()

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const close = () => setOpen(false)
    if (!open) return
    window.addEventListener('resize', close)
    document.addEventListener('keydown', (e) => e.key === 'Escape' && close())
    return () => window.removeEventListener('resize', close)
  }, [open])

  return (
    <header className={`nav${stuck ? ' is-stuck' : ''}`}>
      <div className="wrap nav-inner">
        <a className="brandmark" href="#top" onClick={() => setOpen(false)}>
          <Mark />
          <span className="brandmark-text">
            <b>{brand.shortName}</b>
            <span>{brand.company}</span>
          </span>
        </a>

        <nav className={`nav-links${open ? ' is-open' : ''}`} aria-label="Sections">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              data-active={current === href.slice(1) ? '1' : undefined}
              aria-current={current === href.slice(1) ? 'true' : undefined}
            >
              {label}
            </a>
          ))}
          <a href="#contact" onClick={() => setOpen(false)}>
            Request docs <Arrow />
          </a>
        </nav>

        <a className="btn btn-primary btn-sm nav-cta" href="#contact" data-magnetic>
          Documentation pack
        </a>

        <button
          className="nav-toggle"
          type="button"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu />
        </button>
      </div>
    </header>
  )
}

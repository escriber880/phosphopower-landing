/* The documentation-pack request was retired: support is one inbox, so this gate
   checks the *absence* of the machinery and the presence of a working mailto.
   A removed form leaves three silent failures behind — a dead anchor in the nav, a
   gate that still passes because its selectors vanished, and a boundary note nobody
   renders any more. Each is asserted here. */
import { chromium } from 'playwright'
import { brand } from '../src/data/site.js'

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:5173/'
const results = []
const pass = (label, ok, detail = '') => {
  results.push(Boolean(ok))
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${label}${detail ? ` — ${detail}` : ''}`)
}

const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
p.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()))

await p.goto(BASE, { waitUntil: 'networkidle' })
await p.evaluate(() => document.querySelector('#contact').scrollIntoView())
await p.waitForTimeout(400)

const page = await p.evaluate(() => ({
  forms: document.querySelectorAll('#contact form, .form-card, #f-name, #f-email, #f-consent').length,
  mailto: document.querySelector('.ask-card a[href^="mailto:"]')?.getAttribute('href') || null,
  channelHref: document.querySelector('.channel-list a[href^="mailto:"]')?.getAttribute('href') || null,
  channels: [...document.querySelectorAll('.channel-list li')].map((li) => li.innerText.replace(/\s+/g, ' ')),
  askNote: document.querySelector('.ask-note')?.innerText || '',
  packNote: document.querySelector('.pack-note')?.innerText.replace(/\s+/g, ' ').trim() || '',
  packLinks: document.querySelectorAll('.pack-note a, a[href*="phosphopower.com"]').length,
  mailtos: [...new Set([...document.querySelectorAll('a[href^="mailto:"]')].map((a) => a.getAttribute('href')))],
  bodyText: document.body.innerText.replace(/\s+/g, ' ').toLowerCase(),
  nav: [...document.querySelectorAll('.nav-links a, .nav-cta')].map((a) => a.innerText.replace(/\s+/g, ' ').trim()),
  rail: [...document.querySelectorAll('.rail-tick')].map((t) => t.getAttribute('aria-label') || t.innerText.replace(/\s+/g, ' ').trim()),
  contactAnchor: !!document.querySelector('#contact'),
}))

pass('no form machinery left in the section', page.forms === 0, `${page.forms} stale nodes`)
pass('ask card hands over a bare mailto', page.mailto === `mailto:${brand.email}`, String(page.mailto))
pass('email channel uses the same inbox', page.channelHref === `mailto:${brand.email}`, String(page.channelHref))
pass('support inbox is the service address', page.channels.some((c) => /email/i.test(c) && c.includes(brand.email)), page.channels.join(' · '))
pass('“monitored” is gone', !/monitored/i.test(page.bodyText), 'the page must not promise a watched line')
pass('the doc-pack request is gone', !/documentation pack|request the documentation/.test(page.bodyText))
/* the bottle prints a different address; the page now says so. The failure mode is
   the note turning into a second contact link — naming an address and offering it are
   different acts, and only one of them is ours to stand behind. */
pass('the printed-address note is on the page', /contact@phosphopower\.com/.test(page.packNote) && /service inbox/.test(page.packNote), JSON.stringify(page.packNote.slice(0, 60)))
pass('it is named as text, never linked', page.packLinks === 0 && page.mailtos.every((h) => h === `mailto:${brand.email}`), `links=${page.packLinks} mailtos=${page.mailtos.join(',')}`)
pass('boundary note renders with the inbox', /medical|diagnos/i.test(page.askNote), JSON.stringify(page.askNote.slice(0, 48)))
// innerText comes back uppercased by .nav-links { text-transform: uppercase }, so
// label assertions must be case-insensitive or they fail on a correct page
pass('nav points at the section, with honest labels', /ask a question/i.test(page.nav.join('|')) && /email support/i.test(page.nav.join('|')) && !/documentation|request docs/i.test(page.nav.join('|')), page.nav.join(' | '))
pass('rail label for 09 matches the nav', page.rail.some((r) => /ask a question/i.test(r)) && !/request docs/i.test(page.rail.join(' ')), page.rail.at(-1))
pass('#contact anchor still resolves', page.contactAnchor)
pass('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '))

/* the note has to survive the small screen, where a submit button used to be the
   only thing carrying it */
const mob = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
const mp = await mob.newPage()
await mp.goto(BASE, { waitUntil: 'networkidle' })
// scroll the note itself into view: it is anchored to the base of a stretched card,
// so a fixed #contact-top scroll leaves it below the fold on a 390px screen. Asserting
// "visible" against the fold measures my scroll position, not the page.
await mp.evaluate(() => document.querySelector('.ask-note').scrollIntoView({ block: 'end' }))
await mp.waitForTimeout(400)
const m = await mp.evaluate(() => {
  const n = document.querySelector('.ask-note')
  const pn = document.querySelector('.pack-note')
  const btn = document.querySelector('.ask-card .btn')
  const card = document.querySelector('.ask-card')
  if (!n || !card) return { missing: true }
  const r = n.getBoundingClientRect(), cr = card.getBoundingClientRect(), cs = getComputedStyle(n)
  const br = btn?.getBoundingClientRect()
  const pr = pn?.getBoundingClientRect(), pcs = pn ? getComputedStyle(pn) : null
  return {
    pack: pn ? { h: Math.round(pr.height), w: Math.round(pr.width), o: parseFloat(pcs.opacity || '1'), fs: pcs.fontSize } : null,
    height: Math.round(r.height),
    width: Math.round(r.width),
    opacity: parseFloat(cs.opacity || '1'),
    // .ask-card is .glass, which is overflow:hidden — a note or CTA pushed past the
    // card box would be silently cut off, so containment is the real check
    clipped: r.bottom > cr.bottom + 1 || r.right > cr.right + 1 || r.left < cr.left - 1,
    btnClipped: br ? br.bottom > cr.bottom + 1 || br.right > cr.right + 1 : true,
    inViewport: r.top >= 0 && r.bottom <= innerHeight,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    cta: Math.round(br?.width || 0),
  }
})
pass('mobile: note painted, not clipped by the glass card', !m.missing && m.height > 12 && m.width > 40 && m.opacity > 0.9 && !m.clipped && !m.btnClipped, JSON.stringify(m))
pass('mobile: printed-address note is painted, not crushed', m.pack && m.pack.h > 12 && m.pack.w > 100 && m.pack.o > 0.9, JSON.stringify(m.pack))
pass('mobile: CTA is tappable and nothing overflows', m.cta > 120 && m.overflow === 0, `cta=${m.cta}px overflow=${m.overflow}`)
await mp.screenshot({ path: 'shots/11-contact-mobile.png' })

await p.evaluate(() => document.querySelector('#contact').scrollIntoView())
await p.waitForTimeout(300)
await p.screenshot({ path: 'shots/11-contact.png' })

console.log(`\n${results.filter(Boolean).length}/${results.length} contact checks passed`)
await b.close()
process.exit(results.every(Boolean) ? 0 : 1)

/* Support is one inbox and one ledger. The request form went first; the "Write to us"
   card and the agency statement went next. Each removal leaves a different silent
   failure — a dead nav anchor, a gate that passes because its selectors vanished, a
   footnote asterisk pointing at no note — so every one of them is asserted here as an
   *absence* you can break by re-adding the thing. Run with `npm run contact`. */
import { chromium } from 'playwright'
import { brand, contact, formula } from '../src/data/site.js'

const claimTotal = formula.items.reduce((n, i) => n + (i.claims?.length || 0), 0)

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

const page = await p.evaluate(() => {
  const notes = [...document.querySelectorAll('.note-line')].map((el) => {
    const box = el.getBoundingClientRect()
    const rg = document.createRange()
    rg.selectNodeContents(el)
    const painted = [...rg.getClientRects()]
    return {
      text: el.innerText.replace(/\s+/g, ' ').trim(),
      h: Math.round(box.height),
      // both cells of a stretched grid get the row's height, so the shorter note ends
      // up with dead space under its text — that is what "looks half-filled" means
      trailing: painted.length ? Math.round(box.bottom - parseFloat(getComputedStyle(el).paddingBottom) - Math.max(...painted.map((r) => r.bottom))) : 999,
      w: Math.round(box.width),
      o: parseFloat(getComputedStyle(el).opacity || '1'),
      links: el.querySelectorAll('a').length,
    }
  })
  return {
    forms: document.querySelectorAll('#contact form, .form-card, .ask-card, .ask-note, #f-name, #f-email, #f-consent').length,
    channelHrefs: [...document.querySelectorAll('.channel-list a[href^="mailto:"]')].map((a) => a.getAttribute('href')),
    channels: [...document.querySelectorAll('.channel-list li')].map((li) => li.innerText.replace(/\s+/g, ' ')),
    mailtos: [...new Set([...document.querySelectorAll('a[href^="mailto:"]')].map((a) => a.getAttribute('href')))],
    phosphoLinks: document.querySelectorAll('a[href*="phosphopower.com"]').length,
    notes,
    topCols: getComputedStyle(document.querySelector('.contact-top')).gridTemplateColumns.split(' ').length,
    noteCols: getComputedStyle(document.querySelector('.contact-notes')).gridTemplateColumns.split(' ').length,
    claimStars: [...document.querySelectorAll('.claim-list li')].filter((li) => /\.\s*\*\s*$/.test(li.innerText.trim())).map((li) => li.innerText.trim()),
    claimLines: document.querySelectorAll('.claim-list li').length,
    bodyText: document.body.innerText.replace(/\s+/g, ' ').toLowerCase(),
    legalList: document.querySelectorAll('.legal-list').length,
    nav: [...document.querySelectorAll('.nav-links a, .nav-cta')].map((a) => a.innerText.replace(/\s+/g, ' ').trim()),
    rail: [...document.querySelectorAll('.rail-tick')].map((t) => t.getAttribute('aria-label') || t.innerText.replace(/\s+/g, ' ').trim()),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }
})

/* ── what was retired stays retired ─────────────────────────────────────────── */
pass('no form machinery left in the section', page.forms === 0, `${page.forms} stale nodes`)
pass('the "Write to us" card is gone from the DOM', page.forms === 0 && page.notes.length === 2, `${page.notes.length} note lines`)
pass('its copy does not survive in the footer or nav', !/write to us|open a blank email/.test(page.bodyText))
/* The fine print followed the card and the agency sentence out of the file: the whole `legal` export
   is gone, so a restored list must be re-authored rather than un-hidden. Data file and rendered text
   are checked apart, so neither half can be satisfied by a rename. */
const legalExport = 'legal' in (await import('../src/data/site.js'))
pass('the data file carries neither the card nor a legal block', contact.write === undefined && !legalExport, `contact.write=${typeof contact.write} legal export=${legalExport}`)
const legalProse = /this page is a summary of it|not a substitute for a varied|Stop and speak with a physician|talk to your clinician before use|not a promise of how the product will work/i.test(page.bodyText)
pass('the five footer bullets do not survive as prose', page.legalList === 0 && !legalProse, `${page.legalList} .legal-list nodes, prose=${legalProse}`)
pass('the agency statement is off the page', !/food and drug|not been evaluated|\bfda\b/.test(page.bodyText))
pass('no claim is left with an orphan asterisk', page.claimLines === claimTotal && page.claimStars.length === 0, `${page.claimStars.length}/${page.claimLines} of ${claimTotal} claim lines still end in .*`)
pass('“monitored” is gone', !/monitored/i.test(page.bodyText), 'the page must not promise a watched line')
/* The asterisks are data and the statement is markup; both can come back on their own.
   What can also come back silently is a *sentence* telling readers where to look for a
   note that no longer exists — copy an editor writes from memory of the old layout. */
pass('no sentence gestures at a footnote that is not there', !/points to the one note|\* on a line|foot of this page|see the footer/i.test(page.bodyText), (page.bodyText.match(/.{0,40}(points to the one note|\* on a line|foot of this page).{0,20}/) || ['none'])[0])
pass('the doc-pack request is gone', !/documentation pack|request the documentation/.test(page.bodyText))

/* ── what must survive the removals ─────────────────────────────────────────── */
// the Email row is now the only handoff: if the card's CTA went and this href went
// stale, support would be unreachable and the audit trail would look intentional
pass('the Email row hands over the service inbox', page.channelHrefs.length === 2 && page.channelHrefs.every((h) => h === `mailto:${brand.email}`), page.channelHrefs.join(' · '))
pass('no second inbox is offered anywhere', page.phosphoLinks === 0 && page.mailtos.every((h) => h === `mailto:${brand.email}`), `links=${page.phosphoLinks} mailtos=${page.mailtos.join(',')}`)
pass('support inbox is the service address', page.channels.some((c) => /email/i.test(c) && c.includes(brand.email)), page.channels.join(' · '))
pass('the printed-address note still reads', /contact@phosphopower\.com/i.test(page.notes[0]?.text) && /service inbox/i.test(page.notes[0]?.text), JSON.stringify(String(page.notes[0]?.text).slice(0, 52)))
pass('the boundary note still reads', /no purchase is made/i.test(page.notes[1]?.text) && /medical|diagnos/i.test(page.notes[1]?.text), JSON.stringify(String(page.notes[1]?.text).slice(0, 52)))
// innerText is uppercased by .nav-links { text-transform: uppercase }, so label
// assertions have to be case-insensitive or they fail on a correct page
pass('nav still points at the section with honest labels', /ask a question/i.test(page.nav.join('|')) && /email support/i.test(page.nav.join('|')) && !/documentation|request docs|write to us/i.test(page.nav.join('|')), page.nav.join(' | '))
pass('rail label for 09 matches the nav', page.rail.some((r) => /ask a question/i.test(r)) && !/request docs/i.test(page.rail.join(' ')), page.rail.at(-1))

/* ── composition: two removals left two real risks ──────────────────────────── */
pass('ledger keeps two columns on desktop', page.topCols === 2 && page.noteCols === 2, `top=${page.topCols} notes=${page.noteCols}`)
pass('neither note box is left visibly half-empty', page.notes.every((n) => n.trailing >= 0 && n.trailing < 26 && n.o > 0.9 && n.w > 200) && Math.abs(page.notes[0].trailing - page.notes[1].trailing) < 12, page.notes.map((n) => `${n.trailing}px dead / ${n.w}px wide`).join(' · '))
pass('no horizontal overflow at 1440', page.overflow === 0, `${page.overflow}px`)
pass('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '))

/* ── the small screen: the notes were the last thing carrying the fine print ─── */
const mob = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
const mp = await mob.newPage()
await mp.goto(BASE, { waitUntil: 'networkidle' })
// scroll the target itself: these notes sit at the bottom of a long section, so
// asserting "inside the fold" after a #contact-top scroll measures my scroll
// position, not the page. Paint + containment is the check that means "visible".
await mp.evaluate(() => document.querySelector('.contact-notes').scrollIntoView({ block: 'end' }))
await mp.waitForTimeout(400)
const m = await mp.evaluate(() => {
  const rows = [...document.querySelectorAll('.note-line')].map((el) => {
    const r = el.getBoundingClientRect()
    return { h: Math.round(r.height), w: Math.round(r.width), top: Math.round(r.top), o: parseFloat(getComputedStyle(el).opacity || '1') }
  })
  const anchors = [...document.querySelectorAll('.channel-list a')].map((a) => Math.round(a.getBoundingClientRect().height))
  return {
    rows,
    stacked: rows.length > 1 ? rows[1].top > rows[0].top + 20 : true,
    cols: getComputedStyle(document.querySelector('.contact-notes')).gridTemplateColumns.split(' ').length,
    tapMin: Math.min(...anchors),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }
})
pass('mobile: both notes painted and stacked', m.rows.length === 2 && m.stacked && m.cols === 1 && m.rows.every((r) => r.h > 12 && r.w > 100 && r.o > 0.9), JSON.stringify(m.rows))
pass('mobile: channel rows stay tappable, nothing overflows', m.tapMin >= 44 && m.overflow === 0, `minRow=${m.tapMin}px overflow=${m.overflow}`)

await mp.screenshot({ path: 'shots/11-contact-mobile.png' })
await p.evaluate(() => document.querySelector('#contact').scrollIntoView())
await p.waitForTimeout(300)
await p.screenshot({ path: 'shots/11-contact.png' })

console.log(`\n${results.filter(Boolean).length}/${results.length} contact checks passed`)
await b.close()
process.exit(results.every(Boolean) ? 0 : 1)

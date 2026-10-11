/* Loads the standalone file with NO server (file://) and asserts it renders. */
import { chromium } from 'playwright'
import { existsSync, readFileSync } from 'node:fs'
import { brand } from '../src/data/site.js'

const FILE = new URL('../standalone/PhosphoPower-landing.html', import.meta.url).pathname
if (!existsSync(FILE)) throw new Error('missing ' + FILE)

const errors = []
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage()
p.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()))
p.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
p.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url().slice(0, 80)))

await p.goto('file://' + FILE, { waitUntil: 'load' })
await p.waitForSelector('.facts-panel')
await p.waitForTimeout(400)

const r = await p.evaluate(() => ({
  sections: document.querySelectorAll('main > section').length,
  numbered: [...document.querySelectorAll('main > section[data-num]')].map((n) => n.dataset.num),
  faqOrLedger: !!document.querySelector('#faq, #evidence'),
  socialCards: document.querySelectorAll('.social-card').length,
  modelFlags: document.querySelectorAll('.flag-model').length,
  externalRequests: performance.getEntriesByType('resource').filter((e) => !e.name.startsWith('data:')).map((e) => e.name).length,
  imgLoaded: (() => { const i = document.querySelector('.product-img'); return i ? `${i.naturalWidth}×${i.naturalHeight}` : 'MISSING' })(),
  h1: document.querySelector('.display')?.innerText.replace(/\n/g, ' | '),
  panelRows: [...document.querySelectorAll('.facts-row')].map((x) => x.innerText.replace(/\n/g, ' ')),
  agencyCopy: /food and drug|not been evaluated|\bFDA\b/i.test(document.body.innerText) ? document.body.innerText.match(/.{0,34}(food and drug|not been evaluated|\bFDA\b).{0,20}/i)[0].replace(/\s+/g, ' ') : null,
  orphanStars: [...document.querySelectorAll('.claim-list li')].filter((li) => /\.\s*\*\s*$/.test(li.innerText.trim())).length,
  askCard: document.querySelectorAll('.ask-card, .ask-note, #contact form').length,
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  cssApplied: getComputedStyle(document.body).backgroundColor,
  revealVisible: getComputedStyle(document.querySelector('.ing-card')).opacity,
  /* structured data is not a link, so it needs its own read: both org blocks must
      name the one service inbox and nothing else */
  ldEmails: [...new Set([...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((n) => [...(n.textContent || '').matchAll(/"email"\s*:\s*"([^"]+)"/g)].map((m) => m[1].trim().toLowerCase())))],
  /* every inbox the artifact actually offers, deduplicated */
  mailtoAddrs: [...new Set([...document.querySelectorAll('a[href^="mailto:"]')].map((a) => decodeURIComponent(a.getAttribute('href')).replace(/^mailto:/i, '').trim().toLowerCase()))],
}))
console.log(JSON.stringify({ ...r, errors: errors.length }, null, 2))
errors.slice(0, 8).forEach((e) => console.log(' ✗', e))
await p.screenshot({ path: 'shots/12-standalone-file.png' })

/* ── the published head must not drift from the panel ─────────────────────────
   <title>, the meta tags and the <noscript> fallback are hand-written: they are
   the copy a label sync misses, and the description is what a search result
   shows. Asserted against the same data the components render, on the artifact
   that actually ships. */
const raw = readFileSync(FILE, 'utf8')
const head = await p.evaluate(() => ({
  desc: document.querySelector('meta[name="description"]')?.content || '',
  og: document.querySelector('meta[property="og:description"]')?.content || '',
  noscript: document.querySelector('noscript')?.textContent.replace(/\s+/g, ' ').trim() || '',
}))
const drift = []
for (const stale of ['chelated', 'bisglycinate', 'vegetarian', '1,000 mg', 'data-edit="', 'care@nutrihealthusa', 'nutrihealthusa.example', 'COMPLIANCE.md', 'These statements have not been evaluated', 'footer-disclaimer', 'Write to us', 'Open a blank email'])
  if (raw.toLowerCase().includes(stale.toLowerCase())) drift.push(stale)
if (!/vegan/i.test(head.desc + head.noscript)) drift.push('no "vegan" in description/noscript')
if (!head.noscript.includes(brand.email)) drift.push(`noscript is missing ${brand.email}`)
if (!head.desc || head.desc.length > 170) drift.push(`description is ${head.desc.length} chars (want 1-170)`)
if (!head.og.includes('label')) drift.push('og:description lost its label promise')
/* The back label prints a different address and the contact section says so in words.
   Naming it is fine; offering it is not — a static bundle cannot stand behind an inbox
   nobody watches, so the printed address must never reach an href. Checked twice: in
   the live DOM (links React renders) and in the raw bytes (the <noscript> fallback is
   inert text while JS runs, so a querySelector never sees it). */
const PRINTED = 'contact@phosphopower.com'
if (r.mailtoAddrs.length !== 1 || r.mailtoAddrs[0] !== brand.email.toLowerCase())
  drift.push(`rendered mailto set is ${JSON.stringify(r.mailtoAddrs)}, want only ${brand.email}`)
/* Only markup attributes here. A loose /mailto:[^"'\s>]+/ over the bundle also walks
   into the minified JS, where a template literal is still `mailto:${d.email}` — that
   is a source artifact, not a link, and a gate that fails on it gets disabled. The
   rendered links are covered by mailtoAddrs above, which sees real hrefs. */
const rawMailtos = [...new Set([...raw.matchAll(/href="mailto:([^"]+)"/gi)].map((m) => m[1].trim().toLowerCase()))]
if (rawMailtos.some((a) => a !== brand.email.toLowerCase()))
  drift.push(`markup links a second inbox: ${rawMailtos.filter((a) => a !== brand.email.toLowerCase()).join(', ')}`)
if (!(r.ldEmails.length === 1 && r.ldEmails[0] === brand.email.toLowerCase()))
  drift.push(`JSON-LD emails are ${JSON.stringify(r.ldEmails)}, want only ${brand.email}`)
if (raw.includes(`href="mailto:${PRINTED}`) || raw.includes(`mailto:${PRINTED}`))
  drift.push(`${PRINTED} is linked — it may appear as text only`)
if (!raw.includes(PRINTED)) drift.push(`the printed-address note vanished from the artifact: ${PRINTED}`)
if (drift.length) {
  console.error('✗ HEAD DRIFT: ' + drift.join(' · '))
  await b.close()
  process.exit(1)
}
console.log(`✓ head + noscript match the panel (${head.desc.length}-char description, ${brand.email} live, no stale claims, no data-edit attributes)`)

// Hard shape guard: 9 numbered sections (01→09), no FAQ/Evidence, disclaimer inlined.
/* The guard used to fail *because* the footer statement was missing. Inverting a
   gate is the easy part — what makes it worth keeping is that each half is still
   falsifiable: a re-added sentence trips agencyCopy, a claim that keeps its asterisk
   trips orphanStars, and a resurrected card trips askCard. */
const nums = r.numbered || []
const okShape = nums.length === 9 && nums[0] === '01' && nums[8] === '09' &&
  r.faqOrLedger === false && r.externalRequests === 0 &&
  r.agencyCopy === null && r.orphanStars === 0 && r.askCard === 0
if (!okShape) {
  console.error('✗ SECTION SHAPE FAILED', JSON.stringify({ numbered: nums, faqOrLedger: r.faqOrLedger, agencyCopy: r.agencyCopy, orphanStars: r.orphanStars, askCard: r.askCard }))
  await b.close()
  process.exit(1)
}
console.log('✓ section shape: 9 numbered sections (01→09), no FAQ/Evidence remnant, no agency statement and no orphan asterisk left from it, 0 external requests')

await b.close()
process.exit(errors.length ? 1 : 0)

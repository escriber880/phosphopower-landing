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
  disclaimerInFooter: !!document.querySelector('.footer-disclaimer')?.innerText.includes('not been evaluated'),
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  cssApplied: getComputedStyle(document.body).backgroundColor,
  revealVisible: getComputedStyle(document.querySelector('.ing-card')).opacity,
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
for (const stale of ['chelated', 'bisglycinate', 'vegetarian', '1,000 mg', 'data-edit="', 'care@nutrihealthusa', 'nutrihealthusa.example', 'COMPLIANCE.md'])
  if (raw.toLowerCase().includes(stale.toLowerCase())) drift.push(stale)
if (!/vegan/i.test(head.desc + head.noscript)) drift.push('no "vegan" in description/noscript')
if (!head.noscript.includes(brand.email)) drift.push(`noscript is missing ${brand.email}`)
if (!head.desc || head.desc.length > 170) drift.push(`description is ${head.desc.length} chars (want 1-170)`)
if (!head.og.includes('label')) drift.push('og:description lost its label promise')
if (drift.length) {
  console.error('✗ HEAD DRIFT: ' + drift.join(' · '))
  await b.close()
  process.exit(1)
}
console.log(`✓ head + noscript match the panel (${head.desc.length}-char description, ${brand.email} live, no stale claims, no data-edit attributes)`)

// Hard shape guard: 9 numbered sections (01→09), no FAQ/Evidence, disclaimer inlined.
const nums = r.numbered || []
const okShape = nums.length === 9 && nums[0] === '01' && nums[8] === '09' &&
  r.faqOrLedger === false && r.disclaimerInFooter === true && r.externalRequests === 0
if (!okShape) {
  console.error('✗ SECTION SHAPE FAILED', JSON.stringify({ numbered: nums, faqOrLedger: r.faqOrLedger }))
  await b.close()
  process.exit(1)
}
console.log('✓ section shape: 9 numbered sections (01→09), no FAQ/Evidence, disclaimer inlined, 0 external requests')

await b.close()
process.exit(errors.length ? 1 : 0)

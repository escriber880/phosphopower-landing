import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:5173/'
const OUT = 'shots'
mkdirSync(OUT, { recursive: true })

const errors = []
const warnings = []

const browser = await chromium.launch()

async function newPage(ctxOpts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    // My CSS reveals content with opacity:0 until IntersectionObserver fires;
    // reduced-motion renders everything visible so full-page captures are honest.
    reducedMotion: 'reduce',
    ...ctxOpts,
  })
  const page = await ctx.newPage()
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`)
    if (m.type() === 'warning') warnings.push(`console.warn: ${m.text()}`)
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('requestfailed', (r) => {
    // favicon-less data URI + HMR websocket are noise; anything else matters
    if (!/ws:|vite|hmr/.test(r.url())) errors.push(`requestfailed: ${r.url()} — ${r.failure()?.errorText}`)
  })
  return { ctx, page }
}

// ── desktop ────────────────────────────────────────────────────────────────
const { page } = await newPage()
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForSelector('.facts-panel')
await page.waitForTimeout(500)

const audit = await page.evaluate(() => {
  const vis = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return 'MISSING'
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return `${Math.round(r.width)}×${Math.round(r.height)} op:${cs.opacity}`
  }
  const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth
  return {
    sections: document.querySelectorAll('main > section').length,
    socialCards: document.querySelectorAll('.social-card').length,
    modelFlags: document.querySelectorAll('.flag-model').length,
    ingredientCards: document.querySelectorAll('.ing-card').length,
    quoteCards: document.querySelectorAll('.quote-card').length,
    scrollCue: !!document.querySelector('.scroll-cue'),
    orbs: document.querySelectorAll('.orb').length,
    productImg: (() => {
      const i = document.querySelector('.product-img')
      return i ? `${i.naturalWidth}×${i.naturalHeight}` : 'MISSING'
    })(),
    hero: vis('.display'),
    factsPanel: vis('.facts-panel'),
    h1: document.querySelector('.display')?.innerText.replace(/\n/g, ' | '),
    docWidthOverflow: overflow,
    title: document.title,
    jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
    fonts: getComputedStyle(document.querySelector('.display')).fontFamily.split(',')[0],
  }
})

await page.screenshot({ path: `${OUT}/01-hero.png` })
await page.evaluate(() => window.scrollTo(0, document.querySelector('#formula').offsetTop - 60))
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/02-formula.png` })
await page.evaluate(() => window.scrollTo(0, document.querySelector('#naming').offsetTop - 60))
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/03-naming.png` })
await page.evaluate(() => window.scrollTo(0, document.querySelector('#facts').offsetTop - 60))
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/04-facts.png` })
await page.evaluate(() => window.scrollTo(0, document.querySelector('#reviews').offsetTop - 60))
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/05-reviews.png` })
await page.evaluate(() => window.scrollTo(0, document.querySelector('#social').offsetTop - 60))
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/06-social.png` })
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/07-footer.png` })

// full page for the whole flow — DPR 1, else the surface exceeds capture limits
try {
  const ctxFull = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const pFull = await ctxFull.newPage()
  await pFull.goto(BASE, { waitUntil: 'networkidle' })
  await pFull.waitForSelector('.facts-panel')
  await pFull.waitForTimeout(600)
  await pFull.screenshot({ path: `${OUT}/00-fullpage.png`, fullPage: true })
  await ctxFull.close()
} catch (e) {
  console.log('! fullpage capture skipped:', e.message.split('\n')[0])
}

// Parallax must be measured with motion allowed: every capture in this harness runs under
// reducedMotion:'reduce', where useParallax() is intentionally inert. A separate context proves
// the real scroll behaviour; `npm run parallax` covers the same ground in more depth.
const drift = await (async () => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
  const pg = await ctx.newPage()
  await pg.goto(BASE, { waitUntil: 'networkidle' })
  await pg.waitForSelector('[data-parallax]')
  const read = () => pg.evaluate(() => {
    const px = (sel) => getComputedStyle(document.querySelector(sel)).getPropertyValue('--py').trim()
    return {
      type: px('h1.display'),
      product: px('.product-stage'),
      scroll: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scroll')) || 0,
    }
  })
  await pg.waitForTimeout(250)
  const top = await read()
  await pg.evaluate(() => window.scrollTo(0, 1100))
  await pg.waitForTimeout(400)
  const mid = await read()
  const noOverflow = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  await ctx.close()
  const rate = (v) => parseFloat(v) || 0
  return {
    top, mid,
    headlineDriftsPx: +Math.abs(rate(mid.type) - rate(top.type)).toFixed(2),
    productDriftsPx: +Math.abs(rate(mid.product) - rate(top.product)).toFixed(2),
    ratesDiffer: Math.abs(rate(mid.product)) > Math.abs(rate(mid.type)) * 1.5,
    progressTracked: mid.scroll > 0.05,
    driftOverflowPx: noOverflow,
  }
})()

const editMode = await page.evaluate(async () => {
  const btn = document.querySelector('.edit-toggle')
  if (!btn) return 'no toggle (expected: DEV-only, this is dev server → should exist)'
  btn.click()
  await new Promise((r) => requestAnimationFrame(r))
  return {
    htmlClass: document.documentElement.className,
    outlinedCount: document.querySelectorAll('[data-edit]').length,
  }
})
await page.screenshot({ path: `${OUT}/08-placeholder-audit.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } })

// ── mobile ────────────────────────────────────────────────────────────────
const { page: mob } = await newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await mob.goto(BASE, { waitUntil: 'networkidle' })
await mob.waitForSelector('.product-img')
await mob.waitForTimeout(400)
const mobileOverflow = await mob.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
await mob.screenshot({ path: `${OUT}/09-mobile-hero.png` })
await mob.evaluate(() => document.querySelector('.nav-toggle').click())
await mob.waitForTimeout(500)
await mob.screenshot({ path: `${OUT}/10-mobile-nav.png` })

// ── the support line (the documentation-pack form was retired) ─────────────
await page.evaluate(() => document.querySelector('#contact').scrollIntoView())
await page.waitForTimeout(300)
const contactOk = await page.evaluate(() => ({
  forms: document.querySelectorAll('#contact form, .form-card').length,
  mailto: document.querySelector('.ask-card a[href^="mailto:"]')?.getAttribute('href') || null,
}))
await page.screenshot({ path: `${OUT}/11-contact.png` })

console.log('── runtime audit ─────────────────────────────')
console.log(JSON.stringify({ ...audit, drift, editMode, mobileOverflowPx: mobileOverflow, contactOk }, null, 2))
console.log('── errors (%d) ────────────────────────────────', errors.length)
errors.slice(0, 12).forEach((e) => console.log(' ✗', e))
console.log('── warnings (%d) ──────────────────────────────', warnings.length)
warnings.slice(0, 6).forEach((w) => console.log(' ·', w))

await browser.close()
process.exit(errors.length ? 1 : 0)

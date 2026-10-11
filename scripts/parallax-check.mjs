/* Parallax must actually move layers at different rates, track the scroll,
   draw the progress bar, and stand down under prefers-reduced-motion. */
import { chromium } from 'playwright'
const BASE = 'http://127.0.0.1:5173/'
const errors = []

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()))
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForSelector('[data-parallax]')

const sample = async (label) => {
  const v = await page.evaluate(() => {
    const px = (sel) => getComputedStyle(document.querySelector(sel)).getPropertyValue('--py').trim()
    const bar = getComputedStyle(document.querySelector('.progress')).transform
    const doc = getComputedStyle(document.documentElement).getPropertyValue('--scroll').trim()
    return { type: px('.display'), product: px('.product-stage'), numeral: px('.section[data-num="02"] .ing-name'), bar, scroll: doc }
  })
  console.log(label, JSON.stringify(v))
  return v
}

const atTop = await sample('top   ')
await page.evaluate(() => window.scrollTo({ top: 1400, behavior: 'instant' }))
await page.waitForTimeout(400)
const mid = await sample('scroll ')
await page.screenshot({ path: 'shots/p1-parallax-mid.png' })

const moved = (a, b) => a !== b && parseFloat(a) !== parseFloat(b)
const checks = []
const t = (label, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'} · ${label}`); checks.push(Boolean(ok)) }

t('headline drifts on scroll', moved(atTop.type, mid.type))
t('product layer drifts on scroll', moved(atTop.product, mid.product))
t('layers move at different rates', parseFloat(atTop.product) !== parseFloat(atTop.type))
t('--scroll progress variable tracks page', parseFloat(mid.scroll) > 0.05)
t('progress bar transforms', mid.bar !== 'none' && mid.bar !== atTop.bar)
t('no layout shift from parallax (no horizontal overflow)', (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) === 0)
t('orbs are decorative and click-through', await page.evaluate(() => [...document.querySelectorAll('.orbs')].every((o) => getComputedStyle(o).pointerEvents === 'none' && o.getAttribute('aria-hidden') === 'null' ? false : getComputedStyle(o).pointerEvents === 'none')))
t('scroll cue present in hero', await page.evaluate(() => !!document.querySelector('.scroll-cue')))
t('zero errors while scrolling', errors.length === 0)

// reduced motion: the hook must bail out and leave layers still
const calm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
const p2 = await calm.newPage()
await p2.goto(BASE, { waitUntil: 'networkidle' })
await p2.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }))
await p2.waitForTimeout(250)
const still = await p2.evaluate(() => getComputedStyle(document.querySelector('.product-stage')).getPropertyValue('--py').trim() || 'unset')
t('prefers-reduced-motion → no parallax offsets', still === 'unset' || still === '' || parseFloat(still) === 0)
console.log('reduced-motion --py =', JSON.stringify(still))

errors.forEach((e) => console.log(' ✗', e))
console.log(`\n${checks.filter(Boolean).length}/${checks.length} parallax checks passed`)
await browser.close()
process.exit(checks.every(Boolean) && !errors.length ? 0 : 1)

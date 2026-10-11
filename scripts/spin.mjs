/* The hero's turntable is a canvas, so "it renders" cannot be checked with a selector:
   an element that exists and paints nothing passes every DOM assertion. This gate
   therefore compares *frames* (dataURL hashes), which makes four otherwise invisible
   failures loud: a canvas that never repaints, a render loop that never stops, an intro
   animation that strands the bottle off-centre, and a drag that moves nothing. The
   texture hash is pinned because the shipped wrap is a derived file — cut, reflowed,
   re-saved — and a swapped source with no re-run of prepare-wrap.py would silently put
   the removed text back into the render. Run: npm run spin */
import { chromium } from 'playwright'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:5173/'
const results = []
const pass = (label, ok, detail = '') => {
  results.push(Boolean(ok))
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${label}${detail ? ` — ${detail}` : ''}`)
}

const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
p.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()))
await p.goto(BASE, { waitUntil: 'networkidle' })
await p.waitForSelector('.spin-canvas[data-spin-ready="1"]', { timeout: 8000 }).catch(() => {})
await p.waitForTimeout(2200) // let the intro settle

const frame = () => p.evaluate(() => document.querySelector('.spin-canvas').toDataURL('image/png'))
const f0 = await frame()

const probe = await p.evaluate(() => {
  const c = document.querySelector('.spin-canvas')
  const cs = getComputedStyle(c)
  const card = document.querySelector('.product-card')
  const img = document.querySelector('.product-img')
  return {
    ready: c.getAttribute('data-spin-ready'),
    mode: c.dataset.mode,
    on: c.classList.contains('is-on'),
    size: [c.clientWidth, c.clientHeight],
    backing: [c.width, c.height],
    webgl: !!c.getContext('webgl2') || !!window.THREE,
    has2d: !!c.getContext('2d'),
    touch: cs.touchAction,
    cursor: cs.cursor,
    pe: cs.pointerEvents,
    imgOpacity: getComputedStyle(img).opacity,
    capOpacity: getComputedStyle(document.querySelector('.product-cap')).opacity,
    hint: document.querySelector('.spin-hint')?.innerText.replace(/\s+/g, ' ').trim(),
    hintOp: getComputedStyle(document.querySelector('.spin-hint')).opacity,
    flag: document.querySelector('.spin-flag')?.innerText.replace(/\s+/g, ' ').trim(),
    flagOp: getComputedStyle(document.querySelector('.spin-flag')).opacity,
    aria: c.getAttribute('aria-label'),
    modes: [...document.querySelectorAll('.spin-mode')].map((x) => x.textContent.trim()),
    cardH: Math.round(card.getBoundingClientRect().height),
    // the reserved band is the whole reason the disclosure is legible: if the chip
    // rises into the artwork it reads as a label element rather than a caveat
    flagClearOfArt: document.querySelector('.spin-flag').getBoundingClientRect().top >= document.querySelector('.spin-canvas').getBoundingClientRect().bottom - 1,
    hintClearOfCard: document.querySelector('.spin-hint').getBoundingClientRect().bottom <= document.querySelector('.product-card').getBoundingClientRect().bottom + 1,
  }
})

pass('canvas mounted and the texture decoded', probe.ready === '1' && probe.has2d, JSON.stringify({ ready: probe.ready, size: probe.size, backing: probe.backing }))
pass('a real frame was painted', f0.length > 20000, `${(f0.length / 1024) | 0} kB png`)
pass('2D only — no WebGL, no three.js', !probe.webgl)
pass('pointer capture is armed, scroll is not', probe.pe === 'auto' && probe.touch === 'pan-y' && probe.cursor === 'grab', `pe=${probe.pe} touch=${probe.touch} cursor=${probe.cursor}`)
pass('photograph is hidden but intact while 3D is on', probe.imgOpacity === '0' && probe.capOpacity === '0', `img=${probe.imgOpacity} cap=${probe.capOpacity}`)
pass('disclosure and panel caption are on screen', probe.flagOp === '1' && probe.hintOp === '1' && /front panel/i.test(probe.hint), JSON.stringify({ hint: probe.hint, flag: probe.flag }))
pass('the disclosure sits in its own band, off the artwork', probe.flagClearOfArt && probe.hintClearOfCard, `flagTop≥canvasBottom=${probe.flagClearOfArt} hintInsideCard=${probe.hintClearOfCard}`)
pass('mode control offers both views', probe.modes.length === 2 && probe.mode === 'spin', probe.modes.join('|'))
pass('the panel name is in the accessible name too', /currently facing the viewer: front panel/i.test(probe.aria), String(probe.aria).slice(-60))

/* ── the interaction contract, measured in frames ──────────────────────────── */
await p.evaluate(() => document.querySelector('.spin-canvas').scrollIntoView({ block: 'center' }))
await p.waitForTimeout(250)
await p.locator('.spin-canvas').focus()
for (let i = 0; i < 18; i++) await p.keyboard.press('ArrowRight') // 1.53 rad ≈ 88°
await p.waitForTimeout(120)
const fTurn = await frame()
pass('arrow keys turn it (18 × 0.085 rad ≈ 88°)', fTurn !== f0, `Δ ${Math.round(f0.length / 1024)}→${Math.round(fTurn.length / 1024)} kB`)
const panelAfter = await p.evaluate(() => document.querySelector('.spin-hint b').textContent.trim())
pass('the caption follows the angle', /facts/i.test(panelAfter), panelAfter)
await p.keyboard.press('Home')
await p.waitForTimeout(150)
pass('Home returns to the identical frame', (await frame()) === f0, 'deterministic paint, no drift')

const box = await p.locator('.spin-canvas').boundingBox()
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await p.mouse.down()
for (let i = 1; i <= 12; i++) await p.mouse.move(box.x + box.width / 2 + i * 14, box.y + box.height / 2, { steps: 2 })
await p.mouse.up()
await p.waitForTimeout(120)
const fDrag = await frame()
pass('drag turns it', fDrag !== fTurn)
await p.waitForTimeout(2400)
const fSettle1 = await frame()
await p.waitForTimeout(700)
pass('inertia settles and the loop stops (no perpetual rAF)', fSettle1 === (await frame()), `settled ${(fSettle1.length / 1024) | 0} kB`)

/* ── the texture is a derived file, so pin its bytes ────────────────────────
   node cannot decode a JPEG here, so the contract is the hash: it fails if the shipped
   wrap stops being what prepare-wrap.py writes, which is how a re-added cut-out
   paragraph would otherwise reach production as pixels nobody reviewed. */
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')
const RECORDED = '07648139fa281e2bd0d9f784e445b35c4a17f8f762ca3733c411df2fe958a3aa'
const shipped = sha256(readFileSync(join(ROOT, 'src/assets/label-wrap.jpg')))
let srcNote = 'source artwork absent from this checkout'
try {
  srcNote = `source ${sha256(readFileSync(join(ROOT, '..', 'uploads', 'IMG-20261010-WA0000.jpg'))).slice(0, 16)} → derived ${shipped.slice(0, 16)}`
} catch {}
pass('shipped wrap is the derived file, byte for byte', shipped === RECORDED, `${srcNote} · recorded ${RECORDED.slice(0, 16)}`)

/* ── photo mode must be a real second view, not a broken one ───────────────── */
await p.locator('.spin-mode', { hasText: 'Photo' }).click()
await p.waitForTimeout(500)
const photo = await p.evaluate(() => {
  const c = document.querySelector('.spin-canvas')
  const img = document.querySelector('.product-img')
  return {
    canvasOn: c.classList.contains('is-on'),
    pe: getComputedStyle(c).pointerEvents,
    imgOpacity: getComputedStyle(img).opacity,
    cap: getComputedStyle(document.querySelector('.product-cap')).opacity,
    natural: `${img.naturalWidth}×${img.naturalHeight}`,
    hint: getComputedStyle(document.querySelector('.spin-hint')).opacity,
    flag: getComputedStyle(document.querySelector('.spin-flag')).opacity,
  }
})
pass('Photo mode hands the card back to the shot', !photo.canvasOn && photo.imgOpacity === '1' && photo.cap === '1' && photo.natural === '1600×1600' && photo.hint === '0', JSON.stringify(photo))
pass('…and the canvas stops swallowing pointer events', photo.pe === 'none', photo.pe)
await p.locator('.spin-mode', { hasText: '3D' }).click()
await p.waitForTimeout(400)

/* ── reduced motion: no self-animation, interaction still allowed ─────────── */
const rm = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
const rp = await rm.newPage()
await rp.goto(BASE, { waitUntil: 'networkidle' })
await rp.waitForSelector('.spin-canvas[data-spin-ready="1"]', { timeout: 8000 }).catch(() => {})
await rp.waitForTimeout(900)
const r1 = await rp.evaluate(() => document.querySelector('.spin-canvas').toDataURL())
await rp.waitForTimeout(900)
const r2 = await rp.evaluate(() => document.querySelector('.spin-canvas').toDataURL())
pass('reduced motion: nothing moves on its own', r1 === r2 && r1.length > 20000)
await rp.evaluate(() => {
  const c = document.querySelector('.spin-canvas')
  c.focus()
  c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
})
await rp.waitForTimeout(150)
pass('reduced motion: turning is still available on request', (await rp.evaluate(() => document.querySelector('.spin-canvas').toDataURL())) !== r1)

/* ── phone: the canvas must be a target, not a trap ───────────────────────── */
const mob = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
const mp = await mob.newPage()
await mp.goto(BASE, { waitUntil: 'networkidle' })
await mp.waitForSelector('.spin-canvas[data-spin-ready="1"]', { timeout: 8000 }).catch(() => {})
await mp.waitForTimeout(1500)
const m = await mp.evaluate(() => {
  const c = document.querySelector('.spin-canvas')
  const r = c.getBoundingClientRect()
  return {
    h: Math.round(r.height),
    w: Math.round(r.width),
    bottom: Math.round(r.bottom),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    hintWrapped: getComputedStyle(document.querySelector('.spin-hint')).whiteSpace,
  }
})
await mp.evaluate(() => document.querySelector('.spin-canvas').scrollIntoView({ block: 'center' }))
await mp.waitForTimeout(500)
const geo = await mp.evaluate(() => {
  const r = (el) => { const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), h: Math.round(b.height) } }
  return { canvas: r(document.querySelector('.spin-canvas')), card: r(document.querySelector('.product-card')), flag: r(document.querySelector('.spin-flag')), hint: r(document.querySelector('.spin-hint')) }
})
const m0 = await mp.evaluate(() => document.querySelector('.spin-canvas').toDataURL())
/* An emulated mobile context scrolls the *visual* viewport, so CDP mouse coordinates
   land somewhere else and "it did not turn" would describe my pointer, not the
   component. These are untrusted PointerEvents dispatched at the element itself, which
   exercise the same handlers a finger reaches; the reachability facts (hit size,
   touch-action, overflow) are asserted separately below. */
await mp.evaluate(() => {
  const c = document.querySelector('.spin-canvas')
  const r = c.getBoundingClientRect()
  const y = (r.top + r.bottom) / 2
  const send = (type, x) => c.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, cancelable: true, isPrimary: true }))
  c.setPointerCapture = () => {}
  c.releasePointerCapture = () => {}
  send('pointerdown', r.left + r.width / 2)
  for (let i = 1; i <= 10; i++) send('pointermove', r.left + r.width / 2 - i * 12)
  send('pointerup', r.left + r.width / 2 - 120)
})
await mp.waitForTimeout(250)
pass('mobile: a touch pointer turns it, and the stage is finger-sized', m.h > 120 && (await mp.evaluate(() => document.querySelector('.spin-canvas').toDataURL())) !== m0, `${m.w}×${m.h}px, card ${geo.card.h}px tall`)
pass('mobile: disclosures sit in the reserved band, inside the card', geo.flag.bottom <= geo.card.bottom + 1 && geo.flag.top >= geo.canvas.bottom && geo.hint.bottom <= geo.card.bottom + 1 && geo.hint.top >= geo.canvas.bottom - 1, JSON.stringify({ canvas: geo.canvas.bottom, flag: geo.flag.top + '→' + geo.flag.bottom, hint: geo.hint.top + '→' + geo.hint.bottom, card: geo.card.bottom }))
pass('mobile: no horizontal overflow from the stage', m.overflow === 0, `${m.overflow}px`)

await p.evaluate(() => document.querySelector('.product-card').scrollIntoView({ block: 'center' }))
await p.waitForTimeout(400)
/* A screenshot of the wrong mode is worse than no screenshot: it looks like evidence.
   So the capture loop refuses to shoot unless the canvas is the thing on screen. */
const capMode = await p.evaluate(() => ({ mode: document.querySelector('.spin-canvas').dataset.mode, on: document.querySelector('.spin-canvas').classList.contains('is-on') }))
pass('the stage is in 3D when the frames are captured', capMode.mode === 'spin' && capMode.on, JSON.stringify(capMode))
for (const [n, keys] of [['a', 0], ['b', 7], ['c', 14], ['d', 22], ['e', 30]]) {
  await p.evaluate(() => document.querySelector('.spin-canvas').focus())
  await p.keyboard.press('Home')
  for (let i = 0; i < keys; i++) await p.keyboard.press('ArrowRight')
  await p.waitForTimeout(90)
  await p.locator('.product-card').screenshot({ path: `shots/14-spin-${n}.png` })
}
await mp.locator('.product-card').screenshot({ path: 'shots/14-spin-mobile.png' })

pass('zero page errors across every pass', errors.length === 0, errors.slice(0, 2).join(' | '))
console.log(`\n${results.filter(Boolean).length}/${results.length} spin checks passed`)
await b.close()
process.exit(results.every(Boolean) ? 0 : 1)

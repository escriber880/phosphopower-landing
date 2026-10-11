/* The hero's turntable is a canvas, so "it renders" cannot be checked with a selector:
   an element that exists and paints nothing passes every DOM assertion. This gate
   therefore compares *frames* (dataURL hashes), which makes four otherwise invisible
   failures loud: a canvas that never repaints, a render loop that never stops, an intro
   animation that strands the bottle off-centre, and a drag that moves nothing. The
   texture hash is pinned because the shipped wrap is a derived file — cut, reflowed,
   re-saved — and a swapped source with no re-run of prepare-wrap.py would silently put
   the removed text back into the render.

   It then runs the same promises twice over, once per render layer: WebGL gives a real
   mesh and a denied context gives the painter, and the two must agree about the bottle's
   proportions, its panels and where the printed wrap stops. Run: npm run spin */
import { chromium } from 'playwright'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BASE_OVER_D, CAP_OVER_D, H_OVER_D, LABEL_OVER_D, WRAP_SPAN } from '../src/lib/bottleMeasure.js'

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
await p.waitForTimeout(600)

const frame = () => p.evaluate(() => document.querySelector('.spin-canvas').toDataURL('image/png'))
/* Copy whatever the stage is showing (2D canvas or WebGL back buffer) into a readable
   surface and measure the blue of the printed artwork down the centre column. Frame
   hashes prove a picture changed; this proves the picture is the *wrap* and that the
   centre of the view is the front panel at rest and bare plastic past the seam — the
   same numbers are asserted for both layers, so a mesh that renders nothing but white
   plastic cannot pass. */
/* Two animation frames, or 400 ms, whichever comes first: the first lets the component's
   own loop paint what the last input changed, the second guarantees that paint has
   reached the buffer before toDataURL asks for it. */
const settle = (page) =>
  page.evaluate(async () => {
    await new Promise((res) => {
      const t = setTimeout(res, 400)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          clearTimeout(t)
          res()
        }),
      )
    })
    return document.visibilityState
  })
/* Home is not decoration here: the intro swing owns φ for its first 1.5 s, so a
   "reference frame" taken before a press is a frame of easing, not of rest — and every
   determinism check below would compare against a moving target. One press hands φ to
   the test and cancels the swing, because the component gives up the angle as soon as
   the visitor touches the stage. */
const pin = async (page) => {
  await page.bringToFront()
  await page.locator('.spin-canvas').focus()
  await page.keyboard.press('Home')
  // back to the top and hold there: the reference frame has to be read from a page that
  // is not moving, and the stage only paints while it is on screen
  await page.evaluate(() => window.scrollTo(0, 0))
  await settle(page)
}
const stageBand = (page) =>
  page.evaluate(() => {
    const c = document.querySelector('.spin-canvas')
    const o = document.createElement('canvas')
    o.width = c.width
    o.height = c.height
    const g = o.getContext('2d')
    g.drawImage(c, 0, 0)
    const d = g.getImageData(Math.floor(o.width * 0.46), Math.floor(o.height * 0.4), Math.ceil(o.width * 0.08), Math.ceil(o.height * 0.2)).data
    const n = d.length / 4
    const lum = new Float64Array(n)
    let blue = 0
    let sum = 0
    for (let k = 0, i = 0; i < d.length; k++, i += 4) {
      const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      lum[k] = l
      sum += l
      if (d[i + 2] > 95 && d[i + 2] > d[i] + 26) blue++
    }
    const mean = sum / n
    let sq = 0
    for (let k = 0; k < n; k++) sq += (lum[k] - mean) * (lum[k] - mean)
    return { blue: n ? blue / n : 0, std: Math.sqrt(sq / n) }
  })
await pin(p)
const f0 = await frame()

const probe = await p.evaluate(() => {
  const c = document.querySelector('.spin-canvas')
  const cs = getComputedStyle(c)
  const card = document.querySelector('.product-card')
  const img = document.querySelector('.product-img')
  return {
    ready: c.getAttribute('data-spin-ready'),
    layer: c.dataset.layer,
    canGL: (() => {
      try {
        const t = document.createElement('canvas')
        return !!(t.getContext('webgl2') || t.getContext('webgl'))
      } catch {
        return false
      }
    })(),
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

pass(`canvas mounted on the ${probe.layer} layer`, probe.ready === '1' && probe.size[0] > 100 && (probe.layer === 'mesh' || probe.has2d), JSON.stringify({ ready: probe.ready, layer: probe.layer, size: probe.size, backing: probe.backing }))
pass('a real frame was painted', f0.length > 20000, `${(f0.length / 1024) | 0} kB png`)
pass('the layer matches what the engine offers', probe.layer === (probe.canGL ? 'mesh' : 'flat'), `engine canGL=${probe.canGL} → layer=${probe.layer}`)
pass('the mesh is only chosen when a real context answers', probe.layer !== 'mesh' || probe.webgl, `webgl=${probe.webgl}`)
const blueFront = await stageBand(p)
pass('the wrap is on the tube: the centre column is the blue front panel', blueFront.blue > 0.35, `blue ${(blueFront.blue * 100) | 0}% structure ${blueFront.std.toFixed(1)}`)
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
const blueAfterTurn = await stageBand(p)
pass('and past the seam the tube is bare plastic', blueAfterTurn.blue < 0.05 && blueAfterTurn.std < 6, `blue ${(blueAfterTurn.blue * 100) | 0}% structure ${blueAfterTurn.std.toFixed(1)}`)
const panelAfter = await p.evaluate(() => document.querySelector('.spin-hint b').textContent.trim())
pass('the caption follows the angle', /bare/i.test(panelAfter), panelAfter)
/* One panel each way, so a wrap that is stuck on one face cannot pass: 8 × 0.085 = 0.68
   rad is 0.283 of the turn to the left, which is the directions panel. */
await p.keyboard.press('Home')
for (let i = 0; i < 8; i++) await p.keyboard.press('ArrowLeft')
await p.waitForTimeout(120)
const panelLeft = await p.evaluate(() => document.querySelector('.spin-hint b').textContent.trim())
pass('the other way round names the directions panel', /directions/i.test(panelLeft), panelLeft)
const blueLeft = await stageBand(p)
pass('…and the artwork is on the tube there too', blueLeft.std > 20, `blue ${(blueLeft.blue * 100) | 0}% structure ${blueLeft.std.toFixed(1)}`)
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
/* This is the third page in the browser, and a background page has its animation frames
   suspended outright: a suspended loop neither paints nor settles, so "the frame did not
   change" would describe Chromium's tab freezing rather than the component. Bring this
   context forward right before it is touched, and read frames only after two rAFs — the
   first lets the component's own loop paint, the second guarantees that paint has reached
   the buffer before toDataURL asks for it. */
const pumpedShot = async (page) => {
  const visible = await settle(page)
  const png = await page.evaluate(() => document.querySelector('.spin-canvas').toDataURL())
  const caption = await page.evaluate(() => document.querySelector('.spin-hint b')?.textContent)
  return { png, visible, caption, kb: Math.round(png.length / 1024) }
}
await mp.goto(BASE, { waitUntil: 'networkidle' })
await mp.waitForSelector('.spin-canvas[data-spin-ready="1"]', { timeout: 8000 }).catch(() => {})
await mp.waitForTimeout(600)
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
await mp.bringToFront()
await pin(mp)
const m0 = await pumpedShot(mp)
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
const m1 = await pumpedShot(mp)
/* The scroll that centres the card comes *after* the swipe on purpose. Under mobile
   emulation the layout viewport and the visual viewport are separate things, and a
   scrollIntoView on the canvas moves one without the other: the rect the test reads then
   no longer matches where the browser thinks the element is, the stage decides it is off
   screen, and an off-screen stage does not paint — which is exactly the behaviour that
   keeps a hidden turntable from burning a phone's battery. Measuring the disclosures
   centred is still the right way to measure them, just not in the middle of a swipe. */
await mp.evaluate(() => document.querySelector('.spin-canvas').scrollIntoView({ block: 'center' }))
await mp.waitForTimeout(500)
const geo = await mp.evaluate(() => {
  const r = (el) => { const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), h: Math.round(b.height) } }
  return { canvas: r(document.querySelector('.spin-canvas')), card: r(document.querySelector('.product-card')), flag: r(document.querySelector('.spin-flag')), hint: r(document.querySelector('.spin-hint')) }
})
pass('mobile: a touch pointer turns it, and the stage is finger-sized', m.h > 120 && m1.png !== m0.png, `${m.w}×${m.h}px, card ${geo.card.h}px tall, page ${m1.visible}, ${m0.kb}→${m1.kb} kB, "${m0.caption}"→"${m1.caption}"${m0.unsettled ? ' (baseline was still easing)' : ''}`)
pass('mobile: disclosures sit in the reserved band, inside the card', geo.flag.bottom <= geo.card.bottom + 1 && geo.flag.top >= geo.canvas.bottom && geo.hint.bottom <= geo.card.bottom + 1 && geo.hint.top >= geo.canvas.bottom - 1, JSON.stringify({ canvas: geo.canvas.bottom, flag: geo.flag.top + '→' + geo.flag.bottom, hint: geo.hint.top + '→' + geo.hint.bottom, card: geo.card.bottom }))
pass('mobile: no horizontal overflow from the stage', m.overflow === 0, `${m.overflow}px`)

await p.bringToFront() // the desktop page is foreground again for its own capture loop
await p.evaluate(() => document.querySelector('.product-card').scrollIntoView({ block: 'center' }))
await p.waitForTimeout(400)
/* A screenshot of the wrong mode is worse than no screenshot: it looks like evidence.
   So the capture loop refuses to shoot unless the canvas is the thing on screen. */
const capMode = await p.evaluate(() => ({ mode: document.querySelector('.spin-canvas').dataset.mode, on: document.querySelector('.spin-canvas').classList.contains('is-on') }))
pass('the stage is in 3D when the frames are captured', capMode.mode === 'spin' && capMode.on, JSON.stringify(capMode))
/* The wrap ends 14 presses from centre, so the review frames are aimed at what is
   actually on the tube: front, facts, the far edge of the print, bare, and the back. */
for (const [n, keys] of [['a', 0], ['b', 9], ['c', 12], ['d', 16], ['e', 37]]) {
  await p.evaluate(() => document.querySelector('.spin-canvas').focus())
  await p.keyboard.press('Home')
  for (let i = 0; i < keys; i++) await p.keyboard.press('ArrowRight')
  await p.waitForTimeout(90)
  await p.locator('.product-card').screenshot({ path: `shots/14-spin-${n}.png` })
}
await mp.locator('.product-card').screenshot({ path: 'shots/14-spin-mobile.png' })


/* ── the painter is a live path, not a museum piece ──────────────────────────
   Headless Firefox has no WebGL at all, and any visitor on a blocked GPU gets the 2D
   layer. Removing the context from the page is therefore not a hypothetical: it is the
   downgrade these browsers take. The whole set of turntable promises is re-run there,
   because a fallback nobody tests is a crash waiting for a driver update. */
const fkCtx = await b.newContext({ viewport: { width: 1440, height: 900 } })
await fkCtx.addInitScript(() => {
  const get = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (type, opts) {
    if (/webgl/i.test(String(type))) return null
    return get.call(this, type, opts)
  }
})
const fp = await fkCtx.newPage()
const ferrs = []
fp.on('pageerror', (e) => ferrs.push(e.message))
await fp.goto(BASE, { waitUntil: 'networkidle' })
await fp.waitForSelector('.spin-canvas[data-spin-ready="1"]', { timeout: 8000 }).catch(() => {})
await fp.waitForTimeout(600)
const flat = await fp.evaluate(() => {
  const c = document.querySelector('.spin-canvas')
  return { layer: c.dataset.layer, ready: c.getAttribute('data-spin-ready'), has2d: !!c.getContext('2d'), size: [c.clientWidth, c.clientHeight], hint: document.querySelector('.spin-hint')?.innerText.replace(/\s+/g, ' ').trim() }
})
const fframe = () => fp.evaluate(() => document.querySelector('.spin-canvas').toDataURL('image/png'))
await pin(fp)
const g0 = await fframe()
pass('WebGL denied → the layer says flat before any context is taken', flat.layer === 'flat' && flat.has2d && flat.ready === '1' && flat.size[0] > 100, JSON.stringify(flat))
pass('the fallback paints a real frame', g0.length > 20000, `${(g0.length / 1024) | 0} kB png`)
const flatBlue = await stageBand(fp)
pass('the fallback puts the same front panel at the centre', flatBlue.blue > 0.35, `blue ${(flatBlue.blue * 100) | 0}% structure ${flatBlue.std.toFixed(1)}`)
await fp.locator('.spin-canvas').focus()
for (let i = 0; i < 18; i++) await fp.keyboard.press('ArrowRight')
await settle(fp)
const gTurn = await fframe()
const flatBare = await stageBand(fp)
pass('the fallback turns, and goes bare past the seam like the mesh', gTurn !== g0 && flatBare.blue < 0.05 && flatBare.std < 6, `blue ${(flatBare.blue * 100) | 0}% structure ${flatBare.std.toFixed(1)}`)
await fp.keyboard.press('Home')
for (let i = 0; i < 8; i++) await fp.keyboard.press('ArrowLeft')
await fp.waitForTimeout(120)
const flatPanel = await fp.evaluate(() => document.querySelector('.spin-hint b').textContent.trim())
pass('the fallback names the same panels', /directions/i.test(flatPanel), flatPanel)
await fp.keyboard.press('Home')
await fp.waitForTimeout(150)
pass('the fallback is deterministic too', (await fframe()) === g0, 'byte-identical on Home')
pass('no page errors on the fallback', ferrs.length === 0, ferrs.slice(0, 2).join(' | '))

/* ── the model and the photograph may not drift apart ──────────────────────
   Every proportion the two renderers use comes from scripts/measure-bottle.py reading
   public/product.png. The numbers are hard-coded in bottleMeasure.js so the render is
   deterministic; this re-measures the shipped photo and fails if they no longer agree,
   which is how a replaced product shot would otherwise ship a bottle of the wrong shape. */
let measured = null
let measNote = ''
try {
  measured = JSON.parse(execFileSync('python3', [join(ROOT, 'scripts', 'measure-bottle.py')], { encoding: 'utf8' }))
} catch (e) {
  measNote = String(e.message).split('\n').find((l) => l.trim() && !l.startsWith('    ')) || 'unknown'
}
if (!measured) {
  pass('the geometry is re-measured from the photo', false, `scripts/measure-bottle.py did not run: ${measNote} (needs python3 + Pillow)`)
} else {
  const r = measured.ratios
  const want = { height_over_diameter: H_OVER_D, label_over_diameter: LABEL_OVER_D, cap_over_diameter: CAP_OVER_D, base_over_diameter: BASE_OVER_D }
  const drift = Object.entries(want).filter(([k, v]) => Math.abs(r[k] - v) > 0.0015).map(([k, v]) => `${k} ${r[k]} vs ${v}`)
  pass('the geometry is re-measured from the photo', drift.length === 0, drift.length ? drift.join(', ') : `H/D ${r.height_over_diameter} · label ${r.label_over_diameter} · cap ${r.cap_over_diameter} · base ${r.base_over_diameter}`)
  const span = (1026 / 469) * r.label_over_diameter / Math.PI
  pass('the wrap still covers the share the model assumes', Math.abs(span - WRAP_SPAN) < 0.002, `${(span * 100).toFixed(1)}% of a turn (model ${(WRAP_SPAN * 100).toFixed(1)}%)`)
}

pass('zero page errors across every pass', errors.length === 0, errors.slice(0, 2).join(' | '))
console.log(`\n${results.filter(Boolean).length}/${results.length} spin checks passed`)
await b.close()
process.exit(results.every(Boolean) ? 0 : 1)

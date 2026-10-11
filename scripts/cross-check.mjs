/* Runs the same design contract through Chromium, Firefox and WebKit, plus a
   coarse-pointer (touch) context and a print media emulation. Everything here is
   something a single engine could get wrong: sticky under overflow:clip, SVG
   dominant-baseline, mask-composite, @property, text-stroke, pointer gating. */
import { chromium, firefox, webkit } from 'playwright'

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:5173/'
const ENGINES = [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]
const rows = []
let failures = 0

// a real capture forces the engine to produce a frame; /dev/null is not a
// writable path and the failure would be swallowed silently
const frame = (p) => p.screenshot({ path: 'shots/.frame.png' })
/* Some headless builds deliver no animation frames, which turns every
 * rAF-throttled handler (the parallax loop) into a one-shot. rafTicks counts the
 * frames the page actually received, so an rAF-dependent assertion can be
 * reported as unmeasurable instead of blamed on the page. */
const jump = (p, sel, off = 8) =>
  p.evaluate(
    ([q, o]) => {
      const el = document.querySelector(q)
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - o, behavior: 'instant' })
    },
    [sel, off],
  )

const probe = async (p) =>
  p.evaluate(() => {
    const cs = (el, pseudo) => getComputedStyle(el, pseudo || null)
    const rect = (el) => el.getBoundingClientRect()
    const words = [...document.querySelectorAll('.display .kinetic-word')]
    const stacks = [...document.querySelectorAll('.stack-card')].map((c) => ({ pos: cs(c).position, top: parseFloat(cs(c).top) }))
    const circle = rect(document.querySelector('.mol-atom circle'))
    const label = rect(document.querySelector('.mol-atom text'))
    return {
      sections: document.querySelectorAll('main > section').length,
      numerals: [...document.querySelectorAll('.section[data-num]')].map((s) => s.dataset.num).join(','),
      h1: document.querySelector('.display').innerText.replace(/\n/g, ' '),
      spaced: /\s/.test(document.querySelector('.display').textContent),
      kineticOn: document.querySelectorAll('.kinetic.is-on').length,
      kineticCount: document.querySelectorAll('.kinetic').length,
      wordMasked: cs(words[0]).overflowX === 'hidden' || cs(words[0]).overflow === 'hidden',
      wordWide: words.every((w) => rect(w).width > 4),
      marqueeName: cs(document.querySelector('.marquee-track')).animationName,
      marqueeMasked: (cs(document.querySelector('.marquee')).maskImage || cs(document.querySelector('.marquee')).webkitMaskImage || 'none').includes('linear-gradient'),
      stackCount: stacks.length,
      stackSticky: stacks.every((s) => s.pos === 'sticky'),
      stackRising: stacks.every((s, i) => i === 0 || s.top > stacks[i - 1].top),
      railTicks: document.querySelectorAll('.rail-tick').length,
      edgePseudo: cs(document.querySelector('.stat-card.edge'), '::before').backgroundImage.includes('gradient'),
      glassBlur: (cs(document.querySelector('.stat-card')).backdropFilter || 'none') !== 'none',
      stroke: parseFloat(cs(document.querySelector('.display .is-outline')).webkitTextStrokeWidth || 0),
      dashoffset: parseFloat(cs(document.querySelector('.mol-bond line')).strokeDashoffset) || 0,
      // SVG baseline handling differs per engine: is the label optically centred?
      labelDrift: Math.round(Math.abs(label.top + label.height / 2 - (circle.top + circle.height / 2)) * 10) / 10,
      fontsLoaded: document.fonts.status,
      stageOverflow: (() => { const el = document.querySelector('.product-stage'); return el.scrollWidth - el.clientWidth })(),
      heroClipped: ['clip', 'hidden'].includes(getComputedStyle(document.querySelector('.hero')).overflowX),
      marqueeDur: (() => { const a = document.getAnimations().find((x) => x.animationName === 'marquee'); return a ? Math.round(a.effect.getComputedTiming().duration) : -1 })(),
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      pageHeight: document.documentElement.scrollHeight,
    }
  })

for (const [name, mod] of ENGINES) {
  let browser
  try {
    browser = await mod.launch()
  } catch (e) {
    rows.push({ engine: name, error: 'launch failed: ' + e.message.split('\n')[0] })
    failures += 1
    continue
  }

  /* ── desktop, motion allowed ── */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  p.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text()))
  try {
    await p.goto(BASE, { waitUntil: 'networkidle' })
    await p.waitForSelector('.stack-card', { timeout: 20000 })
    await p.waitForTimeout(500)
    const rafTicks = await p.evaluate(
      () =>
        new Promise((res) => {
          let n = 0
          const t0 = performance.now()
          const loop = () => {
            n += 1
            if (performance.now() - t0 < 500) requestAnimationFrame(loop)
            else res(n)
          }
          requestAnimationFrame(loop)
        }),
    )
    // the hero's kinetic reveal is applied from a frame callback, and a slow engine
  // can still be pre-reveal when the probe lands — wait for it, bounded, so a
  // genuine non-reveal still reads as a failure instead of being swallowed
  await p.waitForFunction(() => document.querySelectorAll('.kinetic.is-on').length >= 1, null, { timeout: 8000 }).catch(() => {})
  const at = await probe(p)

    await jump(p, '#naming')
    await p.waitForTimeout(300)
    await frame(p)
    await p.waitForTimeout(300)
    const before = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.mol-bond line')).strokeDashoffset) || 0)
    await jump(p, '#facts')
    await p.waitForTimeout(300)
    await frame(p)
    await p.waitForTimeout(300)
    const after = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.mol-bond line')).strokeDashoffset) || 0)
    const track = await p.evaluate(
      () =>
        new Promise((res) => {
          const t = document.querySelector('.marquee-track')
          const x = t.getBoundingClientRect().left
          setTimeout(() => res(Math.abs(x - t.getBoundingClientRect().left)), 400)
        }),
    )
    const scrolled = await p.evaluate(() => ({
      rail: document.querySelector('.rail-tick.is-current')?.getAttribute('href') || 'none',
      nav: document.querySelector('.nav-links a[data-active]')?.getAttribute('href') || 'none',
      scroll: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scroll')) || 0,
      py: getComputedStyle(document.querySelector('.product-stage')).getPropertyValue('--py').trim() || 'unset',
    }))
    await p.screenshot({ path: `shots/x-${name}-naming.png` })

    /* ── touch: coarse pointer must not run pointer effects ── */
    const tctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
    const tp = await tctx.newPage()
    const terrs = []
    tp.on('pageerror', (e) => terrs.push(e.message))
    await tp.goto(BASE, { waitUntil: 'networkidle' })
    await tp.waitForSelector('.product-card')
    await tp.waitForTimeout(400)
    await tp.locator('.product-card').tap()
    await tp.waitForTimeout(250)
    const touch = await tp.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      light: !!document.querySelector('.cursor-light'),
      mx: document.querySelector('.stat-card')?.style.getPropertyValue('--mx') || 'unset',
      tilt: document.querySelector('[data-tilt]')?.style.transform || 'unset',
      stackPos: getComputedStyle(document.querySelector('.stack-card')).position,
      scrollyCols: getComputedStyle(document.querySelector('.scrolly')).gridTemplateColumns.trim(),
      heroClip: ['clip', 'hidden'].includes(getComputedStyle(document.querySelector('.hero')).overflowX),
      finePointer: matchMedia('(pointer: fine)').matches,
    }))
    await tp.screenshot({ path: `shots/x-${name}-touch.png` })

    /* ── print media ── */
    await p.emulateMedia({ media: 'print' })
    await p.waitForTimeout(200)
    const print = await p.evaluate(() => {
      const vis = (sel) => {
        const el = document.querySelector(sel)
        return el ? getComputedStyle(el).display : 'absent'
      }
      return {
        nav: vis('.nav'),
        ticker: vis('.ticker'),
        rail: vis('.rail'),
        /* a canvas that survives into print is the one element on the page that can
           come out as a black rectangle — and `display:none` on it is not enough, the
           photograph underneath is held at opacity:0 while 3D is on, so the print would
           show an empty card. Both halves are asserted. */
        productImg: (() => {
          const el = document.querySelector('.product-img')
          return el ? `${getComputedStyle(el).display}/${getComputedStyle(el).opacity}` : 'absent'
        })(),
        wordmark: vis('.footer-wordmark'),
        stackPos: document.querySelector('.stack-card') ? getComputedStyle(document.querySelector('.stack-card')).position : 'n/a',
      }
    })
    let pdfBytes = 0
    if (name === 'chromium') {
      await p.emulateMedia({ media: 'screen' })
      const pdf = await p.pdf({ format: 'A4', printBackground: false })
      pdfBytes = pdf.length
    }

    rows.push({
      engine: name,
      ...at,
      rafTicks,
      draw: { before, after, inked: after < before },
      marqueeMovePx: Math.round(track),
      scrolled,
      touch,
      print,
      pdfKB: Math.round(pdfBytes / 1024),
      errors: errs.length + terrs.length,
      errorSamples: [...errs, ...terrs].slice(0, 3),
    })
    await tctx.close()
    await ctx.close()
  } catch (e) {
    rows.push({ engine: name, error: e.message.split('\n')[0] })
    failures += 1
  }
  await browser.close()
}

/* ── report ── */
for (const r of rows) {
  console.log(`\n── ${r.engine} ${r.error ? '· FAILED: ' + r.error : ''}`)
  if (r.error) continue
  const line = (label, good, detail) => {
    if (!good) failures += 1
    console.log(`   ${good ? '✓' : '✗'} ${label.padEnd(26)} ${detail}`)
  }
  // a check this environment cannot measure is reported, not silently passed
  const note = (label, detail) => console.log(`   ~ ${label.padEnd(26)} ${detail}`)
  line('sections / numerals', r.sections === 10 && r.numerals === '01,02,03,04,05,06,07,08,09', `${r.sections} · ${r.numerals}`)
  line('h1 readable text', r.h1.includes(' ') && r.spaced, JSON.stringify(r.h1))
  line('kinetic reveals on mount', r.kineticOn >= 1, `${r.kineticOn} of ${r.kineticCount} blocks is-on`)
  line('word masks open', r.wordMasked && r.wordWide, `masked=${r.wordMasked}`)
  line('marquee runs + fades', r.marqueeName === 'marquee' && r.marqueeMovePx > 2 && r.marqueeMasked, `${r.marqueeMovePx}px moved`)
  line('sticky stack rises', r.stackCount === 3 && r.stackSticky && r.stackRising, `${r.stackCount} cards · sticky=${r.stackSticky} · rising=${r.stackRising}`)
  if (r.rafTicks > 2) line('schematic inks', r.draw.inked, `dashoffset ${r.draw.before} → ${r.draw.after} · ${r.rafTicks} frames`)
  else note('schematic inks', `unmeasurable — page received ${r.rafTicks} animation frames`)
  line('svg labels centred', r.labelDrift <= 3, `drift ${r.labelDrift}px`)
  if (r.rafTicks > 2)
    line('rail tracks section', r.scrolled.rail !== 'none', `${r.scrolled.rail} · nav ${r.scrolled.nav} · --scroll ${r.scrolled.scroll.toFixed(3)} · ${r.rafTicks} frames`)
  else note('rail tracks section', `unmeasurable — page received ${r.rafTicks} animation frames`)
  line('hero contains the projection', r.heroClipped && r.overflowX === 0, `hero overflow=${r.heroClipped ? 'clip' : 'VISIBLE'} · page ${r.overflowX}px · stage self ${r.stageOverflow}px (by design)`)
  line('touch: page still fits', r.touch.overflow === 0, `${r.touch.overflow}px`)
  line('marquee duration parses', r.marqueeDur > 1000, `${r.marqueeDur}ms (var() in the animation shorthand)`)
  line('glass + text-stroke', r.glassBlur && r.stroke > 0.4, `blur=${r.glassBlur} stroke=${r.stroke}`)
  line('edge pseudo paints', r.edgePseudo, `conic/mask ${r.edgePseudo ? 'ok' : 'missing'}`)
  line('desktop overflow 0', r.overflowX === 0, `${r.overflowX}px · height ${r.pageHeight}px`)
  line('touch: pointer fx off', !r.touch.light && r.touch.mx === 'unset' && r.touch.finePointer === false, `fine=${r.touch.finePointer} light=${!r.touch.light ? 'not mounted' : 'MOUNTED'}`)
  line('touch: layout intact', r.touch.heroClip && r.touch.stackPos === 'static' && r.touch.scrollyCols.trim().split(/\s+/).length === 1, `overflow=${r.touch.overflow} stack=${r.touch.stackPos} cols=${r.touch.scrollyCols}`)
  line('print: chrome removed', r.print.nav === 'none' && r.print.ticker === 'none' && r.print.stackPos === 'static', `nav=${r.print.nav} stack=${r.print.stackPos}${r.pdfKB ? ` · pdf ${r.pdfKB}KB` : ''}`)
  line('print: the photograph prints at full opacity', r.print.productImg === 'block/1', `img=${r.print.productImg}`)
  line('zero errors', r.errors === 0, `${r.errors}${r.errorSamples.length ? ' · ' + r.errorSamples.join(' | ') : ''}`)
}

console.log(`\n${failures === 0 ? 'ALL CROSS-ENGINE CHECKS PASSED' : failures + ' cross-engine failures'}`)
process.exit(failures === 0 ? 0 : 1)

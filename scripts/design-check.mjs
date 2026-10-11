/* Verifies the v3 design layer in a real browser: ambient layers, kinetic type,
   marquees, the sticky ingredient stack, the pinned molecular scrolly, the
   reading rail, pointer effects, DV meters. Prints PASS/FAIL and writes r*.png. */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

mkdirSync('shots', { recursive: true })
const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:5173/'
const errors = []
const browser = await chromium.launch()
/* CSS sets scroll-behavior: smooth, so scrollIntoView/scrollBy are animated and a
   fixed wait can read mid-flight — land the page first, then measure. */
const jump = (pg, sel, off = 8) =>
  pg.evaluate(
    ([q, o]) => {
      const el = document.querySelector(q)
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - o, behavior: 'instant' })
    },
    [sel, off],
  )

/* ── structure + captures, motion suppressed so captures are stable ──────── */
const calm = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' })
const page = await calm.newPage()
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()))
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForSelector('.facts-panel')
await page.waitForTimeout(500)

const structure = await page.evaluate(() => {
  const before = getComputedStyle(document.body, '::before')
  const after = getComputedStyle(document.body, '::after')
  const bars = [...document.querySelectorAll('.dv-bar')].map((b) => b.querySelector('i')?.style.getPropertyValue('--w') ?? 'none')
  const stacks = [...document.querySelectorAll('.stack-card')].map((c) => {
    const cs = getComputedStyle(c)
    return { position: cs.position, top: cs.top }
  })
  const num = (v) => parseFloat(v) || 0
  return {
    aurora: before.backgroundImage.includes('radial-gradient') && before.position === 'fixed',
    grain: after.backgroundImage.includes('svg') && after.mixBlendMode === 'overlay' && after.pointerEvents === 'none',
    grainZ: after.zIndex,
    numerals: [...document.querySelectorAll('.section[data-num]')].map((s) => s.dataset.num).join(','),
    glassBackdrop: getComputedStyle(document.querySelector('.stat-card')).backdropFilter || 'n/a',
    bentoBlocks: document.querySelectorAll('.bento').length,

    // kinetic display type
    kineticWords: document.querySelectorAll('.kinetic-word').length,
    kineticMasked: getComputedStyle(document.querySelector('.kinetic-word')).overflow,
    kineticOn: document.querySelectorAll('.kinetic.is-on').length,
    kineticShown: getComputedStyle(document.querySelector('.kinetic-word > span')).transform,
    kineticOutline: getComputedStyle(document.querySelector('.display .kinetic-word > span.is-outline'))?.webkitTextStrokeWidth,

    // marquees
    marquees: document.querySelectorAll('.ticker .marquee').length,
    marqueeDupes: document.querySelectorAll('.marquee-row').length,
    marqueeMasked: getComputedStyle(document.querySelector('.marquee')).maskImage.includes('linear-gradient'),

    // sticky ingredient stack
    stackCards: stacks.length,
    stackSticky: stacks.every((s) => s.position === 'sticky'),
    stackOffsetsRise: stacks.length === 3 && stacks.every((s, i) => i === 0 || num(s.top) > num(stacks[i - 1].top)),
    stackOpaque: getComputedStyle(document.querySelector('.stack-card')).backdropFilter,

    // pinned schematic + steps
    molParts: [...document.querySelectorAll('.mol [data-part]')].length,
    molDraw: getComputedStyle(document.querySelector('.mol')).getPropertyValue('--draw').trim(),
    steps: document.querySelectorAll('.scrolly-step').length,
    activeSteps: document.querySelectorAll('.scrolly-step.is-active').length,
    dimmedGroups: document.querySelectorAll('.mol [data-dim]').length,

    // reading rail + progress
    railTicks: document.querySelectorAll('.rail-tick').length,
    progressTransform: getComputedStyle(document.querySelector('.progress')).transform,

    // hero extras
    heroPills: document.querySelectorAll('.hero-pills li').length,
    heroSide: !!document.querySelector('.hero-side'),
    kenBurns: getComputedStyle(document.querySelector('.product-img')).animationName,
    edgeConic: getComputedStyle(document.querySelector('.stat-card.edge'), '::before').backgroundImage.includes('conic-gradient'),
    footerWord: !!document.querySelector('.footer-wordmark'),
    footerStroke: getComputedStyle(document.querySelector('.footer-wordmark')).webkitTextStrokeWidth,

    // panel meters
    dvBars: bars,
    counters: [...document.querySelectorAll('.stat-value .num')].map((n) => n.textContent).join(' '),
    displaySize: getComputedStyle(document.querySelector('.display')).fontSize,
    docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,

    // things that must stay gone
    hasFaq: !!document.querySelector('#faq'),
    hasLedger: !!document.querySelector('.ledger'),
    deadRules: document.querySelectorAll('.faq-item, .origin-card, .disclosure, .ing-note').length,
    sections: document.querySelectorAll('main > section').length,
    pcts: [...document.querySelectorAll('.facts-pct')].map((el) => el.textContent.trim()),
  }
})

await page.screenshot({ path: 'shots/r1-hero.png' })
for (const [sel, name] of [
  ['#about', 'r2-positioning'],
  ['#formula', 'r3-formula'],
  ['#naming', 'r4-naming'],
  ['#facts', 'r5-facts'],
  ['#reviews', 'r6-reviews'],
  ['#quality', 'r7-quality'],
  ['#social', 'r8-social'],
]) {
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'start' }), sel)
  await page.waitForTimeout(500)
  await page.screenshot({ path: `shots/${name}.png` })
}
const tall = await page.evaluate(() => document.documentElement.scrollHeight)

const mobile = await (async () => {
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, reducedMotion: 'reduce' })
  const p3 = await mob.newPage()
  p3.on('pageerror', (e) => errors.push('mobile pageerror: ' + e.message))
  await p3.goto(BASE, { waitUntil: 'networkidle' })
  await p3.waitForSelector('.product-img')
  await p3.waitForTimeout(400)
  const m = await p3.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    toggleVisible: getComputedStyle(document.querySelector('.nav-toggle')).display,
    displaySize: getComputedStyle(document.querySelector('.display')).fontSize,
    pillsHidden: getComputedStyle(document.querySelector('.hero-pills')).display,
    sideHidden: getComputedStyle(document.querySelector('.hero-side')).display,
    railHidden: getComputedStyle(document.querySelector('.rail')).display,
    stackStatic: getComputedStyle(document.querySelector('.stack-card')).position,
    scrollyStatic: getComputedStyle(document.querySelector('.scrolly-viz')).position,
    scrollyCols: getComputedStyle(document.querySelector('.scrolly')).gridTemplateColumns,
  }))
  await p3.screenshot({ path: 'shots/r9-mobile-hero.png' })
  await p3.evaluate(() => document.querySelector('#formula').scrollIntoView())
  await p3.waitForTimeout(400)
  await p3.screenshot({ path: 'shots/r10-mobile-formula.png' })
  await mob.close()
  return m
})()
await calm.close()

/* ── behaviour needs motion allowed ─────────────────────────────────────── */
const live = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const p2 = await live.newPage()
p2.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
await p2.goto(BASE, { waitUntil: 'networkidle' })
await p2.waitForSelector('.stack-card')

const marquee = await p2.evaluate(() => {
  const t = document.querySelector('.marquee-track')
  const before = t.getBoundingClientRect().left
  return new Promise((res) =>
    setTimeout(() => res({ name: getComputedStyle(t).animationName, moved: Math.abs(before - t.getBoundingClientRect().left) > 2 }), 420),
  )
})

// the scrolly: which step is active, and what the schematic has inked, follow the line
await jump(p2, '#naming')
await p2.waitForTimeout(450)
const readScrolly = () =>
  p2.evaluate(() => ({
    active: [...document.querySelectorAll('.scrolly-step')].findIndex((x) => x.classList.contains('is-active')),
    litTag: document.querySelector('.mol-tag[data-on]')?.textContent || '',
    vizSticky: getComputedStyle(document.querySelector('.scrolly-viz')).position,
    // measure the rendered result, not the custom property (a clamp() in a var is
    // reported unresolved by getComputedStyle)
    bondOffset: parseFloat(getComputedStyle(document.querySelector('.mol-bond line')).strokeDashoffset) || 0,
    atomOpacity: +getComputedStyle(document.querySelector('.mol-atom text')).opacity,
    sectionP: getComputedStyle(document.querySelector('#naming')).getPropertyValue('--p').trim(),
  }))
const stepTop = await readScrolly()
await jump(p2, '.scrolly-steps > li:last-child', -320)
await p2.waitForTimeout(500)
const stepDown = await readScrolly()

// rail + nav must track the section owning the reading line
await jump(p2, '#formula')
await p2.waitForTimeout(450)
const railNow = await p2.evaluate(() => ({
  current: document.querySelector('.rail-tick.is-current')?.getAttribute('href') || 'none',
  navActive: document.querySelector('.nav-links a[data-active]')?.getAttribute('href') || 'none',
  progress: getComputedStyle(document.querySelector('.progress')).transform,
  lightBlend: getComputedStyle(document.querySelector('.cursor-light')).mixBlendMode,
}))

// pointer effects, on the elements that actually carry them
await jump(p2, '#top', 0)
await p2.waitForTimeout(350)
const pc = await p2.locator('.product-card').boundingBox()
await p2.mouse.move(pc.x + pc.width * 0.62, pc.y + pc.height * 0.3)
await p2.waitForTimeout(220)
const tilt = await p2.evaluate(() => document.querySelector('[data-tilt]')?.style.transform || 'unset')
const ken = await p2.evaluate(() => getComputedStyle(document.querySelector('.product-img')).transform)

await jump(p2, '#about')
await p2.waitForTimeout(350)
const edge = await p2.locator('.stat-card.edge').first().boundingBox()
await p2.mouse.move(edge.x + edge.width * 0.5, edge.y + edge.height * 0.5)
await p2.waitForTimeout(900) /* the edge fades over 0.5s — measure after it settles */
const pointer = await p2.evaluate(() => {
  const c = document.querySelector('.stat-card.edge')
  return {
    spotlight: c.style.getPropertyValue('--mx') || 'unset',
    edgeOpacity: +getComputedStyle(c, '::before').opacity,
    lifted: getComputedStyle(c).transform,
  }
})
const cta = await p2.locator('.nav-cta').boundingBox()
await p2.mouse.move(cta.x + cta.width * 0.85, cta.y + cta.height * 0.7)
await p2.waitForTimeout(220)
const mag = await p2.evaluate(() => ({
  x: document.querySelector('.nav-cta').style.getPropertyValue('--mag-x') || 'unset',
  transform: getComputedStyle(document.querySelector('.nav-cta')).transform,
}))

await jump(p2, '#formula')
await p2.waitForTimeout(400)
await p2.screenshot({ path: 'shots/r11-stack.png' })
await jump(p2, '#naming')
await p2.waitForTimeout(400)
await p2.screenshot({ path: 'shots/r12-scrolly-mid.png' })
await jump(p2, '#naming')
await p2.evaluate(() => window.scrollBy({ top: 620, behavior: 'instant' }))
await p2.waitForTimeout(400)
await p2.screenshot({ path: 'shots/r13-scrolly-drawn.png' })

// counters must settle on the real values, not stay at 0
await jump(p2, '#about')
await p2.waitForTimeout(1700)
const counted = await p2.evaluate(() => [...document.querySelectorAll('.stat-value .num')].map((n) => n.textContent).join(' '))
// The chips are absolutely placed in the same corners as the retail-unit tag and
// sit beside the copy column, so disjoint rects are a layout invariant, not a
// taste question. Measured on the live context because prefers-reduced-motion
// turns the chip layer off by design. Only widths where the chips actually render
// can prove separation — a hidden layer passes vacuously — so the ≤900px
// behaviour is asserted as its own, different fact.
const chipAudit = {}
for (const w of [1440, 1280, 1120, 1024, 900]) {
  await p2.setViewportSize({ width: w, height: 880 })
  await p2.waitForTimeout(320)
  chipAudit[w] = await p2.evaluate(() => {
    const box = (el) => el.getBoundingClientRect()
    const shown = (r) => r.width > 0 && r.height > 0
    const chips = [...document.querySelectorAll('.hero-pills li')].map(box).filter(shown)
    const others = [
      document.querySelector('.product-tag'),
      ...document.querySelectorAll('.display, .hero-sub, .hero-badges, .eyebrow'),
    ]
      .filter(Boolean)
      .map(box)
      .filter(shown)
    const hits = chips.filter((r) =>
      others.some((o) => Math.min(o.right, r.right) - Math.max(o.left, r.left) > 0 && Math.min(o.bottom, r.bottom) - Math.max(o.top, r.top) > 0),
    ).length
    const tag = document.querySelector('.product-tag')
    return { chips: chips.length, hits, tagVisible: !!tag && shown(box(tag)) }
  })
}
console.log('hero chip audit (live context)', JSON.stringify(chipAudit))
await p2.setViewportSize({ width: 1440, height: 900 })
await p2.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
await p2.waitForTimeout(300)
await p2.screenshot({ path: 'shots/r14-hero-live.png' })

await live.close()

console.log(JSON.stringify({ ...structure, marquee, stepTop, stepDown, railNow, pointer, counted, mobile, pageHeightPx: tall, errors: errors.length }, null, 2))
errors.slice(0, 10).forEach((e) => console.log(' ✗', e))

let n = 0
const results = []
const pass = (label, ok) => {
  n += 1
  results.push(Boolean(ok))
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${label}`)
  return Boolean(ok)
}

const checks = [
  pass('aurora mesh + film grain over content', structure.aurora && structure.grain && structure.grainZ !== 'auto'),
  pass('9 section numerals, contiguous 01→09', structure.numerals === '01,02,03,04,05,06,07,08,09'),
  pass(`kinetic type: ${structure.kineticWords} masked words, hero revealed on mount`, structure.kineticWords > 30 && structure.kineticMasked === 'hidden' && structure.kineticOn >= 2 && structure.kineticShown === 'none'),
  pass('hero chips clear of the tag and the copy (4 widths)', [1440, 1280, 1120, 1024].every((w) => chipAudit[w].tagVisible && chipAudit[w].chips === 4 && chipAudit[w].hits === 0)),
  pass('chip layer off at 900px (hidden, not missing)', chipAudit[900].chips === 0 && chipAudit[900].tagVisible),
  pass('outline word uses a text stroke', parseFloat(structure.kineticOutline) > 0.5),
  pass('two marquees, each with a duplicated row + mask edge', structure.marquees === 2 && structure.marqueeDupes === 4 && structure.marqueeMasked),
  pass('marquee actually moves (motion allowed)', marquee.name === 'marquee' && marquee.moved),
  pass('formula = 3 sticky stack cards on rising offsets', structure.stackCards === 3 && structure.stackSticky && structure.stackOffsetsRise),
  pass('stack cards are opaque, not frosted (no bleed-through)', structure.stackOpaque === 'none'),
  pass('naming scrolly: 4 steps, one active, regions dim', structure.steps === 4 && structure.activeSteps === 1 && structure.dimmedGroups > 0 && structure.molParts >= 12),
  pass(`active step follows the reading line (${stepTop.active}→${stepDown.active}, tag ${stepTop.litTag}→${stepDown.litTag})`, stepTop.active === 0 && stepDown.active >= stepTop.active + 1 && stepTop.litTag !== stepDown.litTag),
  pass(`schematic inks itself (bond offset ${stepTop.bondOffset}→${stepDown.bondOffset}, label opacity ${stepTop.atomOpacity}→${stepDown.atomOpacity})`, stepDown.bondOffset < 0.08 && stepDown.atomOpacity > 0.9),
  pass('viz is pinned on desktop, static on mobile', stepTop.vizSticky === 'sticky' && mobile.scrollyStatic === 'static'),
  pass('reading rail: 9 ticks + scroll progress', structure.railTicks === 9 && structure.progressTransform.startsWith('matrix')),
  pass(`rail + nav both follow the reading line (${railNow.current}, ${railNow.navActive})`, railNow.current === '#formula' && railNow.navActive === '#formula'),
  pass('pointer light is screen-blended', railNow.lightBlend === 'screen'),
  pass('hero: 4 floating label facts + side rail + Ken Burns', structure.heroPills === 4 && structure.heroSide && structure.kenBurns === 'breathe'),
  pass('conic edge on stat cards', structure.edgeConic),
  pass('footer wordmark, outlined', structure.footerWord && parseFloat(structure.footerStroke) > 0),
  pass('2 panel rows, every one with a real %DV (no phantom dagger)', structure.dvBars.length === 2 && structure.dvBars.every((w) => /%$/.test(w)) && !structure.dvBars.includes('none') && structure.pcts.join(',') === '5%,364%'),
  pass('FAQ / Evidence / commentary sections stay gone', structure.hasFaq === false && structure.hasLedger === false && structure.deadRules === 0 && structure.sections === 10),
  pass('counters resolve to real values (calm + live)', counted.replace(/\s/g, '') === '30130' && structure.counters.replace(/\s/g, '').length > 0),
  pass(`spotlight + conic edge + tilt + magnetic all respond`, pointer.spotlight !== 'unset' && pointer.edgeOpacity > 0.9 && tilt !== 'unset' && mag.x !== 'unset' && mag.transform.startsWith('matrix')),
  pass(`Ken Burns keeps the product alive (${ken.slice(0, 28)}…)`, ken.startsWith('matrix') && ken !== 'none'),
  pass('reduced-motion: no parallax-driven transforms', structure.kineticShown === 'none'),
  pass('no horizontal overflow desktop+mobile', structure.docOverflow === 0 && mobile.overflow === 0),
  pass('mobile: scrolly collapses to one column', /^[0-9.]+px$/.test(mobile.scrollyCols.trim())),
  pass('mobile: hamburger, scaled display, decorative layers off', mobile.toggleVisible === 'grid' && parseFloat(mobile.displaySize) > 32 && mobile.pillsHidden === 'none' && mobile.sideHidden === 'none' && mobile.railHidden === 'none' && mobile.stackStatic === 'static'),
  pass('zero console/page errors', errors.length === 0),
]
console.log(`\n${checks.filter(Boolean).length}/${checks.length} design checks passed · page height ${tall}px`)
await browser.close()
process.exit(checks.every(Boolean) ? 0 : 1)

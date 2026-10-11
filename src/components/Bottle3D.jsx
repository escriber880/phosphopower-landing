import { useCallback, useEffect, useRef, useState } from 'react'
import { hero } from '../data/site.js'
/* `?inline` asks Vite for a data URI regardless of assetsInlineLimit, so the single-file
   build carries the wrap without ever gaining an absolute reference the standalone gate
   would (rightly) reject. Same string in dev and in the artifact — one code path. */
import wrapUrl from '../assets/label-wrap.jpg?inline'

const TAU = Math.PI * 2

/* ── the mapping, and why it is not a gradient trick ─────────────────────────
   The artwork is a flat wrap. A surface point at angle θ from the front projects to
   x = cx + R·sin θ, so sampling one source column per *screen* column through
   θ = asin((x − cx)/R) + φ derives the crowding of texture near the silhouette
   instead of faking it with a dark edge — that crowding is what makes a printed label
   read as a solid. Only the near hemisphere is visible, so every column has exactly one
   answer. The label does not close on itself: the artwork's own aspect (1026×469 ⇒
   circumference / label height = 2.19) against the photographed unit's proportions
   puts the printed wrap at ~88% of the turn, so u spans ±(SPAN·τ)/2 and the rest is
   bare plastic, which is what a glued wrap actually looks like.            */
const SPAN = 0.88
const TOverW = 1.7 // total height / visible width, from the photographed unit
const LABEL_V = 0.74 // share of the total height the printed label covers
const RIBS = 44
const LIGHT = -0.62
const SPEC = 0.34
const RIM = 0.055 // elliptical bulge of the top and bottom rims, as a share of R

// angle (−π..π) of a surface point relative to the viewer
const wrapAngle = (a) => ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI

function frame(φ, w, h) {
  const span = TAU * SPAN
  let T = h * 0.94
  let W = T / TOverW
  if (W > w * 0.92) {
    W = w * 0.92
    T = W * TOverW
  }
  const R = W / 2
  const top = (h - T) / 2
  const labelH = LABEL_V * T
  const capH = (1 - LABEL_V) * T * 0.62
  const labelTop = top + capH
  const labelBot = labelTop + labelH
  const baseH = (1 - LABEL_V) * T * 0.38
  const ry = R * RIM
  const cols = []
  for (let x = cx0(w) - R; x <= cx0(w) + R; x += 1) {
    const s = (x - cx0(w)) / R
    if (s < -1 || s > 1) continue
    const rel = wrapAngle(Math.asin(s) + φ)
    const f = 0.5 + rel / span // artwork coordinate; null outside the printed wrap
    const lambert = 0.34 + 0.66 * Math.max(0, Math.cos(rel - LIGHT))
    cols.push({ x, rel, f, lambert, onLabel: Math.abs(rel) <= span / 2, spec: SPEC * Math.pow(Math.max(0, Math.cos(rel - (LIGHT + 1.2))), 15) })
  }
  return { cols, R, top, T, capH, labelH, labelTop, labelBot, baseH, ry, span, cx: cx0(w) }
}
const cx0 = (w) => w / 2

function paint(ctx, tex, φ, w, h, dpr) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const g = frame(φ, w, h)
  const { cols, R, top, T, capH, labelH, labelTop, labelBot, baseH, ry, cx } = g

  const sy = top + T + ry * 0.8
  const sh = ctx.createRadialGradient(0, 0, 2, 0, 0, R * 1.55)
  sh.addColorStop(0, 'rgba(2,5,14,0.5)')
  sh.addColorStop(1, 'rgba(2,5,14,0)')
  ctx.save()
  ctx.translate(cx, sy)
  ctx.scale(1, 0.16) // squash a circle into the ellipse a low light throws on a shelf
  ctx.beginPath()
  ctx.arc(0, 0, R * 1.55, 0, TAU)
  ctx.fillStyle = sh
  ctx.fill()
  ctx.restore()

  const body = new Path2D()
  body.moveTo(cx + R, top + capH * 0.3)
  body.ellipse(cx, top + capH * 0.3, R, ry * 1.4, 0, 0, Math.PI)
  body.lineTo(cx - R, labelBot + baseH)
  body.ellipse(cx, labelBot + baseH, R, ry, 0, Math.PI, TAU)
  body.closePath()

  ctx.save()
  ctx.clip(body)
  for (const c of cols) {
    const k = c.lambert
    ctx.fillStyle = `rgb(${Math.round(228 * k + 14)},${Math.round(233 * k + 16)},${Math.round(242 * k + 24)})`
    ctx.fillRect(c.x, top, 1, T)
    if (c.spec > 0.01) {
      ctx.fillStyle = `rgba(255,255,255,${c.spec.toFixed(3)})`
      ctx.fillRect(c.x, top, 1, T)
    }
  }
  // cap ribs are geometry, so they live on the plastic and darken with it
  ctx.fillStyle = 'rgba(10,16,32,0.13)'
  for (let i = 0; i < RIBS; i++) {
    const x = cx - R + (i * (2 * R)) / (RIBS - 1)
    ctx.fillRect(x, top + capH * 0.3, Math.max(1, R * 0.014), capH * 0.68)
  }
  ctx.fillStyle = 'rgba(8,12,26,0.07)'
  ctx.fillRect(cx - R, labelBot, 2 * R, baseH)
  ctx.restore()

  ctx.save()
  ctx.clip(body)
  const tw = tex.naturalWidth
  const th = tex.naturalHeight
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  for (const c of cols) {
    if (!c.onLabel) continue
    const sw = Math.max(1, (tw / (g.span * Math.sqrt(Math.max(1e-6, R * R - (c.x - cx) * (c.x - cx))))))
    ctx.drawImage(tex, Math.min(tw - sw, Math.max(0, c.f * tw - sw / 2)), 0, Math.min(tw, sw), th, c.x, labelTop, 1, labelH)
    ctx.fillStyle = `rgba(7,11,25,${(1 - c.lambert).toFixed(3)})`
    ctx.fillRect(c.x, labelTop, 1, labelH)
    if (c.spec > 0.01) {
      ctx.fillStyle = `rgba(255,251,236,${(c.spec * 0.66).toFixed(3)})`
      ctx.fillRect(c.x, labelTop, 1, labelH)
    }
  }
  // the printed wrap ends; the paper edge and its thickness are the tell
  ctx.strokeStyle = 'rgba(6,10,24,0.45)'
  ctx.lineWidth = 1
  for (const side of [-1, 1]) {
    const ψ = wrapAngle((side * g.span) / 2 - φ)
    if (Math.abs(ψ) > Math.PI / 2) continue // that edge has rotated behind the bottle
    const x = Math.round(cx + R * Math.sin(ψ)) + 0.5
    ctx.beginPath()
    ctx.moveTo(x, labelTop)
    ctx.lineTo(x, labelBot)
    ctx.stroke()
  }
  const vg = ctx.createLinearGradient(0, labelTop, 0, labelBot)
  vg.addColorStop(0, 'rgba(4,8,20,0.34)')
  vg.addColorStop(0.14, 'rgba(4,8,20,0)')
  vg.addColorStop(0.88, 'rgba(4,8,20,0)')
  vg.addColorStop(1, 'rgba(4,8,20,0.24)')
  ctx.fillStyle = vg
  ctx.fillRect(cx - R, labelTop, 2 * R, labelH)
  ctx.restore()

  ctx.beginPath()
  ctx.ellipse(cx, top + capH * 0.3, R, ry * 1.4, 0, 0, TAU)
  const kTop = 0.55 + 0.45 * Math.cos(-LIGHT)
  ctx.fillStyle = `rgb(${Math.round(238 * kTop + 10)},${Math.round(242 * kTop + 10)},250)`
  ctx.fill()
  ctx.strokeStyle = 'rgba(8,12,26,0.20)'
  ctx.lineWidth = 1
  ctx.stroke()
  return wrapAngle(φ)
}

function panelOf(rel, span) {
  const f = 0.5 + rel / span
  if (f > 0.34 && f < 0.66) return hero.spin.panels[0]
  if (f > 0.04 && f <= 0.34) return hero.spin.panels[1]
  if (f >= 0.66 && f < 0.96) return hero.spin.panels[2]
  return hero.spin.panels[3]
}

export default function Bottle3D({ mode, onMode }) {
  const cvs = useRef(null)
  const tex = useRef(null)
  const φ = useRef(0)
  const vel = useRef(0)
  const drag = useRef(null)
  const raf = useRef(0)
  const seen = useRef(false)
  const lastPanel = useRef(null)
  const reduce = useRef(false)
  const [panel, setPanel] = useState(hero.spin.panels[0])
  const [ready, setReady] = useState(false)

  const sync = useCallback((rel, span) => {
    const next = panelOf(rel, span)
    if (next !== lastPanel.current) {
      lastPanel.current = next
      setPanel(next)
    }
  }, [])

  // one canvas pass per frame, and no frame unless something is moving: a permanent
  // rAF loop in the hero is a battery drain and a reduced-motion violation
  const draw = useCallback(() => {
    const c = cvs.current
    const t = tex.current
    if (!c || !t) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = c.clientWidth
    const h = c.clientHeight
    if (!w || !h) return
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
    }
    const ctx = c.getContext('2d')
    if (!ctx) return
    sync(paint(ctx, t, φ.current, w, h, dpr), TAU * SPAN)
  }, [sync])

  /* The runner lives in a ref and is a hoisted declaration on purpose: `const loop =
     () => requestAnimationFrame(loop)` is legal at runtime but reads the binding inside
     its own initialiser, which is exactly the shape React's purity rule (and the
     compiler) refuses to reason about. A declared function has no such window. */
  const engine = useRef(null)

  useEffect(() => {
    function loop() {
      raf.current = 0
      draw()
      if (drag.current) {
        raf.current = requestAnimationFrame(loop)
        return
      }
      if (Math.abs(vel.current) > 0.0008) {
        φ.current += vel.current
        vel.current *= 0.94
        raf.current = requestAnimationFrame(loop)
      }
    }
    engine.current = () => {
      if (!raf.current) raf.current = requestAnimationFrame(loop)
    }
    return () => {
      engine.current = null
    }
  }, [draw])

  const kick = useCallback(() => engine.current?.(), [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduce.current = mq.matches
    const on = () => {
      reduce.current = mq.matches
    }
    mq.addEventListener('change', on)
    const img = new Image()
    img.onload = () => {
      tex.current = img
      setReady(true)
    }
    // a stage with nothing in it is worse than the photograph: fall back, silently
    img.onerror = () => onMode('photo')
    img.src = wrapUrl
    const ro = new ResizeObserver(() => draw())
    if (cvs.current) ro.observe(cvs.current)
    return () => {
      mq.removeEventListener('change', on)
      ro.disconnect()
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [draw, onMode])

  // a quarter-arc settle the first time the stage is on screen: it announces that the
  // object is solid. Once, on intersection only, and never under reduced motion.
  useEffect(() => {
    if (!ready) return
    draw()
    if (seen.current || reduce.current) return
    seen.current = true
    const el = cvs.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const swing = (k) => 0.8 * Math.pow(1 - k, 3) * Math.cos(k * 1.35)
        function ease() {
          const k = Math.min(1, (performance.now() - t0) / 1500)
          φ.current = swing(k)
          draw()
          if (k < 1) raf.current = requestAnimationFrame(ease)
          else draw()
        }
        raf.current = requestAnimationFrame(ease)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ready, draw])

  // arc-length mapping: the print moves exactly as far as the pointer, which is the one
  // hand-feel that makes a turntable feel gripped rather than scrubbed
  const radius = () => {
    const c = cvs.current
    if (!c) return 1
    const h = c.clientHeight
    return Math.min((h * 0.94) / TOverW / 2, (c.clientWidth * 0.92) / 2) || 1
  }
  const onDown = (e) => {
    drag.current = { x: e.clientX, t: performance.now() }
    vel.current = 0
    e.currentTarget.setPointerCapture?.(e.pointerId)
    e.currentTarget.setAttribute('data-dragging', '1')
    kick()
  }
  const onMove = (e) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    drag.current.x = e.clientX
    const now = performance.now()
    const dt = Math.max(8, now - drag.current.t)
    drag.current.t = now
    φ.current -= dx / radius()
    vel.current = (-dx / radius()) * (16 / dt) * 0.5
    kick()
  }
  const onUp = (e) => {
    drag.current = null
    e.currentTarget.removeAttribute('data-dragging')
    if (reduce.current) vel.current = 0
    kick()
  }
  const onKey = (e) => {
    const step = e.shiftKey ? 0.34 : 0.085
    if (e.key === 'ArrowLeft') φ.current -= step
    else if (e.key === 'ArrowRight') φ.current += step
    else if (e.key === 'Home') φ.current = 0
    else return
    e.preventDefault()
    vel.current = 0
    draw()
  }

  return (
    <>
      <div className="spin-modes" role="group" aria-label="Product view">
        {hero.spin.modes.map((m) => (
          <button key={m.id} type="button" className={`spin-mode${mode === m.id ? ' is-on' : ''}`} aria-pressed={mode === m.id} onClick={() => onMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      {/* a div owns the box: <canvas> is a replaced element, so `inset` with
          width:auto falls back to its intrinsic 300×150 — the frame would have
          silently rendered at a postage stamp and every pixel check above would
          still have passed. */}
      <div className="spin-frame">
          <canvas            ref={cvs}
          className={`spin-canvas${mode === 'spin' && ready ? ' is-on' : ''}`}
          data-spin-ready={ready ? '1' : '0'}
          data-mode={mode}
          data-touch-target="spin"
          tabIndex={mode === 'spin' ? 0 : -1}
          role="img"
          aria-label={`${hero.spin.aria} Currently facing the viewer: ${panel}.`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={onKey}
            onDoubleClick={() => {
              φ.current = 0
              vel.current = 0
              draw()
            }}
        />
      </div>

      <span className={`spin-flag${mode === 'spin' ? ' is-on' : ''}`}>{hero.spin.flag}</span>
      <p className={`spin-hint${mode === 'spin' ? ' is-on' : ''}`} data-spin-hint>
        {hero.spin.hint} · <b>{panel}</b>
      </p>
    </>
  )
}

import * as THREE from 'three'

/* ── the mesh layer over the same wrap ──────────────────────────────────────
   The 2D painter already gets the projection right; what a mesh adds is the part a
   column loop cannot fake — a real shoulder, a cap with thickness, environment light
   smeared across curved plastic, and anisotropic filtering where the print turns away
   from the viewer. So this is an *alternative renderer for the same state*, not a second
   product: the component owns the angle, the mode, the caption and the accessibility,
   and this module is handed a number to draw.

   No loader beyond TextureLoader, no HDR, no external file: the wrap arrives as the same
   data URI the 2D path decodes, and the studio is drawn on a canvas at runtime, because
   the page ships as one HTML file with zero requests and has to keep doing that.    */

import {
  BASE_OVER_D,
  CAP_OVER_D,
  H_OVER_D,
  LABEL_OVER_D,
  LIGHT_ANGLE,
  RIM_BULGE,
  WRAP_SPAN,
} from './bottleMeasure.js'

/* The printed wrap covers WRAP_SPAN of a turn; see bottleMeasure.js for the derivation. */
const SPAN = WRAP_SPAN
const TAU = Math.PI * 2


function PlaneGeometryFor(r) {
  return new THREE.PlaneGeometry(r * 4.6, r * 3.2)
}

function ribTexture() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 4
  const g = c.getContext('2d')
  g.fillStyle = '#f2f4f8'
  g.fillRect(0, 0, 128, 4)
  g.fillStyle = 'rgba(20,26,44,0.28)'
  for (let i = 0; i < 32; i++) g.fillRect(i * 4, 0, 1.4, 4)
  const tex = new THREE.CanvasTexture(c)
  /* No flip on upload. WebKit's WebGL2 answers a flipY texture with
     `INVALID_OPERATION: texImage3D: FLIP_Y or PREMULTIPLY_ALPHA isn't allowed for uploading 3D
     textures` — two console *errors* per load, and this page's contract is zero errors on every
     engine — so these two are handed over unflipped. Neither is asymmetric enough for the flip
     to show: the cap's ribs are vertical stripes and the contact shadow is a soft radial blob.
     The printed label keeps three's default flip, because it is text and must stay upright. */
  tex.flipY = false
  tex.wrapS = THREE.RepeatWrapping
  tex.repeat.set(9, 1)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function contactTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const rg = g.createRadialGradient(64, 64, 2, 64, 64, 62)
  rg.addColorStop(0, 'rgba(8,12,26,0.52)')
  rg.addColorStop(0.6, 'rgba(8,12,26,0.16)')
  rg.addColorStop(1, 'rgba(8,12,26,0)')
  g.fillStyle = rg
  g.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(c)
  tex.flipY = false // see the label wrap below: WebKit's WebGL2 rejects the flip state on these uploads
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function createBottle(canvas, textureUrl, onReady) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' })
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.06

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60)
  camera.position.set(0, 0.05, 6)

  /* No prefiltered environment map. A procedural equirect through PMREMGenerator is the
     usual way to give plastic its studio smear, and it looked right — but on WebGL2 that
     path uploads a 3D/array texture while UNPACK_FLIP_Y_WEBGL is set, and the driver answers
     every load with `INVALID_OPERATION: texImage3D: FLIP_Y or PREMULTIPLY_ALPHA isn't allowed
     for uploading 3D textures`. One of the three engines this page is gated on counts that as
     a page error, and it is not reachable from our side: the flip state belongs to three's own
     generator. Zero errors on every engine is the contract this page has kept since the first
     commit, so the smear is paid for with lights instead — a warm key at the painter's azimuth,
     a cool rim from behind, and a hemisphere fill — and the plastic reads as lit rather than
     reflective. */
  const key = new THREE.DirectionalLight(0xfff6e2, 1.6) // azimuth LIGHT_ANGLE, matching the painter
  key.position.set(Math.sin(LIGHT_ANGLE) * 2.6, 1.1, Math.cos(LIGHT_ANGLE) * 2.6)
  scene.add(key)
  const rimLight = new THREE.DirectionalLight(0xbcd2ff, 0.95)
  rimLight.position.set(1.9, 0.5, -1.4)
  scene.add(rimLight)
  scene.add(new THREE.HemisphereLight(0xdce6ff, 0x1a2236, 0.4))

  const group = new THREE.Group()
  scene.add(group)

  /* Unit space: the bottle is one diameter wide (R = 0.5) and H_OVER_D tall, every
     dimension taken from the measured constants so the mesh and the 2D painter cannot
     describe two different packages. The photograph has a silhouette of constant width
     from the top of the cap to the base, so this is a straight tube with a ribbed cap of
     the same diameter — no shoulder, no neck cone. The lathe carries the rounded base
     and closes inside the cap; the cap is a second mesh because it is ribbed. */
  const R = 0.5
  const T = H_OVER_D
  const CAP_H = CAP_OVER_D
  const LABEL_H = LABEL_OVER_D
  const LABEL_BOT = BASE_OVER_D
  const capBase = T - CAP_H // == LABEL_BOT + LABEL_H, by the measurement
  const CAP_R = R * 1.02 // a screw cap overlaps the body it threads onto
  const LABEL_R = R * 1.012 // the wrap sits on top of the plastic

  const at = (r, y) => new THREE.Vector2(r, y)
  const plastic = new THREE.MeshPhysicalMaterial({ color: 0xf6f8fb, roughness: 0.3, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.28 })
  const body = new THREE.Mesh(
    new THREE.LatheGeometry([at(0, 0), at(R * 0.88, 0), at(R, RIM_BULGE * R * 2), at(R, capBase + 0.02), at(R * 0.96, capBase + 0.03)], 128),
    plastic,
  )
  group.add(body)

  const wrap = new THREE.TextureLoader().load(textureUrl, () => onReady?.())
  wrap.colorSpace = THREE.SRGBColorSpace
  wrap.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  // the printed wrap does not close on itself, so the cylinder is cut to WRAP_SPAN of a
  // turn: the label keeps real edges and the plastic shows through on both sides of it
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(LABEL_R, LABEL_R, LABEL_H, 240, 1, true, -(TAU * SPAN) / 2, TAU * SPAN),
    new THREE.MeshPhysicalMaterial({ map: wrap, roughness: 0.44, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.35, side: THREE.FrontSide }),
  )
  label.position.y = LABEL_BOT + LABEL_H / 2
  group.add(label)

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(CAP_R, CAP_R, CAP_H, 128), new THREE.MeshPhysicalMaterial({ map: ribTexture(), color: 0xffffff, roughness: 0.36, clearcoat: 0.4 }))
  cap.position.y = capBase + CAP_H / 2
  group.add(cap)

  const contact = new THREE.Mesh(new PlaneGeometryFor(R), new THREE.MeshBasicMaterial({ map: contactTexture(), transparent: true, depthWrite: false }))
  contact.rotation.x = -Math.PI / 2
  contact.position.y = 0.006
  group.add(contact)

  group.position.y = -T / 2
  /* θ = 0 on a three.js cylinder faces the camera, so the band is cut symmetrically
     about it: the front panel is centred at rest and the two free edges of the wrap —
     the seam — sit at ±(WRAP_SPAN·τ)/2, 69° off centre, where the painter puts them. */
  group.rotation.y = 0

  function render(φ) {
    group.rotation.y = -φ
    renderer.render(scene, camera)
  }

  function resize(w, h) {
    renderer.setPixelRatio(Math.min(1.8, window.devicePixelRatio || 1))
    renderer.setSize(w, h, false)
    camera.aspect = w / Math.max(1, h)
    // fit whichever axis the frame constrains: one unit wide, T tall
    const halfV = Math.tan((camera.fov * Math.PI) / 360)
    const distV = (T * 1.07) / 2 / halfV
    const distH = (CAP_R * 2 * 1.04) / (w / Math.max(1, h)) / 2 / halfV
    camera.position.z = Math.max(distV, distH)
    camera.updateProjectionMatrix()
  }

  function dispose() {
    for (const o of [body, label, cap, contact]) {
      o.geometry.dispose()
      o.material.dispose?.()
    }
    wrap.dispose()
    renderer.dispose()
  }

  return { render, resize, dispose, kind: 'mesh' }
}

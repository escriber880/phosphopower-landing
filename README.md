# PhosphoPower® Micronized — landing page

A single-page marketing site for **NutriHealth USA · PhosphoPower® Micronized** (calcium, magnesium and zinc, 60 vegan capsules).

### Where the panel numbers come from

The Supplement Facts panel mirrors the **printed label artwork**, not an assumption: `facts.rows[].dvPrinted` is
the %DV exactly as it appears on the package (calcium 70 mg → 5%, zinc 40 mg as zinc gluconate → 364%), so the
page can never disagree with the bottle. Where a row has no printed percentage, it is computed from the
reference daily values in `src/lib/ld.js` (calcium 1,300 mg, magnesium 420 mg, zinc 11 mg; <50% in 2% steps,
≥50% in 5%). Two traps that file already handles, because both bit once:

- **Units.** Magnesium is declared in micrograms (950 mcg) while the DV ratio needs milligrams, so the row
  carries `amount: 950, unit: 'mcg'` for display and `dvAmount: 0.95` for the math. Never feed a mcg number
  straight into `percentDailyValue`.
- **Zero is a value.** `pct === null` means “no established DV” (dagger + dashed track). `pct === 0` means a
  real 0% and must render `0%` on an empty real track — a truthy check (`pct ? …`) silently turns 0% into a
  dagger, which is how the magnesium row nearly shipped wrong.
English-only, US market, React 19 + Vite 8, no CSS framework, no CDN, no webfonts.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173  (host: true, so it also works behind a proxy)
npm run build    # static output in dist/
npm run lint     # oxlint
npm run shots    # headless-Chromium visual + runtime audit (see below)
npm run spin     # the hero turntable: frames compared by hash, texture pinned by sha256
npm run design   # design-layer checks + r*.png captures (see below)
npm run parallax # measures the scroll-parallax rates in a real browser
npm run voice    # scans the rendered copy for regulatory/agency language
npm run contact  # asserts the support line works and no form machinery survived
npm run cross    # same contract in Chromium + Firefox + WebKit, plus touch and print
npm run verify   # loads the built single file over file:// — no server — and fails on
                 # any drift between the shipped head, the JSON-LD and the panel
```

`npm run shots` drives the dev server with Playwright: it fails on any console error, page error or failed request, asserts the structural counts
(10 `<section>` elements of which 9 are numbered 01→09, 4 ingredient cards, 4 quote cards, 4 social cards), checks that the computed
%DV values reach the DOM, measures horizontal overflow at 1440px and 390px, clicks the placeholder-audit toggle, and writes PNGs to `shots/` (numbered `00–07` for the flow, `09–13` for mobile, the contact section and the standalone file, `r1–r14` for the design layer). It renders with
`reducedMotion: 'reduce'` so scroll-reveal elements are visible in a full-page capture instead of sitting at `opacity: 0`.

```bash
npm run dev &     # the shot scripts expect the dev server on :5173
npm run shots && npm run design && npm run parallax && npm run cross
npm run deploy:sync && npm run verify   # rebuild the single file, then gate the artifact
```

## The 3D bottle

The hero's product card renders the **printed label artwork wrapped on a cylinder** in a 2D
canvas: one source column sampled per screen column through `θ = asin(dx/R) + φ`, which derives
the crowding of the print near the silhouette instead of painting a gradient over it. No WebGL,
no dependency, no extra request. Drag, arrow keys (Shift for a bigger step, Home for the front),
or the `3D / Photo` toggle; `touch-action: pan-y` keeps vertical scrolling native on a phone.

The texture is a **derived file**: `python3 scripts/prepare-wrap.py` reads the supplied artwork
and writes `src/assets/label-wrap.jpg`, cutting the fine-print block out of the left panel,
reflowing that panel, and removing the two claim asterisks the block used to explain (see
`docs/COMPLIANCE.md` §9). `npm run spin` then pins the result by sha256, so a swapped artwork
cannot ship a render nobody re-reviewed. Re-run the script after replacing the artwork, then
update the recorded hash deliberately.

Geometry is derived from the artwork's own aspect (circumference / label height = 2.19), which
puts the printed wrap at ~88% of the turn: the bare slice behind the seam is drawn as plastic,
because that is what a glued wrap looks like. The cap, shoulder and base are modelled proportions,
which is why the card says so.

`npm run design` covers the design layer (**30 checks**): aurora mesh + inert grain, exactly 9 drifting
numerals numbered 01→09 with no gaps, the word masks actually opening and carrying a text stroke, two
marquees with duplicated rows that are *measured moving*, four sticky stack cards on strictly rising
offsets and opaque backgrounds, the scrolly (one active step, the active tag changing, the bonds
visibly drawing, pinned on desktop / static on mobile), 9 rail ticks with the rail and nav agreeing on
the current section, screen-blended pointer light, floating label facts, conic card edges, the footer
wordmark, the four %DV meters plus the dashed no-DV track, **absence** of the FAQ/Evidence sections and
their dead CSS, counters resolving to real values, zero horizontal overflow at 1440 and 390, and zero
console errors.
The `r*` captures split by context on purpose: `r1` is taken under `prefers-reduced-motion`, so it shows the
page a motion-sensitive visitor gets (no chips, no drift), while `r14-hero-live.png` shows the same hero with
the motion layer on — compare them before calling a difference a bug. `npm run parallax` (10 checks) measures what a static audit cannot: that the headline and the product stage actually drift at different rates while scrolling, that the progress bar tracks scroll, that parallax adds no horizontal overflow, and that under `prefers-reduced-motion: reduce` no `--py` offset is written at all.

It needs Chromium once: `npx playwright install chromium` (plus `sudo npx playwright install-deps chromium` for the system libraries).

## One self-contained file

```bash
npm run standalone            # vite build + inline → standalone/PhosphoPower-landing.html
node scripts/verify-standalone.mjs
```

Produces a **single HTML file (~550 KB)** with the CSS, JS and the product photo inlined as a data URI — no external requests, so it opens from
`file://`, from an email attachment, or inside a sandboxed preview, and still renders identically on a server. `scripts/verify-standalone.mjs`
loads it over `file://` in headless Chromium and asserts exactly that: 0 external resource requests, image decoded at 1600×1600, 9 numbered
sections with no FAQ/Evidence remnant, the four Supplement Facts rows with their computed %DV, **no agency statement and no orphan claim asterisk** anywhere in the file, 0 console errors. `npm run shots` also captures
`shots/12-standalone-file.png` of it.

Deploy `dist/` anywhere static (Netlify, S3+CloudFront, Vercel, your own nginx). Nothing server-side is required.

## Where to edit

| What | Where |
| --- | --- |
| All copy, claims, socials, legal text | `src/data/site.js` |
| Supplement Facts amounts (drives %DV automatically) | `facts.rows` in `src/data/site.js` |
| Product photo | `public/product.png` |
| Colors, type scale, spacing | `:root` in `src/index.css` |
| Parallax speeds per layer | `data-parallax` on each element (bigger = closer = moves more); hook in `src/hooks/useParallax.js` |
| Marquee bands under the hero | `marquee` in `src/data/site.js` (they are label facts, not claims) |
| Scrolly steps + which molecule region each lights | `naming.steps[].part` in `src/data/site.js` → `Molecule.jsx` |
| FDA Daily Values used for %DV math | `src/lib/ld.js` |
| JSON-LD schema | `src/lib/ld.js` |

**Placeholder audit:** run `npm run dev` and press the **“Show placeholders”** button, bottom right. Every field that still contains invented or
template data gets an orange dashed outline with a label. It is dev-only (`import.meta.env.DEV`) and never ships. You can also grep for it:

```bash
grep -rn "data-edit" src/
```

## Structure

```
src/
  data/site.js          all content, one file
  lib/ld.js             %DV calculator + JSON-LD builders
  components/
    Nav.jsx Hero.jsx Ticker.jsx Positioning.jsx
    Formula.jsx Naming.jsx Facts.jsx
    Audience.jsx Testimonials.jsx Quality.jsx
    Social.jsx Contact.jsx Footer.jsx
    Orbs.jsx             blurred gradient lights, each on its own parallax plane
    Icons.jsx            self-contained SVG icon set
    Reveal.jsx           IntersectionObserver scroll reveal
  hooks/
    useParallax.js       one rAF loop → --py / --p per layer, --scroll on :root
    useSpotlight.js      --mx/--my spotlight + ±6deg tilt
    useSpy.js            useNearest (which step owns the reading line) + useCurrentSection
    useMagnetic.js       --mag-x/--mag-y pull on [data-magnetic]
    useScramble.js       decode-in text for the hero eyebrow
  components/
    Kinetic.jsx          word-by-word mask reveal for every display heading
    Marquee.jsx          one seamless band, duplicated row, pause on hover
    Rail.jsx             left reading rail: 9 ticks + --scroll fill
    CursorLight.jsx      pointer light (fine pointer only)
    Molecule.jsx         skeletal SVG of calcium AEP, three addressable regions
```

Sections, in order: hero (product photo on its own drifting plane) → product ticker → 01 positioning stats → 02 formula (what each nutrient is
documented to contribute to) → 03 the name (“Calcium AEP = phosphoethanolamine, one ingredient not two”) → 04 Supplement Facts panel (paper break) →
05 who it is for + timing-with-medication caution → 06 customer reviews → 07 manufacturing → 08 social channels → 09 one support inbox (mailto, no form; the address printed on the bottle is named in text, never linked) → footer.

The FAQ (“Common questions”) and “The record” (known-vs-assumed ledger) sections were removed at the owner's request, together with the editorial
asides that used to sit under them: the naming origin story, the testimonial disclosure paragraph, the per-ingredient `note` prose, the second
positioning paragraph and two of the four caption-policy bullets.

## Voice: what was taken out on purpose

The published page carries **no commentary about regulators, agencies or claim law, and no agency statement at all**: `legal.disclaimer` was
retired at the owner's request, and in the same edit the nine `*` marks on the ingredient claim lines were removed, because a footnote marker
with no note beneath it tells the reader a qualification exists somewhere it does not. `formula.intro` — which used to say where the asterisk
pointed — was rewritten for the same reason, and `scripts/contact.mjs` + `npm run verify` fail if either the marks or that sentence come back.
The physical label still prints the statement next to the claims it qualifies, and `legal.bullets[0]` sends the reader there. Removed earlier in the copy pass: the hero disclaimer block, the DSHEA/§403(r)(6)
pills on each ingredient card, the “claims audit” block (banned vs. allowed phrasing), the “read this before you write a caption” callout, the
the “is this FDA approved?” FAQ item and the whole FAQ section, the caption-policy list, and the FTC/MedWatch references in the review disclosure and contact block.

What was deliberately kept, because it is not agency talk: the four **MODEL COPY** badges on the placeholder testimonials, the “reconstruct from your COA”
flags on the panel, and the clinician/pharmacology interaction caution in section 05. Those protect the buyer rather than the regulator.

If you re-add a claim sentence to `formula[].claims`, keep the trailing `*` so it stays linked to the footnote, and keep the wording about normal
nutrition and body function rather than about conditions. An internal memo (kept out of this repo as `docs/`) records why each line is worded that way — it is not part of the site and
nothing in the build reads it.

## Design system (v3 — kinetic editorial)

v3 is additive: the v2 layer below still describes the base system, and the v3 CSS block at the
end of `src/index.css` overrides it. That ordering matters — the responsive unwinding for the new
components lives **inside** the v3 block, because a rule appended after the media queries wins
the cascade at equal specificity (that is how `.scrolly` was still two-column at 390px).

- **Kinetic type.** `Kinetic.jsx` splits a heading into words, each in an `overflow:hidden` mask,
  sliding up on a `--d` stagger when the block enters the viewport. Real text nodes stay between
  the words (`<span className="kinetic-gap"> </span>`) — spacing is done by the space, not a CSS
  margin, so `innerText`, copy-paste and crawlers still read sentences and not `Mineralsthatshowup.`
  The hero's second line is outlined + italic; the footer repeats the wordmark at 10.6vw, sized so
  the longest word cannot exceed the box at 390px.
- **Two marquees.** Under the hero, counter-drifting bands of label facts (`marquee.a/b`). One
  track, two rows, `translate3d(-50%)`, `mask-image` to fade the ends, paused on hover. Everything
  in them is a label fact (form, count, assay practice, CAS) — no outcomes, no superlatives.
- **Sticky stack.** The four ingredient cards are `position: sticky` at `top: calc(88px + var(--i) *
  15px)`, so they pile up on each other while the section scrolls. They are deliberately **opaque**
  (`backdrop-filter: none`): a frosted card would show the one underneath through it. Below 700px
  they unpin and stack normally.
- **Scrollytelling.** Section 03 pins the `Molecule.jsx` schematic while four steps pass the reading
  line; `useNearest` picks the step, the step's `part` decides which region of the SVG is lit, and
  the bonds ink themselves from `stroke-dashoffset: calc((1 - var(--draw)) * 1px)` where
  `--draw: clamp(0, calc(var(--p, 1) * 1.7 - 0.25), 1)` inherits the section's scroll progress.
  Two bugs that cost time here: a unitless `stroke-dashoffset` is *invalid in CSS* (silently 0, so
  nothing looked drawn), and the pinned box must not carry its own `data-parallax` or it reads its
  own sticky progress instead of the section's.
- **Reading rail + nav.** `Rail.jsx` is nine ticks on a line that fills with `scaleY(var(--scroll))`;
  the active tick and the nav underline both come from `useCurrentSection()`, which takes the last
  section whose head passed 34% of the viewport. Hidden below 1260px, where the vertical hero
  wordmark takes the gutter instead — they cannot share it.
- **Pointer.** `.cursor-light` trails the pointer at `mix-blend-mode: screen` (fine pointers only);
  `[data-magnetic]` buttons lean 9px toward the cursor via `--mag-x/--mag-y` so CSS still owns
  `transform`; `.edge` cards get a rotating conic-gradient border through `@property --a` and a
  mask-composite ring. The Ken Burns on the bottle restates `translateZ(40px) scale(1.02)` in its
  keyframes — a transform in a keyframe *replaces* the base one, it does not add to it.
- **Inert by design.** Under `prefers-reduced-motion` the parallax hook returns early, marquees and
  Ken Burns stop, the word masks appear open, `--draw` is forced to 1 (fully inked), and the pointer
  light and floating pills are not mounted. `npm run design` asserts `--py` is `unset` in that mode.

## Design system (v2 — clinical luxe / data-forward, still the base)

- **Ambient layers.** `body::before` is a fixed four-stop aurora mesh (cyan / gold / deep blue / violet) slowly drifting; `body::after` is an SVG
  `feTurbulence` film grain at `mix-blend-mode: overlay`, `pointer-events: none`. Cards are frosted with `backdrop-filter: blur(10px) saturate(132%)`.
- **Type.** Oversized serif display (`clamp(2.7rem, 7.6vw, 5.6rem)`, `-0.038em`) with a line-mask reveal: each line sits in an `overflow:hidden`
  wrapper and translates up from 102%. The second hero line is outlined — `color: rgba(gold,.15)` + `-webkit-text-stroke` — for the stroke/glass look.
  Mono is used for all labels at 0.16–0.24em tracking.
- **Layout.** Asymmetric bento (6-column grid: feature card spans 4×2, halves span 2, one full-width strip), soft geometry with one generous corner
  (`44px` vs `28px`), a hairline measurement grid, and each section's index as a giant outlined numeral bleeding off the right edge (`data-num`).
- **Interaction.** One delegated `pointermove` listener drives both the radial spotlight on any `.spot` card (`--mx/--my`) and a ±6° 3D tilt on
  `[data-tilt]`; `useSpotlight()` skips them for coarse pointers and reduced motion. Numbers count up on first intersection (`CountUp`).
- **Parallax.** `useParallax()` runs one `requestAnimationFrame` loop and writes `--py` (px offset) and `--p` (0→1 progress) per element that carries
  `data-parallax`; the CSS composes them instead of overwriting, so a card can be drifting *and* tilting *and* lifting on hover without the transforms
  fighting (`translate3d(0, calc(var(--py,0px) - 5px), 0)`). `:root` gets `--scroll`, which drives the 2px reading-progress bar under the nav. Speeds:
  hero headline `0.04`, hero product stage `0.14`, quote cards `0.02`/`0.05`, ambient orbs `0.06`–`0.34`, section shells `0` (numerals only, which
  drift ±55px via `--p`). No library, no `will-change` everywhere, and the whole thing returns early when `prefers-reduced-motion` is set.
- **Motion.** Scroll reveals use native `animation-timeline: view()` inside `@supports` + `prefers-reduced-motion: no-preference`, and fall back to the
  IntersectionObserver `.reveal.is-in` path — no library either way.
- **Panel.** The Supplement Facts keeps authentic FDA-style typography on a paper break, with a gold coverage meter per row (dashed track where no
  Daily Value exists) and lot/COA metadata pills.
- System font stacks only (Iowan Old Style → Palatino → Georgia / ui-sans-serif / ui-monospace), so the page and the standalone file render
  identically with no network.
- `mix-blend-mode: multiply` on the product photo knocks out its white background into the ivory card — drop in your own studio shot and the same
  trick works as long as the background is white.
- Motion: IntersectionObserver reveals with per-card stagger, hover lift on cards, pausable ticker. All of it collapses under
  `prefers-reduced-motion: reduce`.
- Print stylesheet included (the page prints as a clean spec sheet: nav, ticker and glow removed).

## Before this page goes public

That internal memo is not optional reading for anyone editing this copy — it lists which sentences on this page are load-bearing under FDA/FTC rules, what must be replaced
with real data, and the banned-phrase list for captions and ads. The two most urgent: **testimonials are model copy** and **the ingredient amounts
are a reconstruction**, not your certificate of analysis.

## Deploy (Render)

`render.yaml` is a Render Blueprint: connecting the repo to Render creates the service from that file, so the
build command, publish directory, Node pin and cache headers cannot be mistyped in a dashboard form. Two valid
shapes, keep one:

**A — build from source** (`runtime: static`, `npm ci && npm run build`, publish `dist`). Use this while the
React app keeps changing. Two things the file already handles, both of which bite by default:

- `NODE_VERSION=22` — Vite 8 requires Node `^20.19 || >=22.12` (`engines` in `package.json` and `.nvmrc` agree).
  Render's default image can be older, and the failure is a build log about `crypto.getRandomValues`, not a
  version error.
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` — Playwright is a devDependency because it runs the visual gates. On a
  plain `npm ci` it downloads ~400 MB of browsers on the build box, which wastes minutes and can time out.
  Render never runs the gates, so the download is skipped.

**B — publish the prebuilt file.** `npm run deploy:sync` regenerates the single-file build and copies it to
`deploy/index.html`; commit that and serve `./deploy` with an empty build command. Nothing compiles on Render,
so nothing can fail to compile — the right shape for a page you mostly leave alone. The file inlines CSS, JS and
the product photo, so it has no asset paths to get wrong; `standalone/` is gitignored because it is the
generated twin.

After the first deploy:

1. **Custom domain** — add `phosphopower.com` (and `www`) under *Settings → Custom Domains*, then point DNS at the
   target Render shows (a CNAME for `www`, an ALIAS/FLATTENING A record for the apex). TLS provisions itself once
   DNS resolves. No `rel="canonical"` is in `index.html` yet: add
   `<link rel="canonical" href="https://www.phosphopower.com/" />` only once that origin actually serves the site
   — a canonical to a domain that does not resolve tells search engines to prefer nothing.
2. **Support, not a form** — there is no request form and no documentation-pack workflow. `#contact` prints the
   one inbox (`nthsupplements@gmail.com`) and `Contact.jsx` hands over a bare `mailto:`, because a static bundle
   has nowhere to POST and a "Request logged" panel would describe a record that does not exist. The page does not
   call the line "monitored" either — that is a promise about staffing, not a label fact. If you later add a real
   endpoint, rebuild a small form in `#contact` and restore a submit-time gate in `scripts/contact.mjs`.
3. **Re-run the gates before pushing** — `npm run deploy:sync && npm run design && npm run contact && npm run cross`, then commit.
   `scripts/verify-standalone.mjs` additionally refuses to pass if `<title>`, the meta tags or `<noscript>` carry
   a claim the panel no longer supports (it greps the shipped artifact for `chelated`, `bisglycinate`,
   `vegetarian`, `1,000 mg`, `data-edit="` and dead contact addresses) — that hand-written head copy is where a
   label sync used to leave the truth behind.

## Cross-engine gate (`npm run cross`)

A single engine hides the failures that matter here: `mask-composite`, `@property`, `dominant-baseline`,
`backdrop-filter`, `-webkit-text-stroke`, sticky-under-`overflow:clip` and `pointer` gating all behave
differently across Chromium, Firefox and WebKit. This runs the same 18 assertions through all three engines,
and each engine is also measured in a **coarse-pointer touch context** (390×844, `hasTouch`, `isMobile`) and
under **print media** emulation (Chromium additionally renders the page to PDF to prove it still paginates).

Two rules learned the hard way, both encoded in the harness:

- **Nothing may grow the document.** Decorative layers are absolutely positioned and the product card is
  projected with `perspective` + `translateZ`, which *always* enlarges scrollable overflow — insets cannot
  design that away. `.hero { overflow: clip }` (with a `hidden` fallback behind `@supports not`) contains it at
  the nearest full-width block. Clipping at `.product-stage` instead would crop the card's shadow, so the
  harness asserts **document-level** overflow is 0 rather than demanding each box contain its own ornaments.
  Under mobile emulation the growth escaped the `body` clip, which is why the touch context is its own check.
- **An unmeasurable check is reported, never quietly passed.** Headless WebKit in this container delivers one
  animation frame per screenshot, and `useParallax` is rAF-throttled — so the ink-progress and rail-follow
  assertions print `~ unmeasurable — page received N animation frames` instead of pretending. The page is not
  verified on real iOS/Safari hardware; it is verified on WebKit's layout, typography and paint engine.

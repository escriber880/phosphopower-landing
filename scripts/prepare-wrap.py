#!/usr/bin/env python3
"""Derives public/label-wrap.jpg — the texture the hero's 3D bottle wraps around.

The source is the printed label artwork as supplied (uploads/IMG-20261010-WA0000.jpg,
1026x469, the full wrap: directions panel | front panel | Supplement Facts panel).
Two edits are applied, both disclosed to the visitor by the component's own flag, and
both are the direct consequence of a copy decision rather than a rendering shortcut:

  1. The fine-print block in the left panel (the bordered box that carried the agency
     statement) is cut out and the panel's content below it pulled up 62px, leaving
     the panel the same height with a slightly wider bottom margin. The panel's outer
     edges and the label's gold top/bottom bands are untouched.
  2. The two asterisks that ended "ENHANCED ABSORPTION*" and "IMMUNE SYSTEM SUPPORT*"
     on the front panel are cloned out, because with the block gone they would mark a
     footnote that no longer exists anywhere on the object — the same rule the HTML
     claims follow (see docs/COMPLIANCE.md section 9).

Everything else is the artwork as printed: geometry, colors, barcodes, seals.

Run:  python3 scripts/prepare-wrap.py  (idempotent; re-run after replacing the source)
"""
import os
import sys
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "..", "uploads", "IMG-20261010-WA0000.jpg")
OUT = os.path.join(ROOT, "src", "assets", "label-wrap.jpg")

# Measured off the source, not guessed: the box borders are the only two rows inside
# the left panel whose dark-pixel density exceeds 0.9 across the panel width.
PANEL_X0, PANEL_X1 = 15, 252
PANEL_BOTTOM = 447
BOX_TOP, BOX_BOTTOM = 157, 218
H = BOX_BOTTOM - BOX_TOP
# The two claim lines end in "*", and the mark has to go for the same reason the HTML
# claims lost theirs. A hand-measured rectangle is how that eats the T in ABSORPTION, so
# the asterisk is *found*: the rightmost contiguous ink run on the line, with its extent
# as the patch. Guarded to the size of a punctuation mark, because a run that wide is a
# letter and the edit would be vandalism of the artwork.
CLAIM_LINES = [(322, 348), (352, 378)]  # (y0, y1) bands around each claim line
INK_MIN = 175  # luma above which a pixel is glyph; the blue field sits near 73, so
# the threshold is nowhere near the margin — but it has to be below 200 or the
# JPEG-soft right-hand edge of the asterisk reads as background and the run stops short
CLONE_DX = -235  # same rows, blue field left of the claim lines


def find_asterisks(px, W):
    """The trailing "*" of each claim line, located as *the short run that hugs the last
    full-height glyph* — not as the rightmost ink on the row, which on this artwork is a
    bright facet in the background 40px past the end of the text."""
    out = []
    for (y0, y1) in CLAIM_LINES:
        runs, cur = [], None
        for x in range(430, 700):
            ink = any(sum(px[x, y]) / 3 > INK_MIN for y in range(y0, y1))
            if ink and cur is None:
                cur = [x, x]
            elif ink:
                cur[1] = x
            elif cur:
                runs.append(tuple(cur))
                cur = None
        if cur:
            runs.append(tuple(cur))
        tall = [r for r in runs if max(sum(1 for y in range(y0, y1) if sum(px[x, y]) / 3 > INK_MIN) for x in range(r[0], r[1] + 1)) >= 10]
        if not tall:
            die(f"no full-height glyph run in the claim band y{y0}-{y1}; the artwork moved")
        anchor = tall[-1]
        after = [r for r in runs if r[0] > anchor[1] and r[0] - anchor[1] <= 12]
        if not after:
            die(f"nothing hugging the end of the claim line at y{y0}-{y1}: the asterisk is already gone or the text moved")
        x0, x1 = after[0]
        ys = [y for y in range(y0, y1) if any(sum(px[x, y]) / 3 > INK_MIN for x in range(x0, x1 + 1))]
        wdt, hgt = x1 - x0 + 1, max(ys) - min(ys) + 1
        if not (2 <= wdt <= 13 and 2 <= hgt <= 9):
            die(f"the run after the last letter is {wdt}x{hgt}px — that is a letter, not a mark; re-measure")
        # the anchor's right edge travels with the mark: the patch is bounded by the word
        out.append((x0, min(ys) - 1, x1, max(ys) + 1, anchor[1]))
    return out


def die(msg):
    print("✗ " + msg)
    sys.exit(1)


if not os.path.exists(SRC):
    die("missing source artwork: " + SRC)

im = Image.open(SRC).convert("RGB")
W, Hh = im.size
if (W, Hh) != (1026, 469):
    die(f"source artwork changed size ({W}x{Hh}); re-measure the box and asterisk rects")
px = im.load()

# guard 1: the panel really is the white field we think it is, so the reflow fill is right
sample = [sum(px[20, y]) / 3 for y in range(PANEL_BOTTOM - H, PANEL_BOTTOM)]
if min(sample) < 200:
    die(f"left panel bottom margin is not white (min luma {min(sample):.0f}) — the fill would smear ink")
# guard 2: the two rows we treat as the box's borders must be its borders
for y in (BOX_TOP + 2, BOX_BOTTOM - 2):
    dark = sum(1 for x in range(PANEL_X0 + 8, PANEL_X1 - 8, 2) if sum(px[x, y]) / 3 < 120)
    span = (PANEL_X1 - PANEL_X0 - 16) // 2
    if y in (BOX_TOP + 2,):
        top_ok = dark > span * 0.5
    else:
        bot_ok = dark > span * 0.5
if not (top_ok and bot_ok):
    die("expected the box border lines at the measured rows; the crop would cut text")

# ── 1. cut the fine-print block, pull the rest of the panel up ───────────────────
for x in range(PANEL_X0, PANEL_X1 + 1):
    for y in range(BOX_TOP, PANEL_BOTTOM - H):
        px[x, y] = px[x, y + H]
    bg = px[x, PANEL_BOTTOM - H - 1]
    for y in range(PANEL_BOTTOM - H, PANEL_BOTTOM):
        px[x, y] = bg

# ── 2. remove the two orphaned asterisks ──────────────────────────────────────
# Cloning from a fixed horizontal offset is what put the letter H on the end of
# "ABSORPTION": the claims are centred, so 235px left is inside the word. The field
# these marks sit on is a vertical gradient, so each column is rebuilt from the nearest
# ink-free row above and below it and interpolated — which is the actual background,
# not a borrowed piece of somebody else's pixel.
FRONT_ASTERISKS = find_asterisks(px, W)


def clear_row(x, y, step, half=7):
    """first row walking away from the glyph band that has no ink near this column"""
    yy = y
    for _ in range(70):
        yy += step
        if yy < 2 or yy >= Hh - 2:
            break
        if all(sum(px[xo, yy]) / 3 <= INK_MIN for xo in range(x - half, x + half + 1)):
            return yy
    die(f"no clean background row found above/below y{y} at x{x}")


for (x0, y0, x1, y1, last_letter) in FRONT_ASTERISKS:
    # 6px right / 5px vertically, because the mark's anti-aliased halo sits below INK_MIN
    # and a patch the exact size of the detected ink leaves that halo behind as a ghost
    # asterisk. But never past the word: a symmetric pad is what clipped the N of
    # ABSORPTION and the right arm of the T of SUPPORT on the first pass.
    bx0 = max(x0 - 2, last_letter + 1)
    if bx0 > x0 - 1:
        die(f"the mark starts {x0 - last_letter - 1}px after the last letter: no room to cover the halo without cutting the word")
    bx1, by0, by1 = x1 + 6, y0 - 5, y1 + 5
    for x in range(bx0, bx1 + 1):
        up = clear_row(x, min(y0, by0), -1)
        dn = clear_row(x, max(y1, by1), +1)
        cu = px[x, up]
        cd = px[x, dn]
        span = dn - up
        for y in range(by0, by1 + 1):
            t = (y - up) / span
            px[x, y] = tuple(round(cu[c] * (1 - t) + cd[c] * t) for c in range(3))
    # one pixel of feather, so the rebuilt column can not print a rectangle
    ring = im.crop((bx0, by0, bx1 + 1, by1 + 1)).filter(ImageFilter.GaussianBlur(1.1))
    im.paste(ring, (bx0, by0))

os.makedirs(os.path.dirname(OUT), exist_ok=True)

# provenance, asserted: re-encode and compare. JPEG noise moves every pixel a little, so
# the contract is "no *large* difference anywhere outside the three places I edited".
im.save(OUT, quality=84, subsampling=1)
chk = Image.open(OUT).convert("RGB")
if chk.size != (W, Hh):
    die("re-encoded size drifted from the source")
cpx = chk.load()
regions = [(PANEL_X0 - 3, BOX_TOP - 3, PANEL_X1 + 3, PANEL_BOTTOM + 3)] + [(ll - 4, y0 - 9, x1 + 9, y1 + 9) for (x0, y0, x1, y1, ll) in FRONT_ASTERISKS]
stray = []
for y in range(0, Hh, 2):
    for x in range(0, W, 2):
        if any(r[0] <= x <= r[2] and r[1] <= y <= r[3] for r in regions):
            continue
        if sum(abs(a - b) for a, b in zip(px[x, y], cpx[x, y])) > 96:
            stray.append((x, y))
if stray:
    die(f"{len(stray)} sampled pixels differ outside the edited regions — the save changed artwork it should not touch: {stray[:4]}")
print(f"  provenance check: no significant change outside the 3 edited regions (sampled {len(range(0, W, 2)) * len(range(0, Hh, 2))} px)")

# q=84 with light chroma subsampling: the wrap is drawn ~265px wide on screen and the
# artwork is only 1026 across to begin with, so the extra 90 KB of q=92/4:4:4 buys
# nothing a viewer can see — while the single-file build pays it in base64, every load.
kb = os.path.getsize(OUT) / 1024
print(f"✓ {OUT}  {W}x{Hh}  {kb:.0f} KB")
print(f"  removed the fine-print block (y {BOX_TOP}–{BOX_BOTTOM}, x {PANEL_X0}–{PANEL_X1}) and reflowed the panel up {H}px")
print(f"  removed the 2 trailing asterisks, each the short run hugging the last letter: {[(a, b, c, d) for a, b, c, d, _ in FRONT_ASTERISKS]}")
print("  everything else is the supplied artwork, pixel for pixel")

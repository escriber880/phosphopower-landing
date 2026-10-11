#!/usr/bin/env python3
"""Measure the shipped bottle photograph so the 3D is built from numbers.

The turntable geometry (body width, label band height, cap height) is not an
artistic choice: it is read off public/product.png, the only reference the
package itself provides. Edges come from the largest non-background region,
then four profiles:

  columns through the label band  -> left/right edge of the body  (diameter)
  rows through the body axis      -> top of the cap, bottom of the base
  rows through the label band      -> top/bottom edge of the label  (band height)

Prints a JSON block; src/lib/bottleMesh.js and Bottle3D.jsx hard-code the
result and `npm run spin` re-runs this script and fails if the numbers drift.
"""
import json
import sys

from PIL import Image

REF = "public/product.png"
IMG = Image.open(REF).convert("RGB")
W, H = IMG.size
PIX = IMG.load()


def at(x, y):
    return PIX[x, y]


def near(a, b, tol=34):
    return sum(abs(p - q) for p, q in zip(a, b)) <= tol


# Background model: the four corners are the same studio backdrop.
corner = [at(4, 4), at(W - 5, 4), at(4, H - 5), at(W - 5, H - 5)]
if not all(near(corner[0], c, 90) for c in corner):
    sys.exit("%s: the four corners are not one background; measure by hand" % REF)
BG = tuple(sum(c[i] for c in corner) // 4 for i in range(3))

# Foreground = anything that is not the backdrop. The body is white plastic,
# the label band is dark blue, so a single channel test cannot serve both: use
# distance from the backdrop colour, and require a row or column to be mostly
# foreground before it counts as the bottle.
def fg(x, y):
    p = at(x, y)
    return sum(abs(p[i] - BG[i]) for i in range(3)) > 150


def runs(seq):
    """Longest run of True in a boolean list, as (start, end)."""
    best, bl, cur = (0, -1), 0, None
    for i, v in enumerate(seq):
        if v and cur is None:
            cur = i
        elif not v and cur is not None:
            if i - 1 - cur > bl:
                best, bl = (cur, i - 1), i - 1 - cur
            cur = None
    if cur is not None and len(seq) - 1 - cur > bl:
        best = (cur, len(seq) - 1)
    return best


# 1. Body diameter: the widest mostly-foreground stretch of any row.
body_l, body_r, best_len = 0, -1, 0
for y in range(H):
    span = runs([fg(x, y) for x in range(W)])
    if span[1] - span[0] > best_len:
        body_l, body_r, best_len = span[0], span[1], span[1] - span[0]
D = body_r - body_l + 1
if D < 0.2 * W:
    sys.exit("%s: body only %d px wide of %d; not a bottle photo" % (REF, D, W))

# 2. Vertical extents: rows where the body column is covered by foreground.
cx = (body_l + body_r) // 2
top, bot = runs([sum(1 for x in range(body_l + 8, body_r - 8, 4) if fg(x, y))
                 > (body_r - body_l - 16) // 4 * 0.6 for y in range(H)])
if bot - top < 0.3 * H:
    sys.exit("%s: bottle only %d px tall of %d" % (REF, bot - top, H))

# 3. Label band: the artwork is dark blue. Where a row across the body is
#    mostly blue, it is inside the label.
def blueish(x, y):
    p = at(x, y)
    return p[2] > 95 and p[2] > p[0] + 26


blue = [sum(1 for x in range(body_l + 8, body_r - 8, 4) if blueish(x, y))
        > (body_r - body_l) // 8 for _ in [0]]
blue = [sum(1 for x in range(body_l + 8, body_r - 8, 4) if blueish(x, y))
        > (body_r - body_l) // 8 for y in range(top, bot + 1)]
band = runs(blue)
if band[1] - band[0] < 12:
    sys.exit("%s: only %d blue rows; the label was not found" % (REF, band[1] - band[0] + 1))
label_top, label_bot = top + band[0], top + band[1]

out = {
    "reference": REF,
    "px": {"body_left": body_l, "body_right": body_r, "top": top, "bottom": bot,
           "label_top": label_top, "label_bot": label_bot},
    "ratios": {
        "height_over_diameter": round((bot - top + 1) / D, 4),
        "label_over_diameter": round((label_bot - label_top + 1) / D, 4),
        "cap_over_diameter": round((label_top - top) / D, 4),
        "base_over_diameter": round((bot - label_bot) / D, 4),
    },
}
print(json.dumps(out, indent=2))

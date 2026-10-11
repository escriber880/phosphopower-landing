/**
 * The bottle, measured.
 *
 * Every number here is read off `public/product.png` by `scripts/measure-bottle.py`
 * and nothing in the turntable is sized by eye. Run the script; if it stops
 * agreeing with these constants the gate fails, so a new photograph cannot ship
 * a model of the old one.
 *
 * The photograph is a straight-on shot of a cylinder, so its silhouette is a
 * rectangle: the width of the label band is the diameter, its height is the band.
 * From those two the rest of the package follows.
 *
 *   diameter D  684 px   body_left 503  body_right 1186  top 665  bottom 1481
 *   label       375 px   y 954 to 1328  -> the band the artwork is printed on
 *   cap         289 px   y 665 to 954
 *   base        153 px   y 1328 to 1481
 */

export const MEASURED = {
  reference: 'public/product.png',
  px: { body_left: 503, body_right: 1186, top: 665, bottom: 1481, label_top: 954, label_bot: 1328 },
}

/** Height / diameter of the whole package, cap to base. */
export const H_OVER_D = 1.1944
/** Label band height / diameter. */
export const LABEL_OVER_D = 0.5482
/** Cap (and neck) above the label band / diameter. */
export const CAP_OVER_D = 0.4225
/** Bare plastic below the label band / diameter. */
export const BASE_OVER_D = 0.2237

/**
 * The supplied artwork is 1026x469. Printed on a band 0.5482 diameters tall it
 * spans 1.199 diameters of surface, and the tube's circumference is pi
 * diameters: so the wrap covers 38% of a turn and the rest of the bottle is
 * bare plastic. That is the package, not a limitation of the render, and the
 * flag under the stage says so.
 */
export const ARTWORK_ASPECT = 1026 / 469
export const WRAP_SPAN = (ARTWORK_ASPECT * LABEL_OVER_D) / Math.PI

/** How tall the stage box is for its width (the projected silhouette). */
export const FIT_T_OVER_W = H_OVER_D
/** The label band as a fraction of the whole package height. */
export const FIT_LABEL_V = LABEL_OVER_D / H_OVER_D
/** Cap height as a fraction of everything above the label band. */
export const FIT_CAP_F = CAP_OVER_D / (CAP_OVER_D + BASE_OVER_D)

/**
 * Shared lighting for both paths: where the key light sits, and how far the rim
 * of the cylinder swells past its own silhouette.
 */
export const LIGHT_ANGLE = -0.62
export const SPEC_STRENGTH = 0.34
export const RIM_BULGE = 0.055

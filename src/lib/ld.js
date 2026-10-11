import { facts, brand } from '../data/site.js'

/**
 * Reference Daily Values behind the %DV column on the Supplement Facts panel.
 * Source: 21 CFR 101.9(c)(8)(iv)(A), the 2016 nutrient-labeling amendments.
 * Amounts with no established DV are shown with a dagger (†).
 */
export const REFERENCE_DAILY_VALUES = {
  calcium: 1300, // mg
  magnesium: 420, // mg
  zinc: 11, // mg
}

export function percentDailyValue(nutrientKey, amount) {
  const dv = REFERENCE_DAILY_VALUES[nutrientKey]
  if (!dv || typeof amount !== 'number') return null
  const pct = Math.round((amount / dv) * 100)
  // Rounding rules for labeling: <50% goes to the nearest 2%, >=50% to the nearest 5%.
  return pct < 50 ? Math.round(pct / 2) * 2 : Math.round(pct / 5) * 5
}

export function buildProductSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: brand.product,
    brand: { '@type': 'Brand', name: brand.company },
    description:
      'Calcium (as calcium carbonate, NutriGP® calcium glycerophosphate and calcium 2-aminoethylphosphate) with zinc as zinc glycinate, in vegan capsules. 60 capsules, 30 servings.',
    image: '/product.png',
    category: 'Dietary Supplement',
    audience: { '@type': 'PeopleAudience', suggestedAge: 'Adult 18+' },
    additionalProperty: facts.rows.map((row) => ({
      '@type': 'PropertyValue',
      name: row.nutrient,
      value: `${row.amount} ${row.unit} per ${facts.servingSize}`,
    })),
  }
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.company,
    url: brand.site,
    email: brand.email,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: brand.email,
      availableLanguage: 'English',
    },
    sameAs: brand.social.map((s) => s.url),
  }
}

export const jsonLd = [buildProductSchema(), buildOrganizationSchema()]

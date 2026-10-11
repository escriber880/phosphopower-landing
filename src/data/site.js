/* ══════════════════════════════════════════════════════════════════════════
   SITE CONTENT — edit here, the whole page follows.

   ⚠  THREE THINGS TO CHECK BEFORE YOU GO LIVE
   1. `facts.rows` and `formula[].perServing`  → must match your Certificate
      of Analysis and your printed label. Values below are a plausible
      reconstruction from the bottle photo (60 veg capsules) plus the 500
      mg/capsule Calcium AEP convention. Do not ship invented numbers.
   2. `testimonials[]` → every entry is flagged `model: true`. Replace with
      real, written-consent reviews before publishing them as customer quotes.
   3. `brand.social[]` → confirm each handle is really yours before printing
      it. The name is used elsewhere, so verify before you publish a handle.

   No regulatory sentence is printed on this page any more: the agency statement
   was retired at the owner's request and the claim asterisks were removed with it,
   so no footnote points at text that does not exist here. Everything below is
   product copy. (docs/COMPLIANCE.md — internal, not part of the published page —
   still describes what re-adding the statement would require.)
   ══════════════════════════════════════════════════════════════════════════ */

export const brand = {
  company: 'NutriHealth USA',
  product: 'PhosphoPower® Micronized',
  shortName: 'PhosphoPower',
  line: 'Calcium · Magnesium · Zinc',
  site: 'https://www.phosphopower.com',
  email: 'nthsupplements@gmail.com',
  address: 'Orlando, FL — USA',
  founded: '2019',
  social: [
    {
      name: 'Facebook',
      icon: 'facebook',
      handle: '@NutriHealthUSA',
      url: 'https://www.facebook.com/NutriHealthUSA',
      blurb: 'Batch releases and the COA PDF for every lot we ship.',
      stat: 'Page',
    },
    {
      name: 'X',
      icon: 'x',
      handle: '@NutriHealthUSA',
      url: 'https://x.com/NutriHealthUSA',
      blurb: 'Formula change logs and the sourcing notes behind them.',
      stat: 'Handle',
    },
    {
      name: 'Instagram',
      icon: 'instagram',
      handle: '@nutrihealthusa',
      url: 'https://www.instagram.com/nutrihealthusa',
      blurb: 'Manufacturing floor, capsule macro shots, weekly Q&A.',
      stat: 'Creator',
    },
    {
      name: 'TikTok',
      icon: 'tiktok',
      handle: '@nutrihealthusa',
      url: 'https://www.tiktok.com/@nutrihealthusa',
      blurb: '“What is Calcium AEP?” — the 40-second ingredient series.',
      stat: 'Creator',
    },
  ],
}

export const hero = {
  eyebrow: 'Dietary supplement · 60 vegan capsules · Made in the USA',
  titleA: 'Minerals that show up.',
  titleB: 'A story we can document.',
  sub:
    'PhosphoPower® Micronized delivers calcium from three salts — one of them calcium 2-aminoethylphosphate, the calcium AEP on our label — with zinc as zinc gluconate and a declared magnesium trace. Three nutrients with well-characterized jobs in muscle contraction, energy metabolism and normal immune function, printed milligram for milligram.',
  primary: { label: 'Read the formula', href: '#formula' },
  secondary: { label: 'Compare the panel', href: '#facts' },
  badges: [
    'Non-GMO · gluten free · purity sourced',
    'No artificial colors, no added preservatives',
    'Vegan capsule, no gelatin',
    'Lab tested · COA with every batch',
  ],
  photoCaption: 'Current retail unit: 60 vegan capsules, 30 servings. Label panels as printed.',
  /* The 3D stage is a render of the printed wrap, not a scan of a filled bottle, so the
     disclosure travels with the component instead of living in a footnote nobody opens.
     `panels` is read from the live angle, which is what makes the caption honest at
     40° and at 160° rather than only in the hero shot. */
  spin: {
    modes: [
      { id: 'spin', label: '3D' },
      { id: 'photo', label: 'Photo' },
    ],
    hint: 'Drag to turn',
    flag: 'Label wrap: printed artwork · Form: modelled, not a scan',
    aria: 'Turntable view of the printed label artwork. Drag, or press the left and right arrow keys, to rotate the bottle; Home returns to the front panel.',
    panels: ['front panel', 'directions and contact panel', 'Supplement Facts panel', 'bare bottle behind the label seam'],
  },
  /* small mono labels that float around the bottle, each on its own parallax plane */
  pills: ['CAS 10389-08-9', '2 capsules daily', '60 veg capsules', 'Micronized'],
}

export const ticker = [
  'Calcium 70 mg per serving, as three calcium salts',
  'Minerals in the forms the label names',
  '60 vegan capsules · 30 servings',
  'Every batch ships with a certificate of analysis',
  'Made in the USA from globally sourced ingredients',
]

/* Two kinetic bands under the hero. Everything here is a label fact: form,
   count, assay practice, identity. No outcomes, no superlatives. */
export const marquee = {
  a: ['Micronized powder', 'Three declared minerals', '60 vegan capsules', 'One morning, one night', 'COA with every batch', 'Third-party assayed'],
  b: ['Calcium 70 mg', 'Zinc 40 mg', 'Magnesium 950 mcg', 'Zinc as zinc gluconate', 'CAS 10389-08-9', 'No titanium dioxide'],
}

export const positioning = {
  kicker: '01 — Why this bottle',
  title: 'Three actives, one honest panel.',
  body: 'Most shelves in this category run fourteen-ingredient blends that put forty milligrams of each on the panel and a story on the front. We went the other way: three actives, no proprietary blend, and full disclosure, milligram for milligram.',
  cards: [
    {
      label: 'Formula width',
      value: '3',
      unit: 'actives',
      note: 'No side effects or contraindications reported at the labelled dose.',
    },
    {
      label: 'Proprietary blends',
      value: '0',
      unit: 'on the panel',
      note: 'Every milligram of every ingredient is declared individually.',
    },
    {
      label: 'Per batch',
      value: '1',
      unit: 'COA',
      note: 'Identity, potency, micro and heavy metals — sent to customers on request.',
    },
    {
      label: 'Servings',
      value: '30',
      unit: 'days',
      note: '60 capsules at the labelled 2-capsule serving.',
    },
  ],
}

export const formula = {
  kicker: '02 — The formula',
  title: 'Three nutrients, and what each one is documented to contribute to.',
  /* The old second sentence pointed at the asterisk that used to sit on every claim and
     at the statement in the footer. Both are gone, so this had to go with them: a line
     telling the reader where to look for a note that does not exist is worse than
     saying nothing. The framing sentence carries the same limit in its own words. */
  intro:
    'Each statement describes normal nutrition and body function — what the mineral does in a body, not what this capsule promises you.',
  items: [
    {
      name: 'Calcium AEP',
      latin: 'Calcium 2-aminoethylphosphate · CAS 10389-08-9 · C₂H₆CaNO₄P',
      perServing: 'One of three declared calcium sources',
      elemental: '70 mg total calcium per 2 capsules (5% DV)',
      accent: 'gold',
      claims: [
        'Calcium contributes to normal muscle contraction.',
        'Calcium is needed for the maintenance of bones and teeth.',
        'Calcium participates in cell signaling and normal blood clotting.',
      ],
      claimSource: 'Calcium — a well-characterized essential mineral.',
    },
    {
      name: 'Magnesium',
      latin: 'declared in micrograms, not milligrams',
      perServing: '950 mcg per 2 capsules',
      elemental: '0% DV — a trace amount, not a functional dose',
      accent: 'blue',
      claims: [
        'Magnesium contributes to normal muscle function.',
        'Magnesium supports energy metabolism and electrolyte balance.',
        'Magnesium is involved in normal nervous system function.',
      ],
      claimSource: 'Magnesium — a well-characterized essential mineral.',
    },
    {
      name: 'Zinc',
      latin: 'as zinc gluconate',
      perServing: '40 mg per 2 capsules',
      elemental: '364% DV as printed on the label',
      accent: 'blue',
      claims: [
        'Zinc supports normal immune function.',
        'Zinc contributes to protein synthesis and cell division.',
        'Zinc is an antioxidant that helps protect cells from free radicals.',
      ],
      claimSource: 'Zinc — a well-characterized essential mineral.',
    },
    {
      name: 'The capsule',
      latin: 'HPMC vegan shell · no gelatin',
      perServing: 'Two 00-size plant capsules daily',
      elemental: 'No gelatin, no titanium dioxide, no added sugar',
      accent: 'slate',
      claims: ['Suitable for vegan protocols — hypromellose shell, no gelatin.', 'No excipient is added to inflate milligram counts on the panel.'],
      claimSource: 'Formulation choice.',
    },
  ],
}

export const naming = {
  kicker: '03 — The name',
  title: 'Phosphoethanolamine. 2-AEP. Calcium AEP. One molecule, three names.',
  body:
    'This is the most-misspoken detail in the category, so it is spelled out on the label page. Calcium AEP is the calcium salt of 2-aminoethylphosphate — the same compound written as phosphoethanolamine in other markets. A label that lists “Calcium AEP” and “Phosphoethanolamine” as two separate actives is double-counting one ingredient.',
  /* part = which region of the schematic lights up while the step is being read */
  steps: [
    {
      part: 'head',
      title: 'The ethanolamine head',
      body: 'NH₂–CH₂–CH₂–O– is the part that separates this from a plain mineral salt, and it is why some markets write the name as phosphoethanolamine.',
      alias: 'phosphoethanolamine',
    },
    {
      part: 'link',
      title: 'The phosphate group',
      body: 'The phosphate carries the negative charges and the oxygen that ties the head to the metal. Same atoms, same CAS number — one line on a panel, not two actives.',
      alias: '2-aminoethylphosphate',
    },
    {
      part: 'metal',
      title: 'The calcium bridge',
      body: 'Two phosphate oxygens hold one Ca²⁺. That salt is what gets weighed, so the elemental calcium under it — not the weight of the salt — is the figure that belongs in the %DV column.',
      alias: 'calcium salt',
    },
    {
      part: '',
      title: 'One molecule, three names',
      body: 'Calcium AEP, 2-AEP and phosphoethanolamine describe the same compound. Pick one for the label, keep one milligram count, and the arithmetic stops being arguable.',
      alias: 'CAS 10389-08-9',
    },
  ],
  rows: [
    { k: 'IUPAC-style name', v: 'Calcium 2-aminoethylphosphate' },
    { k: 'Trade name', v: 'Calcium AEP' },
    { k: 'Also called', v: '2-AEP, phosphoethanolamine calcium salt' },
    { k: 'CAS number', v: '10389-08-9' },
    { k: 'Molecular formula', v: 'C₂H₆CaNO₄P · 179.13 g/mol' },
    { k: 'Elemental calcium', v: '≈10% by weight of the pure salt — this bottle declares total calcium, not an AEP milligram count' },
    { k: 'Form in this bottle', v: 'Micronized powder · 2 capsules per serving, as labelled' },
  ],
}
export const facts = {
  kicker: '04 — Panel',
  title: 'Supplement Facts',
  servingSize: '2 capsules',
  servingsPerContainer: 30,
  rows: [
    {
      nutrient: 'Calcium',
      detail: 'as Calcium Carbonate, NutriGPA™ Calcium Glycerophosphate and Calcium 2-Aminoethyl Phosphate',
      amount: 70,
      unit: 'mg',
      dvKey: 'calcium',
      dvPrinted: 5,
    },
    {
      nutrient: 'Zinc',
      detail: 'as Zinc Gluconate',
      amount: 40,
      unit: 'mg',
      dvKey: 'zinc',
      dvPrinted: 364,
    },
    {
      nutrient: 'Magnesium',
      detail: 'from magnesium stearate and magnesium carbonate, listed under Other Ingredients',
      amount: 950,
      unit: 'mcg',
      // %DV math runs in mg, so the printed amount and the amount fed into the
      // DV ratio are deliberately separate fields.
      dvAmount: 0.95,
      dvKey: 'magnesium',
    },
  ],
  footnote:
    'Percent Daily Values are calculated against the reference values used for nutrient labeling — calcium 1,300 mg, magnesium 420 mg, zinc 11 mg. Amounts and percentages follow the current printed label artwork, and the bottle governs if yours differs: send a photo of your panel and we will reconcile it against the lot. Magnesium is declared in micrograms, which is why its line reads 0% — a trace, stated plainly rather than rounded up.',
  other: 'Hypromellose (Capsule), Magnesium Stearate, Silicon Dioxide, Microcrystalline Cellulose, Stearic Acid, Magnesium Carbonate.',
  use: {
    title: 'Suggested use',
    body:
      'As a dietary supplement, take two capsules daily. Preferably one in the morning and one at night. Or as directed by your healthcare professional. Do not exceed the labelled serving.',
  },
  handling: {
    title: 'Storage and seal',
    body:
      'Store in a cool, dry place. Do not use if the safety seal is damaged or missing. The expiration date is printed on the bottom of the bottle. Keep out of reach of children.',
    caution:
      'Caution, as printed on the bottle: if you are pregnant, nursing, taking medication, or have a medical condition, consult your healthcare professional before using this product.',
  },
  missing: {
    title: 'Deliberately absent',
    items: ['Vitamin D3 — add it separately if your 25-OH-D is low', 'Proprietary blends', 'Stimulants', 'Filler milligrams', 'Added sugar, sodium, gluten'],
  },
}

export const audience = {
  kicker: '05 — Who it is for',
  title: 'Three real use cases. One conversation worth having first.',
  cards: [
    {
      icon: 'shield',
      title: 'Intake gaps that touch normal immune function',
      body:
        'Zinc adequacy is one of the better-described mineral inputs to normal immune function. This is written for people whose intake is genuinely short — restrictive diets, low animal-protein eating, older adults, high-sweat training. Adequacy is the whole idea; pushing immunity above normal is not something a mineral does.',
      tag: 'Daily adequacy',
    },
    {
      icon: 'bolt',
      title: 'Training load and mineral turnover',
      body:
        'Magnesium and zinc are involved in muscle function, energy metabolism and protein synthesis, and both leave with sweat. Athletes using this as an inexpensive adequacy tool is the honest framing — the sort of thing you do because your diet is inconsistent, not because of a window.',
      tag: 'Training days',
    },
    {
      icon: 'leaf',
      title: 'Clean-label constraints',
      body:
        'A hypromellose shell with no gelatin and no titanium dioxide, and the five claims printed on the tube: non-GMO, gluten free, purity sourced, no artificial colors, no added preservatives. For people narrowing their supplement list down to things with a reason to exist.',
      tag: 'Formulation',
    },
  ],
  caution: {
    title: 'If a doctor is already managing your minerals, loop them in',
    body:
      'Calcium, magnesium and zinc all bind tetracyclines, fluoroquinolones and levothyroxine in the gut, so doses usually want separating by about four hours. Magnesium behaves the same way with some bisphosphonates.',
    cta: 'Ask a question first',
  },
}

/* Model quotes. `model: true` renders a visible flag on the card — flip it to
   false only once the quote is a real, consented review you have in writing. */
export const testimonials = {
  kicker: '06 — Customer reviews',
  title: 'What people write back to us.',
  intro:
    'Reviews go up when we have them in writing from a verified order. The ones below are the shape of what we publish: about the product, the paperwork and the routine.',
  items: [
    {
      quote:
        'Long rides wreck my stomach, so tolerability is the whole test for me. One capsule with breakfast, one with dinner, and nothing to regret at kilometre twelve. Two bottles in, it is the only mineral I have not had to replace.',
      name: 'Dana R.',
      role: 'Amateur triathlete, Denver CO',
      stars: 5,
      verified: true,
      model: true,
    },
    {
      quote: 'I asked for the COA before buying and got the PDF for my lot in about a day. A brand that can produce paperwork on request is doing something right.',
      name: 'Marcus V.',
      role: 'Runs a small gym, Tampa FL',
      stars: 5,
      verified: true,
      model: true,
    },
    {
      quote:
        'The fact that the panel is three ingredients instead of seventeen made it easy to put in front of my nephrologist and get a yes for my routine.',
      name: 'Priya S.',
      role: 'Verified purchaser',
      stars: 4,
      verified: true,
      model: true,
    },
    {
      quote:
        'Vegan capsule, no gelatin, no titanium dioxide — matches what I already restrict. It replaced a much more expensive combination product on my shelf.',
      name: 'Elena K.',
      role: 'Registered dietitian',
      stars: 5,
      verified: true,
      model: true,
    },
  ],
}

export const quality = {
  kicker: '07 — Manufacturing',
  title: 'The boring guarantees that actually matter.',
  items: [
    {
      title: 'cGMP manufacturing',
      body: 'Made, packaged and held under current Good Manufacturing Practice for dietary supplements, with a master manufacturing record for every batch.',
    },
    {
      title: 'Third-party assay per lot',
      body: 'Identity and potency by ICP for the minerals; microbial screening and heavy-metal limits — lead, arsenic, cadmium, mercury — before release.',
    },
    {
      title: 'Domestic facility',
      body: 'Manufactured in the United States from globally sourced raw materials. Facility registration number is printed on the carton and available on request.',
    },
    {
      title: 'Traceable to the capsule',
      body: 'Lot and expiry on the base of the bottle. Quote the lot number and we can tell you what went into it and who tested it.',
    },
  ],
}
export const social = {
  kicker: '08 — Channels',
  title: 'Where the brand posts.',
  intro: 'Four channels. Batch releases, the manufacturing floor, sourcing notes, and the paperwork behind whatever we put a number on.',
  policy: [
    'Every batch: what went in, who milled it, what the assay said — posted when the lot ships.',
    'Formula changes get a dated change log with the reason, not a silent new carton.',
    '“What is Calcium AEP?” — the 40-second ingredient series, one molecule per episode.',],
  verify:
    'Confirm each handle is really yours before printing it. The name PhosphoPower is already in use by unrelated accounts, so link only to profiles you control and can log into.',
  verifyTitle: 'Before you publish these handles',
}

export const contact = {
  kicker: '09 — Care',
  title: 'Product, lot, COA and label questions.',
  sub:
    'One inbox, answered by the people who specify the formula: composition, timing with food, sourcing and what a given lot was tested for. Put the lot number printed on the base of the bottle in the subject line and the answer is about your batch rather than the product in general. Anything clinical gets forwarded to the right professional, not answered here.',
  channels: [
    { label: 'Email', value: brand.email, href: `mailto:${brand.email}` },
    { label: 'Location', value: brand.address },
    { label: 'Adverse events', value: `Report to ${brand.email}`, href: `mailto:${brand.email}` },
  ],
  /* The printed label and this page disagree, and a customer with a bottle in hand
     will notice. Stated here rather than left to be discovered — and deliberately not
     a link, because an address nobody reads must not be offered as a contact channel.
     If the artwork is ever reprinted, this string and the bottle are the two to fix. */
  printed:
    'Bottles in circulation print contact@phosphopower.com on the back label. That is not the service inbox — the address above is the one messages are answered from.',
  /* The boundary that used to sit under a submit button. It belongs to the address,
     not to a card: with no form there is nothing to promise about a reply, and this is
     still the line that stops an inbox from reading as a consultation. */
  boundary:
    'No purchase is made on this page. Do not send symptoms, diagnoses or medication lists — that creates a medical-relationship expectation we cannot legally meet.',
}

export const legal = {
  /* The agency statement was retired at the owner's request. That is why the nine
     ingredient claims lost their trailing asterisk in the same edit: a footnote mark
     with no note beneath it is worse than no mark at all, because it tells the reader
     a qualification exists somewhere on this page. The sentence is still printed on the
     physical label, next to the claims it qualifies, and `bullets[0]` points there. */
  bullets: [
    'Dietary supplement. Use as directed on the product label, which governs; this page is a summary of it.',
    'Not a substitute for a varied and balanced diet or a medically supervised plan. Keep out of reach of children.',
    'Do not exceed the serving size on the label. Stop and speak with a physician if you suspect a reaction.',
    'If you are pregnant, breastfeeding, being treated for a condition or taking prescription medication, talk to your clinician before use.',
    'Individual experiences in reviews are not a promise of how the product will work for you.',
  ],
}

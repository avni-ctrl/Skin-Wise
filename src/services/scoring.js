// Pure scoring engine for Formula Lab — no imports, no network, fully testable.
//
// Two honest sub-scores, both computed from the real ingredient list:
//   safety  → "will this hurt or irritate YOU?"   (penalties, weighted by label position)
//   goal    → "will this help what YOU want?"     (concern/skin-type actives, weighted by position)
// The headline score blends them; the SAFE/CAUTION/AVOID label follows safety.
//
// Label order approximates concentration, so an ingredient in the first five
// slots counts far more than one at the very end of the list.

export const CONCERN_ACTIVES = {
  acne: ['Salicylic Acid', 'Benzoyl Peroxide', 'Azelaic Acid', 'Niacinamide', 'Adapalene', 'Sulfur', 'Zinc PCA', 'Melaleuca Alternifolia Leaf Oil', 'Azadirachta Indica Leaf Extract', 'Betaine Salicylate'],
  pigmentation: ['L-Ascorbic Acid', 'Ascorbic Acid', 'Ascorbyl Glucoside', 'Sodium Ascorbyl Phosphate', 'Magnesium Ascorbyl Phosphate', '3-O-Ethyl Ascorbic Acid', 'Alpha Arbutin', 'Alpha-Arbutin', 'Kojic Acid', 'Tranexamic Acid', 'Azelaic Acid', 'Niacinamide', 'Glycyrrhiza Glabra Root Extract', 'Glutathione'],
  'anti-aging': ['Retinol', 'Retinal', 'Hydroxypinacolone Retinoate', 'Bakuchiol', 'Matrixyl 3000', 'Palmitoyl Tripeptide-1', 'Palmitoyl Pentapeptide-4', 'Acetyl Hexapeptide-3', 'Acetyl Hexapeptide-8', 'Copper Tripeptide-1', 'Coenzyme Q10', 'Adenosine', 'Ferulic Acid', 'L-Ascorbic Acid'],
  dullness: ['Glycolic Acid', 'Lactic Acid', 'Mandelic Acid', 'Gluconolactone', 'Ascorbyl Glucoside', 'L-Ascorbic Acid', 'Ascorbic Acid', 'Emblica Officinalis Fruit Extract', 'Niacinamide'],
  hydration: ['Sodium Hyaluronate', 'Hyaluronic Acid', 'Hydrolyzed Hyaluronic Acid', 'Glycerin', 'Ceramide NP', 'Ceramide AP', 'Ceramide EOP', 'Squalane', 'Panthenol', 'Polyglutamic Acid', 'Urea', 'Sodium PCA'],
  pores: ['Niacinamide', 'Salicylic Acid', 'Zinc PCA', 'Betaine Salicylate'],
  'dark circles': ['Adenosine', 'Sodium Hyaluronate', 'Caffeine', 'L-Ascorbic Acid'],
  redness: ['Centella Asiatica Extract', 'Madecassoside', 'Asiaticoside', 'Panthenol', 'Allantoin', 'Colloidal Oatmeal', 'Beta-Glucan', 'Azelaic Acid'],
}

export const TYPE_FRIENDLY = {
  dry: ['Ceramide NP', 'Ceramide AP', 'Ceramide EOP', 'Squalane', 'Sodium Hyaluronate', 'Hyaluronic Acid', 'Glycerin', 'Urea', 'Panthenol', 'Shea Butter', 'Cholesterol'],
  oily: ['Niacinamide', 'Salicylic Acid', 'Zinc PCA', 'Betaine Salicylate', 'Sodium Hyaluronate', 'Hyaluronic Acid', 'Glycerin'],
  combination: ['Niacinamide', 'Sodium Hyaluronate', 'Hyaluronic Acid', 'Glycerin', 'Panthenol', 'Zinc PCA'],
  sensitive: ['Centella Asiatica Extract', 'Madecassoside', 'Allantoin', 'Panthenol', 'Colloidal Oatmeal', 'Ceramide NP', 'Squalane', 'Beta-Glucan', 'Glycerin'],
  normal: ['Sodium Hyaluronate', 'Glycerin', 'Niacinamide', 'Panthenol'],
}

// Words people type for allergens → label names to look for.
const ALLERGEN_ALIASES = {
  alcohol: ['alcohol denat', 'sd alcohol', 'ethanol'],
  fragrance: ['fragrance', 'parfum', 'perfume'],
  parfum: ['fragrance', 'parfum', 'perfume'],
  perfume: ['fragrance', 'parfum', 'perfume'],
  nuts: ['almond', 'walnut', 'hazelnut', 'argania', 'macadamia', 'prunus'],
  nut: ['almond', 'walnut', 'hazelnut', 'argania', 'macadamia', 'prunus'],
  coconut: ['cocos nucifera', 'coco-', 'cocoyl', 'coconut'],
  'essential oils': ['oil', 'limonene', 'linalool', 'eugenol', 'geraniol'],
  sulfates: ['sulfate', 'sulphate'],
  sulphates: ['sulfate', 'sulphate'],
  parabens: ['paraben'],
  silicones: ['dimethicone', 'siloxane', 'cyclomethicone'],
}

export function positionWeight(position) {
  if (position == null) return 0.3
  if (position <= 5) return 1
  if (position <= 10) return 0.6
  if (position <= 20) return 0.3
  return 0.15
}

const nm = (ing) => ing.common_name || ing.inci_name
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
const lc = (s) => String(s ?? '').toLowerCase().trim()

function nameHaystack(ing) {
  return [ing.inci_name, ing.common_name, ...(ing.aliases ?? [])].map(lc).filter(Boolean)
}

function allergenHit(ing, allergens) {
  const hay = nameHaystack(ing)
  for (const raw of allergens) {
    const a = lc(raw)
    if (a.length < 3) continue
    const needles = ALLERGEN_ALIASES[a] ?? [a]
    if (needles.some((n) => hay.some((h) => h.includes(n)))) return raw
    if (ing.is_fragrance && ['fragrance', 'parfum', 'perfume'].includes(a)) return raw
  }
  return null
}

function overlapScore(ingredients, nameList) {
  // 0..1 — how much of the formula's weight sits on ingredients from nameList.
  const set = new Set(nameList)
  let sum = 0
  const hits = []
  for (const ing of ingredients) {
    if (set.has(ing.inci_name)) {
      sum += positionWeight(ing.position)
      hits.push(ing)
    }
  }
  return { value: Math.min(1, sum), hits }
}

export function weeksLabel(min, max) {
  if (min == null || max == null) return null
  if (min === 0 && max === 0) return 'Day 1'
  if (min === 0) return max <= 2 ? 'Immediately – 2 weeks' : `Immediately – ${max} weeks`
  if (min === max) return `${min} weeks`
  return `${min}–${max} weeks`
}

const FAMILY_NOTES = [
  { match: ['Retinol', 'Retinal', 'Tretinoin', 'Adapalene', 'Hydroxypinacolone Retinoate', 'Retinyl Palmitate'], note: 'Expect dryness or flaking in the first 2–4 weeks; start 2–3 nights a week. Skin changes build slowly.' },
  { match: ['Bakuchiol'], note: 'Gentler than retinoids, so results arrive slowly but with less irritation.' },
  { match: ['Salicylic Acid', 'Glycolic Acid', 'Lactic Acid', 'Mandelic Acid', 'Betaine Salicylate', 'Malic Acid', 'Tartaric Acid'], note: 'Small purge-like breakouts are possible in the first 2 weeks; smoother texture follows. Use SPF daily.' },
  { match: ['L-Ascorbic Acid', 'Ascorbic Acid', 'Ascorbyl Glucoside', 'Sodium Ascorbyl Phosphate', 'Magnesium Ascorbyl Phosphate', '3-O-Ethyl Ascorbic Acid', 'Tetrahexyldecyl Ascorbate', 'Ascorbyl Tetraisopalmitate'], note: 'Glow shows up first; dark-spot fading takes longer.' },
  { match: ['Alpha Arbutin', 'Alpha-Arbutin', 'Arbutin', 'Beta Arbutin', 'Kojic Acid', 'Tranexamic Acid', 'Azelaic Acid', 'Glutathione'], note: 'Pigmentation fades slowly — judge it by photos taken in the same light, not day to day.' },
  { match: ['Niacinamide'], note: 'Oil balance and redness improve first; pores look tighter later.' },
  { match: ['Benzoyl Peroxide', 'Sulfur'], note: 'Can dry the skin early on; breakouts calm within a few weeks.' },
]

function noteFor(ing) {
  const rule = FAMILY_NOTES.find((r) => r.match.includes(ing.inci_name))
  return rule?.note ?? null
}

export function scoreFormula({ ingredients, profile = null }) {
  const concerns = (profile?.skin_concerns ?? []).map(lc)
  const skinType = lc(profile?.skin_type)
  const allergens = (profile?.known_allergens ?? []).map(lc).filter(Boolean)
  const personalized = Boolean(profile)
  const sensitive = skinType === 'sensitive'
  const fragranceAverse = sensitive || allergens.some((a) => ['fragrance', 'parfum', 'perfume'].includes(a))
  // Skin types the DB's harmful_for_skin_types tags can match ("Acne Prone" for anyone with an acne concern).
  const userTypes = [skinType, concerns.includes('acne') ? 'acne prone' : null].filter(Boolean)

  const flags = []
  let safety = 100
  let hardAvoid = false

  const posText = (ing) => (ing.position != null ? ` (#${ing.position} on the label)` : '')

  for (const ing of ingredients) {
    const w = positionWeight(ing.position)
    const wMin = (floor) => Math.max(w, floor)

    const hit = allergenHit(ing, allergens)
    if (hit) {
      safety -= 45
      hardAvoid = true
      flags.push({ type: 'avoid', ingredient: nm(ing), text: `Contains ${nm(ing)}${posText(ing)} — you listed ${hit} as an allergen.` })
      continue
    }

    // Fragrance is handled by its own rule below (it is also marked harmful in the DB).
    if (ing.is_harmful_general && !ing.is_fragrance) {
      safety -= 22 * wMin(0.5)
      flags.push({ type: 'avoid', ingredient: nm(ing), text: `${nm(ing)}${posText(ing)} is flagged as a generally harmful ingredient.` })
    }

    const badTypes = (ing.harmful_for_skin_types ?? []).map(lc)
    const matchedType = userTypes.find((t) => badTypes.some((b) => b.includes(t) || t.includes(b)))
    if (matchedType) {
      safety -= 14 * w
      flags.push({ type: 'caution', ingredient: nm(ing), text: `${nm(ing)}${posText(ing)} can be harsh on ${matchedType} skin.` })
    }

    const badConcerns = (ing.harmful_for_concerns ?? []).map(lc)
    const clash = concerns.find((c) => badConcerns.some((b) => b.includes(c) || c.includes(b)))
    if (clash) {
      safety -= 10 * w
      flags.push({ type: 'caution', ingredient: nm(ing), text: `${nm(ing)}${posText(ing)} may aggravate your ${clash}.` })
    }

    if (ing.is_fragrance) {
      safety -= fragranceAverse ? 16 * wMin(0.4) : 5 * w
      if (fragranceAverse) flags.push({ type: 'caution', ingredient: nm(ing), text: `Contains fragrance (${nm(ing)})${posText(ing)} — a common trigger for ${sensitive ? 'sensitive skin' : 'your sensitivity'}.` })
    }

    if (ing.inci_name === 'Alcohol Denat') {
      const drying = sensitive || skinType === 'dry'
      safety -= drying ? 10 * wMin(0.4) : 2 * w
      if (drying) flags.push({ type: 'caution', ingredient: nm(ing), text: `Denatured alcohol${posText(ing)} can dry out and sting ${skinType} skin.` })
    }

    const comedogenic = (ing.comedogenic_rating ?? 0) >= 3
    if (comedogenic && (skinType === 'oily' || concerns.includes('acne') || concerns.includes('pores'))) {
      safety -= 7 * ((ing.comedogenic_rating ?? 3) - 2) * w
      flags.push({ type: 'caution', ingredient: nm(ing), text: `${nm(ing)}${posText(ing)} is comedogenic (${ing.comedogenic_rating}/5) — it can clog pores.` })
    }
  }
  safety = Math.round(clamp(safety, 0, 100))

  // ── Goal fit ────────────────────────────────────────────────────────────
  const components = []
  const concernDetail = []
  for (const c of concerns) {
    const list = CONCERN_ACTIVES[c]
    if (!list) continue
    const { value, hits } = overlapScore(ingredients, list)
    components.push(value * 100)
    concernDetail.push({ concern: c, fit: Math.round(value * 100), ingredients: hits.map(nm) })
    for (const h of hits.slice(0, 2)) {
      flags.push({ type: 'good', ingredient: nm(h), text: `${nm(h)}${posText(h)} targets ${c}.` })
    }
  }
  const friendlyList = TYPE_FRIENDLY[skinType]
  let friendlyHits = []
  if (friendlyList) {
    const { value, hits } = overlapScore(ingredients, friendlyList)
    components.push(value * 100)
    friendlyHits = hits
    if (hits[0]) flags.push({ type: 'good', ingredient: nm(hits[0]), text: `${nm(hits[0])} suits ${skinType} skin.` })
  }
  if (!components.length) {
    const actives = ingredients.filter((i) => i.is_active)
    const sum = actives.reduce((s, i) => s + positionWeight(i.position), 0)
    components.push(Math.min(1, sum) * 100 * 0.8)
  }
  const goal = Math.round(components.reduce((a, b) => a + b, 0) / components.length)

  let score = Math.round(0.5 * safety + 0.5 * goal)
  if (hardAvoid) score = Math.min(score, 20)

  const label = hardAvoid || safety < 45 ? 'AVOID' : safety < 75 || score < 45 ? 'CAUTION' : 'SAFE'

  return {
    score: clamp(score, 3, 98),
    label,
    subScores: { safety, goal },
    flags,
    concernDetail,
    friendlyHits,
    hardAvoid,
    personalized,
  }
}

// Pick the ingredients worth talking about, with a rule-based "why for you".
export function pickKeyIngredients(ingredients, profile = null, limit = 6) {
  const concerns = (profile?.skin_concerns ?? []).map(lc)
  const skinType = lc(profile?.skin_type)
  const targetsOf = (ing) => concerns.filter((c) => (CONCERN_ACTIVES[c] ?? []).includes(ing.inci_name))
  const friendly = (ing) => (TYPE_FRIENDLY[skinType] ?? []).includes(ing.inci_name)
  const basics = new Set(['aqua', 'water', 'phenoxyethanol', 'ethylhexylglycerin', 'caprylyl glycol', 'sodium benzoate', 'potassium sorbate', 'citric acid', 'triethanolamine', 'sodium chloride'])

  const candidates = ingredients
    .filter((i) => !basics.has(lc(i.inci_name)))
    .map((ing) => {
      const t = targetsOf(ing)
      const rank = (t.length ? 4 : 0) + (ing.is_active ? 3 : 0) + (friendly(ing) ? 1.5 : 0) + positionWeight(ing.position)
      return { ing, t, rank, interesting: t.length > 0 || ing.is_active || friendly(ing) }
    })

  let chosen = candidates.filter((c) => c.interesting).sort((a, b) => b.rank - a.rank).slice(0, limit)
  const onlySupporting = chosen.length === 0
  if (onlySupporting) chosen = candidates.sort((a, b) => (a.ing.position ?? 99) - (b.ing.position ?? 99)).slice(0, 3)

  const keyIngredients = chosen.map(({ ing, t }) => {
    const badTypes = (ing.harmful_for_skin_types ?? []).map(lc)
    let forYou = null
    if (skinType && badTypes.some((b) => b.includes(skinType))) forYou = `May be harsh on ${skinType} skin.`
    else if (concerns.includes('acne') && badTypes.some((b) => b.includes('acne'))) forYou = 'Can aggravate acne-prone skin.'
    else if (t.length) forYou = `Targets your ${t.join(' and ')}.`
    else if (friendly(ing)) forYou = `Well suited to ${skinType} skin.`
    return { ...ing, forYou }
  })
  return { keyIngredients, onlySupporting }
}

// Timeline from the ingredients actually present, using weeks data in the DB.
export function buildTimeline(ingredients, profile = null) {
  const concerns = (profile?.skin_concerns ?? []).map(lc)
  const rows = ingredients
    .filter((i) => i.weeks_min != null && i.weeks_max != null && (i.position ?? 99) <= 15 && (i.is_active || i.weeks_max > 2))
    .map((ing) => ({
      ingredient: ing.inci_name,
      inci: ing.inci_name,
      min: ing.weeks_min,
      max: ing.weeks_max,
      window: weeksLabel(ing.weeks_min, ing.weeks_max),
      note: noteFor(ing),
      relevant: concerns.some((c) => (CONCERN_ACTIVES[c] ?? []).includes(ing.inci_name)),
    }))
    .sort((a, b) => a.min - b.min || a.max - b.max)

  // De-dupe near-identical rows (e.g. two arbutin spellings).
  const seen = new Set()
  const entries = rows.filter((r) => {
    const k = `${r.ingredient}|${r.window}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  const slow = [...entries].filter((e) => e.max > 0).sort((a, b) => b.max - a.max)
  const driver = slow.find((e) => e.relevant) ?? slow[0] ?? null
  const headline = !entries.length
    ? 'No treatment actives found — judge this formula by how it feels (comfort, hydration, finish), not by a results timeline.'
    : driver
      ? `Slowest key active: ${driver.ingredient} — give it ${driver.window} of consistent use before judging.`
      : 'Protection and comfort start from the first use.'
  return { headline, entries: entries.slice(0, 6) }
}

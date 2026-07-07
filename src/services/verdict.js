// getProductVerdict — the Formula Lab brain.
// Reads real rows from Supabase (products, ingredients, product_ingredients,
// conflict_pairs) and scores them against the user's saved profile + routine.
// This function is the seam where an external analysis API could plug in
// later; v1 computes entirely from the founder's ingredient database.
import { getProduct, getProductIngredients } from './catalog'
import { checkProductAgainstRoutine } from './conflicts'

const CONCERN_ACTIVES = {
  acne: ['Salicylic Acid', 'Benzoyl Peroxide', 'Azelaic Acid', 'Niacinamide', 'Melaleuca Alternifolia Leaf Oil', 'Azadirachta Indica Leaf Extract'],
  pigmentation: ['L-Ascorbic Acid', 'Ascorbyl Glucoside', 'Sodium Ascorbyl Phosphate', 'Alpha Arbutin', 'Kojic Acid', 'Tranexamic Acid', 'Azelaic Acid', 'Glycyrrhiza Glabra Root Extract'],
  'anti-aging': ['Retinol', 'Hydroxypinacolone Retinoate', 'Bakuchiol', 'Matrixyl 3000', 'Palmitoyl Tripeptide-1', 'Acetyl Hexapeptide-3', 'Coenzyme Q10', 'Adenosine'],
  dullness: ['Glycolic Acid', 'Lactic Acid', 'Mandelic Acid', 'Ascorbyl Glucoside', 'L-Ascorbic Acid', 'Emblica Officinalis Fruit Extract'],
  hydration: ['Sodium Hyaluronate', 'Hyaluronic Acid', 'Hydrolyzed Hyaluronic Acid', 'Glycerin', 'Ceramide NP', 'Squalane', 'Panthenol', 'Polyglutamic Acid'],
  pores: ['Niacinamide', 'Salicylic Acid'],
  'dark circles': ['Adenosine', 'Sodium Hyaluronate'],
  redness: ['Centella Asiatica Extract', 'Madecassoside', 'Panthenol', 'Allantoin', 'Colloidal Oatmeal', 'Beta-Glucan'],
}

const TIMELINE_RULES = [
  { match: ['Salicylic Acid', 'Glycolic Acid', 'Lactic Acid', 'Mandelic Acid'], weeks: [
    { label: 'Week 1–2', note: 'Possible purging as pores clear — small breakouts where congestion already sat. Normal.' },
    { label: 'Week 3–4', note: 'Texture smooths; blackheads and congestion visibly reduce.' },
    { label: 'Week 6+', note: 'Tone looks more even. Keep SPF strict — exfoliated skin burns faster.' },
  ]},
  { match: ['Niacinamide'], weeks: [
    { label: 'Week 2–4', note: 'Oil production starts to balance; redness calms.' },
    { label: 'Week 8', note: 'Pores appear tighter; barrier measurably stronger.' },
  ]},
  { match: ['Retinol', 'Hydroxypinacolone Retinoate', 'Bakuchiol'], weeks: [
    { label: 'Week 1–3', note: 'Adjustment: mild dryness or flaking. Buffer with moisturizer.' },
    { label: 'Week 8–12', note: 'Fine lines soften; skin renews on a faster cycle.' },
    { label: 'Month 6', note: 'Collagen-level changes show — this is the long game.' },
  ]},
  { match: ['L-Ascorbic Acid', 'Ascorbyl Glucoside', 'Sodium Ascorbyl Phosphate', 'Alpha Arbutin', 'Kojic Acid', 'Tranexamic Acid'], weeks: [
    { label: 'Week 2–4', note: 'First glow — brightness before spot-fading.' },
    { label: 'Week 8–12', note: 'Dark spots and post-acne marks visibly fade.' },
  ]},
  { match: ['Ceramide NP', 'Sodium Hyaluronate', 'Squalane', 'Panthenol', 'Glycerin'], weeks: [
    { label: 'Immediately', note: 'Plumper, more comfortable skin from the first use.' },
    { label: 'Week 2–4', note: 'Barrier repair compounds — less tightness, less reactivity.' },
  ]},
  { match: ['Zinc Oxide', 'Titanium Dioxide', 'Ethylhexyl Methoxycinnamate', 'Butyl Methoxydibenzoylmethane'], weeks: [
    { label: 'Immediately', note: 'Protection starts day one.' },
    { label: 'Ongoing', note: 'The quiet hero: most visible aging is unprotected UV. Consistency is the result.' },
  ]},
]

const HOT_CITIES = ['mumbai', 'delhi', 'chennai', 'kolkata', 'hyderabad', 'ahmedabad', 'jaipur', 'surat', 'nagpur', 'lucknow', 'kanpur', 'indore', 'bhopal', 'patna', 'vadodara']

function scoreLabel(score) {
  if (score >= 71) return 'SAFE'
  if (score >= 41) return 'CAUTION'
  return 'AVOID'
}

export async function getProductVerdict(productId, profile = null, routineItems = []) {
  const [product, ingredients] = await Promise.all([
    getProduct(productId),
    getProductIngredients(productId),
  ])

  const concerns = (profile?.skin_concerns ?? []).map((c) => c.toLowerCase())
  const skinType = (profile?.skin_type ?? '').toLowerCase()
  const allergens = (profile?.known_allergens ?? []).map((a) => a.toLowerCase())

  let score = 78
  const flags = []
  let concernBoost = 0

  for (const ing of ingredients) {
    if (ing.is_harmful_general) {
      score -= 18
      flags.push({ type: 'avoid', text: `${ing.common_name || ing.inci_name} is flagged as generally harmful.` })
    }
    const badTypes = (ing.harmful_for_skin_types ?? []).map((t) => t.toLowerCase())
    if (skinType && badTypes.some((t) => t.includes(skinType))) {
      score -= 8
      flags.push({ type: 'caution', text: `${ing.common_name || ing.inci_name} can be harsh on ${skinType} skin.` })
    }
    const badConcerns = (ing.harmful_for_concerns ?? []).map((c) => c.toLowerCase())
    if (concerns.some((c) => badConcerns.some((b) => b.includes(c) || c.includes(b)))) {
      score -= 6
      flags.push({ type: 'caution', text: `${ing.common_name || ing.inci_name} may aggravate one of your concerns.` })
    }
    if (ing.is_fragrance) {
      const sensitiveToFragrance = allergens.includes('fragrance') || skinType === 'sensitive'
      score -= sensitiveToFragrance ? 10 : 3
      if (sensitiveToFragrance) flags.push({ type: 'caution', text: `Contains fragrance — you flagged fragrance sensitivity.` })
    }
    if (ing.inci_name === 'Alcohol Denat' && allergens.includes('alcohol')) {
      score -= 8
      flags.push({ type: 'caution', text: 'Contains denatured alcohol, which you flagged.' })
    }
    if ((ing.comedogenic_rating ?? 0) >= 3 && (skinType === 'oily' || concerns.includes('acne') || concerns.includes('pores'))) {
      score -= 4 * ((ing.comedogenic_rating ?? 3) - 2)
      flags.push({ type: 'caution', text: `${ing.common_name || ing.inci_name} is comedogenic (${ing.comedogenic_rating}/5) — watch for clogged pores.` })
    }
    if (ing.oxidizes) score -= 2

    for (const concern of concerns) {
      if ((CONCERN_ACTIVES[concern] ?? []).includes(ing.inci_name)) {
        concernBoost = Math.min(concernBoost + 5, 15)
        flags.push({ type: 'good', text: `${ing.common_name || ing.inci_name} directly targets ${concern}.` })
        break
      }
    }
  }
  score = Math.round(Math.max(5, Math.min(98, score + concernBoost)))

  // Routine conflicts — the user's REAL saved routine, not a demo.
  const routineConflicts = await checkProductAgainstRoutine(ingredients, routineItems)
  if (routineConflicts.some((c) => c.severity === 'high')) score = Math.min(score, 68)

  // Shelf life — PAO plus oxidation plus city climate.
  const oxidizers = ingredients.filter((i) => i.oxidizes)
  const city = (profile?.city ?? '').toLowerCase()
  const hotClimate = HOT_CITIES.some((c) => city.includes(c))
  const paoEffective = hotClimate && product.pao_heat_adjusted ? product.pao_heat_adjusted : product.pao_months
  const shelfLife = {
    paoMonths: product.pao_months,
    paoEffective,
    hotClimate,
    note: [
      product.pao_months ? `${product.pao_months} months after opening.` : 'No PAO on record — assume 12 months after opening.',
      hotClimate && product.pao_heat_adjusted && product.pao_heat_adjusted < product.pao_months
        ? `In ${profile.city}'s heat, treat it as ${product.pao_heat_adjusted} months.`
        : null,
      oxidizers.length
        ? `${oxidizers.map((o) => o.common_name || o.inci_name).join(', ')} oxidize${oxidizers.length === 1 ? 's' : ''} — keep it capped, cool and away from light.`
        : null,
    ].filter(Boolean).join(' '),
  }

  // Realistic timeline from the actives actually present.
  const inciSet = new Set(ingredients.map((i) => i.inci_name))
  const timeline = []
  for (const rule of TIMELINE_RULES) {
    if (rule.match.some((m) => inciSet.has(m))) {
      for (const w of rule.weeks) if (!timeline.some((t) => t.label === w.label && t.note === w.note)) timeline.push(w)
    }
  }
  if (!timeline.length) timeline.push({ label: 'Week 2–4', note: 'Comfort-focused formula — expect steady maintenance rather than dramatic change.' })

  const keyIngredients = ingredients
    .filter((i) => i.is_active)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
    .slice(0, 6)

  return {
    product,
    ingredients,
    keyIngredients,
    score,
    label: scoreLabel(score),
    flags,
    routineConflicts,
    shelfLife,
    timeline,
    personalized: Boolean(profile),
  }
}

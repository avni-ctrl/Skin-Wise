// getProductVerdict — the Formula Lab brain.
// Scores a product's REAL ingredient list against the user's saved profile + routine.
// The maths lives in ./scoring.js (pure + unit-tested); this file gathers the data.
//
// A verdict is only produced when the ingredient list is trustworthy
// (fetched from the web by /api/lookup, or hand-verified). Heuristic "estimated"
// lists and products with no list return { unavailable: true } — never a made-up score.
import { getProduct, getProductIngredients } from './catalog'
import { checkProductAgainstRoutine } from './conflicts'
import { scoreFormula, pickKeyIngredients, buildTimeline } from './scoring'

const HOT_CITIES = ['mumbai', 'delhi', 'chennai', 'kolkata', 'hyderabad', 'ahmedabad', 'jaipur', 'surat', 'nagpur', 'lucknow', 'kanpur', 'indore', 'bhopal', 'patna', 'vadodara']

export const hasReliableIngredients = (product) => ['auto', 'verified'].includes(product?.ingredients_status)

function dedupeBy(list, keyFn, limit) {
  const seen = new Set()
  const out = []
  for (const item of list) {
    const k = keyFn(item)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(item)
    if (out.length >= limit) break
  }
  return out
}

export async function getProductVerdict(productId, profile = null, routineItems = []) {
  const product = await getProduct(productId)
  if (!hasReliableIngredients(product)) {
    return { product, unavailable: true, dataStatus: product.ingredients_status }
  }
  const ingredients = await getProductIngredients(productId)
  if (!ingredients.length) return { product, unavailable: true, dataStatus: 'missing' }

  const scored = scoreFormula({ ingredients, profile })
  let { score, label } = scored

  // Routine conflicts — the user's REAL saved routine.
  const routineConflicts = await checkProductAgainstRoutine(ingredients, routineItems)
  if (routineConflicts.some((c) => c.severity === 'high')) {
    score = Math.min(score, 60)
    if (label === 'SAFE') label = 'CAUTION'
  }

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

  const { keyIngredients, onlySupporting } = pickKeyIngredients(ingredients, profile)
  const timeline = buildTimeline(ingredients, profile)

  const pros = dedupeBy(scored.flags.filter((f) => f.type === 'good'), (f) => f.ingredient, 4)
  const cons = dedupeBy(scored.flags.filter((f) => f.type !== 'good'), (f) => f.ingredient, 4)

  return {
    product,
    dataStatus: product.ingredients_status,
    sourceUrl: product.ingredients_source_url,
    ingredients,
    keyIngredients,
    onlySupporting,
    score,
    label,
    subScores: scored.subScores,
    concernDetail: scored.concernDetail,
    pros,
    cons,
    routineConflicts,
    shelfLife,
    timeline,
    personalized: scored.personalized,
  }
}

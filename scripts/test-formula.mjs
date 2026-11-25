// Run with:  node --test scripts/
// Uses real flag values copied from the SkinWise `ingredients` table.
import test from 'node:test'
import assert from 'node:assert/strict'
import { splitIngredientList, buildDictionary, matchIngredients, productNameSimilar, displayName } from '../server/lib/ingredients.js'
import { scoreFormula, pickKeyIngredients, buildTimeline } from '../src/services/scoring.js'

const base = { is_active: false, is_comedogenic: false, comedogenic_rating: 0, is_fragrance: false, oxidizes: false, is_harmful_general: false, harmful_for_skin_types: [], harmful_for_concerns: [], aliases: [], weeks_min: null, weeks_max: null }
const DB = [
  { id: 56, inci_name: 'Salicylic Acid', common_name: 'BHA (Beta Hydroxy Acid)', ...base, is_active: true, harmful_for_skin_types: ['Dry', 'Sensitive'], harmful_for_concerns: ['Eczema'], aliases: ['bha'], weeks_min: 2, weeks_max: 6 },
  { id: 67, inci_name: 'Niacinamide', common_name: 'Vitamin B3', ...base, is_active: true, aliases: ['niacinamide (vitamin b3)', 'vitamin b3', 'nicotinamide'], weeks_min: 4, weeks_max: 8 },
  { id: 68, inci_name: 'Retinol', common_name: 'Vitamin A (OTC)', ...base, is_active: true, oxidizes: true, harmful_for_skin_types: ['Sensitive', 'Dry'], harmful_for_concerns: ['Eczema', 'Rosacea', 'Pregnancy'], weeks_min: 8, weeks_max: 12 },
  { id: 226, inci_name: 'Zinc PCA', common_name: 'Zinc PCA', ...base, is_active: true, harmful_for_skin_types: null, harmful_for_concerns: null, weeks_min: 4, weeks_max: 8 },
  { id: 80, inci_name: 'Sodium Hyaluronate', common_name: 'Hyaluronic Acid Salt', ...base, aliases: ['sodium hyaluronate crosspolymer'], weeks_min: 0, weeks_max: 2 },
  { id: 83, inci_name: 'Glycerin', common_name: 'Glycerol', ...base, weeks_min: 0, weeks_max: 2 },
  { id: 110, inci_name: 'Ceramide NP', common_name: 'Ceramide 3', ...base, weeks_min: 2, weeks_max: 4 },
  { id: 117, inci_name: 'Panthenol', common_name: 'Pro-Vitamin B5', ...base, aliases: ['panthenol (vitamin b5)', 'dl-panthenol'], weeks_min: 1, weeks_max: 4 },
  { id: 114, inci_name: 'Centella Asiatica Extract', common_name: 'Cica / Tiger Grass', ...base, is_active: true, weeks_min: 2, weeks_max: 4 },
  { id: 94, inci_name: 'Dimethicone', common_name: 'Silicone', ...base, harmful_for_skin_types: ['Acne Prone'], harmful_for_concerns: ['Fungal Acne'] },
  { id: 100, inci_name: 'Cocos Nucifera Oil', common_name: 'Coconut Oil', ...base, is_comedogenic: true, comedogenic_rating: 4, harmful_for_skin_types: ['Oily', 'Acne Prone'], harmful_for_concerns: ['Acne Vulgaris', 'Comedones'] },
  { id: 101, inci_name: 'Isopropyl Myristate', common_name: 'IPM', ...base, is_comedogenic: true, comedogenic_rating: 5, harmful_for_skin_types: ['Oily', 'Acne Prone'], harmful_for_concerns: ['Blackheads', 'Acne Vulgaris'] },
  { id: 137, inci_name: 'Fragrance', common_name: 'Parfum / Synthetic Fragrance', ...base, is_fragrance: true, is_harmful_general: true, harmful_for_skin_types: ['Sensitive', 'Dry'], harmful_for_concerns: ['Contact Dermatitis', 'Rosacea', 'Eczema'], aliases: ['parfum', 'perfume', 'aroma'] },
  { id: 180, inci_name: 'Alcohol Denat', common_name: 'Denatured Alcohol', ...base, harmful_for_skin_types: ['Dry', 'Sensitive'], harmful_for_concerns: ['Barrier Compromise', 'Rosacea'], aliases: ['alcohol denat.', 'sd alcohol', 'alcohol'] },
  { id: 148, inci_name: 'Phenoxyethanol', common_name: 'Phenoxyethanol', ...base, harmful_for_skin_types: ['Sensitive'] },
]
const byName = Object.fromEntries(DB.map((r) => [r.inci_name, r]))
const formula = (...names) => names.map((n, i) => ({ ...(byName[n] ?? { ...base, id: 900 + i, inci_name: n, common_name: n }), position: i + 1 }))

const oilyAcne = { skin_type: 'oily', skin_concerns: ['acne', 'pores'], known_allergens: [] }

// ── parsing ────────────────────────────────────────────────────────────────
test('splitIngredientList handles labels, parentheses, newlines and trailing periods', () => {
  const raw = 'Ingredients: Aqua (Water), Glycerin, Niacinamide (Vitamin B3),\nPEG-40 Hydrogenated Castor Oil, Sodium Hyaluronate.'
  assert.deepEqual(splitIngredientList(raw), ['Aqua (Water)', 'Glycerin', 'Niacinamide (Vitamin B3)', 'PEG-40 Hydrogenated Castor Oil', 'Sodium Hyaluronate'])
})

test('splitIngredientList does not split inside parentheses', () => {
  assert.deepEqual(splitIngredientList('Aqua, Tocopherol (Vitamin E, natural), Glycerin'), ['Aqua', 'Tocopherol (Vitamin E, natural)', 'Glycerin'])
})

test('matchIngredients maps aliases, keeps label order, reports unknowns once', () => {
  const dict = buildDictionary(DB)
  const items = splitIngredientList('Aqua (Water), Glycerin, Niacinamide (Vitamin B3), Parfum, Glycerin, Mystery Extract')
  const { matched, unmatched } = matchIngredients(items, dict)
  assert.deepEqual(matched, [
    { position: 2, ingredient_id: 83 },
    { position: 3, ingredient_id: 67 },
    { position: 4, ingredient_id: 137 },
  ])
  assert.deepEqual(unmatched, [{ position: 1, name: 'Aqua' }, { position: 6, name: 'Mystery Extract' }])
})

test('displayName tidies shouty labels and water', () => {
  assert.equal(displayName('AQUA'), 'Aqua')
  assert.equal(displayName('Water/Aqua/Eau'), 'Aqua')
  assert.equal(displayName('CETEARYL ALCOHOL'), 'Cetearyl Alcohol')
})

test('productNameSimilar blocks the wrong variant but allows the right one', () => {
  assert.equal(productNameSimilar('Salicylic Acid 2% Solution', 'The Ordinary Salicylic Acid 2% Solution', 'The Ordinary'), true)
  assert.equal(productNameSimilar('Salicylic Acid 2% Solution', 'The Ordinary Caffeine Solution 5%', 'The Ordinary'), false)
})

// ── scoring ────────────────────────────────────────────────────────────────
test('scores spread widely: good > middling > bad for an oily, acne-prone user', () => {
  const good = scoreFormula({ ingredients: formula('Aqua', 'Glycerin', 'Salicylic Acid', 'Niacinamide', 'Zinc PCA', 'Sodium Hyaluronate', 'Phenoxyethanol'), profile: oilyAcne })
  const meh = scoreFormula({ ingredients: formula('Aqua', 'Glycerin', 'Dimethicone', 'Phenoxyethanol', 'Sodium Hyaluronate'), profile: oilyAcne })
  const bad = scoreFormula({ ingredients: formula('Aqua', 'Isopropyl Myristate', 'Cocos Nucifera Oil', 'Dimethicone', 'Fragrance', 'Alcohol Denat'), profile: oilyAcne })
  console.log('  good', good.score, good.label, good.subScores, '| meh', meh.score, meh.label, meh.subScores, '| bad', bad.score, bad.label, bad.subScores)
  assert.ok(good.score >= 80, `good was ${good.score}`)
  assert.ok(bad.score <= 45, `bad was ${bad.score}`)
  assert.ok(good.score - bad.score >= 40)
  assert.ok(good.score > meh.score && meh.score > bad.score)
  assert.equal(good.label, 'SAFE')
  assert.notEqual(bad.label, 'SAFE')
})

test('the same formula scores differently for different skin', () => {
  const retinolCream = formula('Aqua', 'Glycerin', 'Retinol', 'Fragrance', 'Alcohol Denat', 'Phenoxyethanol')
  const sensitive = scoreFormula({ ingredients: retinolCream, profile: { skin_type: 'sensitive', skin_concerns: ['redness'], known_allergens: [] } })
  const agingOily = scoreFormula({ ingredients: retinolCream, profile: { skin_type: 'normal', skin_concerns: ['anti-aging'], known_allergens: [] } })
  console.log('  sensitive', sensitive.score, sensitive.label, '| anti-aging', agingOily.score, agingOily.label)
  assert.ok(agingOily.score - sensitive.score >= 20)
  assert.equal(sensitive.label === 'SAFE', false)
})

test('a listed allergen forces AVOID regardless of other benefits', () => {
  const r = scoreFormula({ ingredients: formula('Aqua', 'Niacinamide', 'Fragrance', 'Glycerin'), profile: { skin_type: 'normal', skin_concerns: ['pores'], known_allergens: ['Fragrance'] } })
  assert.equal(r.label, 'AVOID')
  assert.ok(r.score <= 20)
  assert.ok(r.flags.some((f) => f.type === 'avoid' && /allergen/.test(f.text)))
})

test('allergen "alcohol" does not trip on harmless fatty alcohols', () => {
  const r = scoreFormula({ ingredients: formula('Aqua', 'Cetyl Alcohol', 'Glycerin'), profile: { skin_type: 'normal', skin_concerns: [], known_allergens: ['alcohol'] } })
  assert.equal(r.hardAvoid, false)
})

test('without a profile it still returns a sane general score', () => {
  const r = scoreFormula({ ingredients: formula('Aqua', 'Glycerin', 'Niacinamide', 'Panthenol'), profile: null })
  assert.ok(r.score > 40 && r.score <= 98)
  assert.equal(r.personalized, false)
})

test('fragrance is not double-penalised for people who are not fragrance-averse', () => {
  const r = scoreFormula({ ingredients: formula('Aqua', 'Glycerin', 'Fragrance'), profile: { skin_type: 'normal', skin_concerns: [], known_allergens: [] } })
  assert.ok(r.subScores.safety >= 90, `safety was ${r.subScores.safety}`)
})

// ── key ingredients and timeline ───────────────────────────────────────────
test('key ingredients explain relevance to this user, not generic filler', () => {
  const { keyIngredients } = pickKeyIngredients(formula('Aqua', 'Salicylic Acid', 'Niacinamide', 'Glycerin', 'Dimethicone'), oilyAcne)
  const sal = keyIngredients.find((k) => k.inci_name === 'Salicylic Acid')
  assert.match(sal.forYou, /acne/)
  assert.ok(keyIngredients.length >= 2)
})

test('timeline uses real per-ingredient windows and picks the slowest relevant active', () => {
  const t = buildTimeline(formula('Aqua', 'Retinol', 'Niacinamide', 'Glycerin'), { skin_concerns: ['anti-aging'] })
  assert.match(t.headline, /Retinol/)
  assert.match(t.headline, /8–12 weeks/)
  assert.ok(t.entries.some((e) => e.inci === 'Niacinamide' && e.window === '4–8 weeks'))
})

test('a formula with no treatment actives says so honestly instead of "2-4 weeks"', () => {
  const t = buildTimeline(formula('Aqua', 'Dimethicone', 'Phenoxyethanol'), null)
  assert.match(t.headline, /No treatment actives/)
  assert.equal(t.entries.length, 0)
})

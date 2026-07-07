import { supabase } from '../lib/supabase'
import { getIngredientsForProducts } from './catalog'

let conflictPairsCache = null

// The founder-owned conflict knowledge base (public read).
export async function loadConflictPairs() {
  if (conflictPairsCache) return conflictPairsCache
  const { data, error } = await supabase
    .from('conflict_pairs')
    .select('id, ingredient_id_1, ingredient_id_2, severity, explanation, fix')
  if (error) throw error
  conflictPairsCache = data ?? []
  return conflictPairsCache
}

function pairKey(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`
}

// checkRoutineConflicts(routine) — cross-references ingredient_conflicts for
// every pair of products used at the same time of day. Real rows, no stubs.
export async function checkRoutineConflicts(routineItems) {
  if (!routineItems?.length) return []
  const pairs = await loadConflictPairs()
  const pairMap = new Map(pairs.map((p) => [pairKey(p.ingredient_id_1, p.ingredient_id_2), p]))

  const productIds = [...new Set(routineItems.map((r) => r.product_id))]
  const ingByProduct = await getIngredientsForProducts(productIds)

  const conflicts = []
  const seen = new Set()
  for (let i = 0; i < routineItems.length; i++) {
    for (let j = i + 1; j < routineItems.length; j++) {
      const a = routineItems[i]
      const b = routineItems[j]
      if (a.time_of_day !== b.time_of_day) continue
      if (a.product_id === b.product_id) continue
      const ingsA = ingByProduct[a.product_id] ?? []
      const ingsB = ingByProduct[b.product_id] ?? []
      for (const ia of ingsA) {
        for (const ib of ingsB) {
          const hit = pairMap.get(pairKey(ia.id, ib.id))
          if (!hit) continue
          const dedupe = `${pairKey(a.product_id, b.product_id)}|${hit.id}`
          if (seen.has(dedupe)) continue
          seen.add(dedupe)
          conflicts.push({
            itemA: a,
            itemB: b,
            ingredientA: ia,
            ingredientB: ib,
            severity: hit.severity,
            explanation: hit.explanation,
            fix: hit.fix,
            timeOfDay: a.time_of_day,
          })
        }
      }
    }
  }
  const order = { high: 0, medium: 1, low: 2 }
  return conflicts.sort((x, y) => order[x.severity] - order[y.severity])
}

// Conflicts between ONE product's ingredients and the user's saved routine.
export async function checkProductAgainstRoutine(productIngredients, routineItems) {
  if (!routineItems?.length || !productIngredients?.length) return []
  const pairs = await loadConflictPairs()
  const pairMap = new Map(pairs.map((p) => [pairKey(p.ingredient_id_1, p.ingredient_id_2), p]))

  const productIds = [...new Set(routineItems.map((r) => r.product_id))]
  const ingByProduct = await getIngredientsForProducts(productIds)

  const results = []
  const seen = new Set()
  for (const item of routineItems) {
    for (const routineIng of ingByProduct[item.product_id] ?? []) {
      for (const ing of productIngredients) {
        const hit = pairMap.get(pairKey(ing.id, routineIng.id))
        if (!hit) continue
        const dedupe = `${item.product_id}|${hit.id}`
        if (seen.has(dedupe)) continue
        seen.add(dedupe)
        results.push({
          withItem: item,
          ingredient: ing,
          routineIngredient: routineIng,
          severity: hit.severity,
          explanation: hit.explanation,
          fix: hit.fix,
        })
      }
    }
  }
  const order = { high: 0, medium: 1, low: 2 }
  return results.sort((x, y) => order[x.severity] - order[y.severity])
}

// Warnings for users on prescription treatments (isotretinoin, tretinoin…).
export async function getTreatmentWarnings(treatmentNames, productIngredients) {
  if (!treatmentNames?.length || !productIngredients?.length) return []
  const { data, error } = await supabase
    .from('treatment_ingredient_warnings')
    .select('treatment_name, ingredient_id, reason, severity')
  if (error) throw error
  const ingIds = new Set(productIngredients.map((i) => i.id))
  const lowerNames = treatmentNames.map((t) => t.toLowerCase())
  return (data ?? []).filter(
    (w) =>
      ingIds.has(w.ingredient_id) &&
      lowerNames.some((n) => w.treatment_name.toLowerCase().includes(n) || n.includes(w.treatment_name.toLowerCase()))
  )
}

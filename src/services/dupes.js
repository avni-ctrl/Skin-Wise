// findDupes — matches on shared ingredients from products/product_ingredients,
// weighting actives heavily, and returns ranked cheaper-first alternatives.
// Real Supabase rows only.
import { supabase } from '../lib/supabase'
import { getProduct, getProductIngredients } from './catalog'

export async function findDupes(productId, limit = 6) {
  const [target, targetIngredients] = await Promise.all([
    getProduct(productId),
    getProductIngredients(productId),
  ])

  const targetIds = targetIngredients.map((i) => i.id)
  const activeIds = new Set(targetIngredients.filter((i) => i.is_active).map((i) => i.id))
  if (!targetIds.length) return { target, targetIngredients, dupes: [] }

  // Match on the FULL ingredient list (actives weighted 3×) so a product
  // sharing one hero active but nothing else can't score as a near-perfect dupe.
  const { data: rows, error } = await supabase
    .from('product_ingredients')
    .select('product_id, ingredient_id')
    .in('ingredient_id', targetIds)
    .neq('product_id', productId)
  if (error) throw error

  const overlap = new Map()
  for (const r of rows ?? []) {
    const entry = overlap.get(r.product_id) ?? { shared: new Set(), weight: 0 }
    if (!entry.shared.has(r.ingredient_id)) {
      entry.shared.add(r.ingredient_id)
      entry.weight += activeIds.has(r.ingredient_id) ? 3 : 1
    }
    overlap.set(r.product_id, entry)
  }

  const candidateIds = [...overlap.entries()]
    .sort((a, b) => b[1].weight - a[1].weight)
    .slice(0, 48)
    .map(([id]) => id)
  if (!candidateIds.length) return { target, targetIngredients, dupes: [] }

  const { data: candidates, error: e2 } = await supabase
    .from('products')
    .select('id, name, category, price_inr, ingredient_quality_score, hype_score, brand:brands(name)')
    .in('id', candidateIds)
  if (e2) throw e2

  const maxWeight = targetIngredients.reduce((sum, i) => sum + (i.is_active ? 3 : 1), 0)
  const ingredientById = new Map(targetIngredients.map((i) => [i.id, i]))

  const dupes = (candidates ?? [])
    .map((p) => {
      const entry = overlap.get(p.id)
      const sharedIngredients = [...entry.shared].map((id) => ingredientById.get(id)).filter(Boolean)
      const sameCategory = Boolean(p.category && target.category && p.category === target.category)
      let compatibility = Math.round((entry.weight / Math.max(maxWeight, 1)) * 100)
      if (sameCategory) compatibility = Math.min(100, compatibility + 8)
      else compatibility = Math.round(compatibility * 0.75)
      return {
        sameCategory,
        product: p,
        compatibility: Math.min(compatibility, 98),
        sharedIngredients,
        sharedActives: sharedIngredients.filter((i) => i.is_active),
        cheaper: p.price_inr != null && target.price_inr != null ? p.price_inr < target.price_inr : null,
        savings: p.price_inr != null && target.price_inr != null ? target.price_inr - p.price_inr : null,
      }
    })
    .filter((d) => d.compatibility >= 25)
    .sort((a, b) => {
      // Same room first, then ingredient match, then cheapest known price.
      if (a.sameCategory !== b.sameCategory) return a.sameCategory ? -1 : 1
      if (Math.abs(b.compatibility - a.compatibility) > 10) return b.compatibility - a.compatibility
      const priceA = a.product.price_inr ?? Infinity
      const priceB = b.product.price_inr ?? Infinity
      return priceA - priceB
    })
    .slice(0, limit)

  return { target, targetIngredients, dupes }
}

import { supabase } from '../lib/supabase'

const PRODUCT_FIELDS =
  'id, name, category, price_inr, pao_months, pao_heat_adjusted, is_fragrance_free, hype_score, ingredient_quality_score, ingredients_status, ingredients_source_url, brand:brands(id, name, country)'

// Search by product name OR brand name.
export async function searchProducts(query, limit = 12) {
  const q = query.trim()
  if (!q) return []

  const [byName, brandRows] = await Promise.all([
    supabase.from('products').select(PRODUCT_FIELDS).ilike('name', `%${q}%`).limit(limit),
    supabase.from('brands').select('id').ilike('name', `%${q}%`).limit(8),
  ])
  if (byName.error) throw byName.error

  let results = byName.data ?? []
  const brandIds = (brandRows.data ?? []).map((b) => b.id)
  if (brandIds.length && results.length < limit) {
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_FIELDS)
      .in('brand_id', brandIds)
      .limit(limit - results.length)
    const seen = new Set(results.map((p) => p.id))
    results = results.concat((data ?? []).filter((p) => !seen.has(p.id)))
  }
  return results
}

export async function getProduct(productId) {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .eq('id', productId)
    .single()
  if (error) throw error
  return data
}

// Product + full ingredient rows (flags, explanations), ordered by INCI position.
export async function getProductIngredients(productId) {
  const { data, error } = await supabase
    .from('product_ingredients')
    .select('position_in_list, concentration, ingredient:ingredients(*)')
    .eq('product_id', productId)
    .order('position_in_list', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r) => ({ ...r.ingredient, position: r.position_in_list, concentration: r.concentration }))
}

// Bulk: map of product_id -> ingredient rows, for routine-wide checks.
export async function getIngredientsForProducts(productIds) {
  if (!productIds.length) return {}
  const { data, error } = await supabase
    .from('product_ingredients')
    .select('product_id, ingredient:ingredients(id, inci_name, common_name, is_active)')
    .in('product_id', productIds)
  if (error) throw error
  const map = {}
  for (const row of data ?? []) {
    ;(map[row.product_id] ??= []).push(row.ingredient)
  }
  return map
}

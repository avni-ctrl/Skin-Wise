import { supabase } from '../lib/supabase'

const PRODUCT_FIELDS =
  'id, name, category, price_inr, pao_months, pao_heat_adjusted, is_fragrance_free, hype_score, ingredient_quality_score, ingredients_status, ingredients_source_url, brand:brands(id, name, country)'

// Search by product name OR brand name, so "Cetaphil oily skin cleanser" finds the product
// even though the brand lives in a different table. Words are matched one by one.
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

export async function searchProducts(query, limit = 12) {
  const q = query.trim()
  if (!q) return []

  const words = [...new Set(norm(q).split(' ').filter((w) => w.length >= 2))]
  const longest = [...words].sort((a, b) => b.length - a.length).slice(0, 3)

  const [byPhrase, brandRows, ...byWord] = await Promise.all([
    supabase.from('products').select(PRODUCT_FIELDS).ilike('name', `%${q}%`).limit(limit),
    supabase.from('brands').select('id, name').or(longest.map((w) => `name.ilike.%${w}%`).join(',') || `name.ilike.%${q}%`).limit(12),
    ...longest.map((w) => supabase.from('products').select(PRODUCT_FIELDS).ilike('name', `%${w}%`).limit(40)),
  ])
  if (byPhrase.error) throw byPhrase.error

  const pool = new Map()
  for (const p of byPhrase.data ?? []) pool.set(p.id, p)
  for (const r of byWord) for (const p of r.data ?? []) pool.set(p.id, p)

  // Products of any brand whose name appears in the query.
  const brandIds = (brandRows.data ?? []).filter((b) => norm(q).includes(norm(b.name)) || norm(b.name).includes(norm(q))).map((b) => b.id)
  if (brandIds.length) {
    const { data } = await supabase.from('products').select(PRODUCT_FIELDS).in('brand_id', brandIds).limit(80)
    for (const p of data ?? []) pool.set(p.id, p)
  }

  // Rank by how many of the typed words appear in "brand + product name".
  const scored = [...pool.values()].map((p) => {
    const hay = ` ${norm(`${p.brand?.name ?? ''} ${p.name}`)} `
    const hits = words.filter((w) => hay.includes(` ${w}`)).length
    return { p, score: words.length ? hits / words.length : 0 }
  })
  const best = Math.max(0, ...scored.map((x) => x.score))
  // Keep only good matches; if even the best one is weak, show nothing so the web option appears.
  return scored
    .filter((x) => x.score >= Math.max(0.6, best - 0.2))
    .sort((a, b) => b.score - a.score || (a.p.ingredients_status === 'missing') - (b.p.ingredients_status === 'missing'))
    .slice(0, limit)
    .map((x) => x.p)
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

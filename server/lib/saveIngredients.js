// Turns a raw ingredient list into product_ingredients rows and marks the product "auto".
// Shared by /api/lookup (existing product) and /api/add-product (new product).
// Server-only. Throws on database errors; returns { ok:false } if the list is not usable.
import { splitIngredientList, buildDictionary, matchIngredients } from './ingredients.js'
import { fetchAll } from './db.js'

export async function saveIngredientList(db, productId, rawList, sourceUrl) {
  const items = splitIngredientList(rawList)
  if (items.length < 4 || items.length > 120) return { ok: false }

  const dictionary = buildDictionary(await fetchAll(db, 'ingredients', 'id, inci_name, common_name, aliases'))
  const { matched, unmatched } = matchIngredients(items, dictionary)

  // Unknown ingredients are added (flagged reviewed=false) so the list stays complete.
  const rows = [...matched]
  const fresh = unmatched.slice(0, 80)
  if (fresh.length) {
    const { error: insErr } = await db
      .from('ingredients')
      .upsert(fresh.map((u) => ({ inci_name: u.name, reviewed: false })), { onConflict: 'inci_name', ignoreDuplicates: true })
    if (insErr) throw insErr
    const { data: ids, error: idErr } = await db.from('ingredients').select('id, inci_name').in('inci_name', fresh.map((u) => u.name))
    if (idErr) throw idErr
    const idByName = new Map((ids ?? []).map((r) => [r.inci_name, r.id]))
    for (const u of fresh) if (idByName.has(u.name)) rows.push({ position: u.position, ingredient_id: idByName.get(u.name) })
  }

  const links = []
  const used = new Set()
  for (const r of rows.sort((a, b) => a.position - b.position)) {
    if (used.has(r.ingredient_id)) continue
    used.add(r.ingredient_id)
    links.push({ product_id: productId, ingredient_id: r.ingredient_id, position_in_list: r.position })
  }
  if (links.length < 4) return { ok: false }

  // Upsert first, then remove stale (estimated) links — the product is never left empty.
  const { error: upErr } = await db.from('product_ingredients').upsert(links, { onConflict: 'product_id,ingredient_id' })
  if (upErr) throw upErr
  const { error: delErr } = await db
    .from('product_ingredients')
    .delete()
    .eq('product_id', productId)
    .not('ingredient_id', 'in', `(${[...used].join(',')})`)
  if (delErr) throw delErr

  const { error: prodErr } = await db
    .from('products')
    .update({
      ingredients_raw: rawList,
      ingredients_source_url: sourceUrl,
      ingredients_status: 'auto',
      ingredients_fetched_at: new Date().toISOString(),
    })
    .eq('id', productId)
  if (prodErr) throw prodErr

  return { ok: true, ingredientCount: links.length, unknownAdded: fresh.length }
}

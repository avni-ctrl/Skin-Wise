// POST /api/lookup  { productId }
// Finds a product's real ingredient list on the web (once), saves it, and returns a status.
//   ready        → ingredients are in the database (fetched now or earlier)
//   in_progress  → another visitor triggered the same lookup a moment ago; poll again
//   not_found    → no trustworthy list found (we retry after a cooldown)
//   busy         → daily lookup budget used up
//   unavailable  → server is not configured (missing keys)
import { serviceClient, readBody, fetchAll } from '../server/lib/db.js'
import { splitIngredientList, buildDictionary, matchIngredients } from '../server/lib/ingredients.js'
import { findIngredientList } from '../server/lib/webLookup.js'

const COOLDOWN_MS = 6 * 60 * 60 * 1000
const IN_PROGRESS_MS = 90 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'POST only' })

  const productId = Number(readBody(req).productId)
  if (!Number.isInteger(productId) || productId <= 0) return res.status(400).json({ status: 'error', message: 'productId required' })

  const db = serviceClient()
  if (!db || !process.env.ANTHROPIC_API_KEY) return res.status(503).json({ status: 'unavailable' })

  let previousFetchedAt = null
  let claimed = false
  try {
    const { data: product, error } = await db
      .from('products')
      .select('id, name, category, ingredients_status, ingredients_fetched_at, brand:brands(name)')
      .eq('id', productId)
      .maybeSingle()
    if (error) throw error
    if (!product) return res.status(404).json({ status: 'error', message: 'unknown product' })

    if (['auto', 'verified'].includes(product.ingredients_status)) return res.json({ status: 'ready' })

    previousFetchedAt = product.ingredients_fetched_at

    // Daily budget guard — every attempt stamps ingredients_fetched_at, so this counts spend.
    const cap = Number(process.env.LOOKUP_DAILY_CAP ?? 150)
    const { count } = await db
      .from('products')
      .select('id', { count: 'exact', head: true })
      .gte('ingredients_fetched_at', new Date(Date.now() - DAY_MS).toISOString())
    if ((count ?? 0) >= cap) return res.json({ status: 'busy' })

    // Claim the lookup atomically so two visitors don't pay for the same search.
    const cutoff = new Date(Date.now() - COOLDOWN_MS).toISOString()
    const { data: claim, error: claimErr } = await db
      .from('products')
      .update({ ingredients_fetched_at: new Date().toISOString() })
      .eq('id', productId)
      .or(`ingredients_fetched_at.is.null,ingredients_fetched_at.lt.${cutoff}`)
      .select('id')
    if (claimErr) throw claimErr
    if (!claim?.length) {
      const age = previousFetchedAt ? Date.now() - new Date(previousFetchedAt).getTime() : Infinity
      return res.json({ status: age < IN_PROGRESS_MS ? 'in_progress' : 'not_found' })
    }
    claimed = true

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 50_000)
    let found
    try {
      found = await findIngredientList(
        { brand: product.brand?.name ?? '', name: product.name, category: product.category },
        { signal: controller.signal }
      )
    } finally {
      clearTimeout(timer)
    }
    if (!found.found) return res.json({ status: 'not_found' })

    const items = splitIngredientList(found.ingredients_raw)
    if (items.length < 4 || items.length > 120) return res.json({ status: 'not_found' })

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
    if (links.length < 4) return res.json({ status: 'not_found' })

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
        ingredients_raw: found.ingredients_raw,
        ingredients_source_url: found.source_url,
        ingredients_status: 'auto',
        ingredients_fetched_at: new Date().toISOString(),
      })
      .eq('id', productId)
    if (prodErr) throw prodErr

    return res.json({ status: 'ready', ingredientCount: links.length, unknownAdded: fresh.length })
  } catch (e) {
    console.error('lookup failed', productId, e?.message ?? e)
    // An outage on our side shouldn't lock the product out for six hours.
    if (claimed) {
      await db.from('products').update({ ingredients_fetched_at: previousFetchedAt }).eq('id', productId)
    }
    return res.status(502).json({ status: 'error' })
  }
}

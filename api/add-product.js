// POST /api/add-product  { query }
// The customer typed a product that is not in our catalog. Search the web for it, and if we
// find a trustworthy ingredient list, add the brand/product/ingredients to the database.
//   ready        → { productId } the product is in the database with ingredients (new or existing)
//   not_found    → nothing trustworthy found (same query is not retried for a few hours); reason: no-list | not-skincare
//   in_progress  → the same search is already running; poll again
//   busy         → daily budget used up
//   unavailable  → server is not configured (missing keys)
import { serviceClient, readBody } from '../server/lib/db.js'
import { saveIngredientList } from '../server/lib/saveIngredients.js'
import { findNewProduct } from '../server/lib/webLookup.js'
import { CATEGORIES, cleanQuery, queryKey, validateFoundProduct, findBrand, findSameProduct, nameMatchesQuery, searchWords } from '../server/lib/newProduct.js'

const MISS_COOLDOWN_MS = 6 * 60 * 60 * 1000
const RUNNING_MS = 90 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'POST only' })

  const query = cleanQuery(readBody(req).query)
  if (!query) return res.status(400).json({ status: 'error', message: 'type a product name' })

  const db = serviceClient()
  if (!db || !process.env.ANTHROPIC_API_KEY) return res.status(503).json({ status: 'unavailable' })

  const key = queryKey(query)
  let logId = null
  const finish = async (status, productId = null, reason = null) => {
    if (logId != null) await db.from('web_lookup_log').update({ status, product_id: productId, reason }).eq('id', logId)
  }

  try {
    const since = (ms) => new Date(Date.now() - ms).toISOString()

    // Already in the catalog with a real ingredient list? Then no paid web search is needed.
    const words = searchWords(query)
    if (words.length) {
      const { data: pool } = await db
        .from('products')
        .select('id, name, ingredients_status, brand:brands(name)')
        .or(words.map((w) => `name.ilike.%${w}%`).join(','))
        .in('ingredients_status', ['auto', 'verified'])
        .limit(150)
      const hit = (pool ?? []).find((p) => nameMatchesQuery(query, p.brand?.name ?? '', p.name))
      if (hit) return res.json({ status: 'ready', productId: hit.id, added: false })
    }

    // Same search just ran or is running → do not pay twice.
    const { data: recent, error: recentErr } = await db
      .from('web_lookup_log')
      .select('status, product_id, created_at')
      .eq('query_key', key)
      .gte('created_at', since(MISS_COOLDOWN_MS))
      .order('created_at', { ascending: false })
      .limit(5)
    if (recentErr) throw recentErr
    const running = (recent ?? []).find((r) => r.status === 'running' && Date.now() - new Date(r.created_at).getTime() < RUNNING_MS)
    if (running) return res.json({ status: 'in_progress' })
    const done = (recent ?? []).find((r) => (r.status === 'added' || r.status === 'exists') && r.product_id)
    if (done) return res.json({ status: 'ready', productId: done.product_id })
    if ((recent ?? []).some((r) => r.status === 'not_found')) return res.json({ status: 'not_found' })

    // Daily budget guard — every paid search is logged, whether or not it succeeds.
    const cap = Number(process.env.LOOKUP_DAILY_CAP ?? 150)
    const { count } = await db.from('web_lookup_log').select('id', { count: 'exact', head: true }).gte('created_at', since(DAY_MS))
    if ((count ?? 0) >= cap) return res.json({ status: 'busy' })

    const { data: logRow, error: logErr } = await db.from('web_lookup_log').insert({ query_key: key, status: 'running' }).select('id').single()
    if (logErr) throw logErr
    logId = logRow.id

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 55_000)
    let found
    try {
      found = await findNewProduct(query, CATEGORIES, { signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
    const v = validateFoundProduct(query, found)
    if (!v.ok) {
      await finish('not_found', null, v.reason)
      return res.json({ status: 'not_found', reason: /not-skincare|hair|supplement|tool/i.test(v.reason) ? 'not-skincare' : v.reason.startsWith('different-product') ? 'mismatch' : 'no-list' })
    }

    // Brand: reuse an existing row (case/punctuation-insensitive) or create one.
    const { data: brands, error: brandsErr } = await db.from('brands').select('id, name')
    if (brandsErr) throw brandsErr
    let brand = findBrand(brands ?? [], v.brand)
    if (!brand) {
      const { data: created, error: createErr } = await db.from('brands').insert({ name: v.brand }).select('id, name').single()
      if (createErr) throw createErr
      brand = created
    }

    // Product: the catalog may already have it under a slightly different search.
    const { data: theirs, error: theirsErr } = await db
      .from('products')
      .select('id, name, ingredients_status')
      .eq('brand_id', brand.id)
    if (theirsErr) throw theirsErr
    const same = findSameProduct(theirs ?? [], v.name, brand.name)
    if (same) {
      if (!['auto', 'verified'].includes(same.ingredients_status)) {
        const saved = await saveIngredientList(db, same.id, v.raw, v.sourceUrl)
        if (!saved.ok) {
          await finish('not_found')
          return res.json({ status: 'not_found' })
        }
      }
      if (v.price) await db.from('products').update({ price_inr: v.price, price_checked_at: new Date().toISOString() }).eq('id', same.id).is('price_inr', null)
      await finish('exists', same.id)
      return res.json({ status: 'ready', productId: same.id, added: false })
    }

    const { data: product, error: prodErr } = await db
      .from('products')
      .insert({
        brand_id: brand.id,
        name: v.name,
        category: v.category,
        ingredients_status: 'missing',
        ...(v.price ? { price_inr: v.price, price_checked_at: new Date().toISOString() } : {}),
      })
      .select('id')
      .single()
    if (prodErr) throw prodErr

    let saved
    try {
      saved = await saveIngredientList(db, product.id, v.raw, v.sourceUrl)
    } catch (e) {
      saved = { ok: false }
      console.error('add-product: ingredient save failed', e?.message ?? e)
    }
    if (!saved.ok) {
      // Never leave an empty product behind.
      await db.from('products').delete().eq('id', product.id)
      await finish('error')
      return res.status(502).json({ status: 'error' })
    }

    await finish('added', product.id)
    return res.json({ status: 'ready', productId: product.id, added: true, ingredientCount: saved.ingredientCount })
  } catch (e) {
    console.error('add-product failed', query, e?.message ?? e)
    await finish('error', null, String(e?.message ?? e).slice(0, 160)).catch(() => {})
    return res.status(502).json({ status: 'error' })
  }
}

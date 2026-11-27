// POST /api/lookup  { productId }
// Finds a product's real ingredient list on the web (once), saves it, and returns a status.
//   ready        → ingredients are in the database (fetched now or earlier)
//   in_progress  → another visitor triggered the same lookup a moment ago; poll again
//   not_found    → no trustworthy list found (we retry after a cooldown)
//   busy         → daily lookup budget used up
//   unavailable  → server is not configured (missing keys)
import { serviceClient, readBody } from '../server/lib/db.js'
import { saveIngredientList } from '../server/lib/saveIngredients.js'
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

    const saved = await saveIngredientList(db, productId, found.ingredients_raw, found.source_url)
    if (!saved.ok) return res.json({ status: 'not_found' })

    return res.json({ status: 'ready', ingredientCount: saved.ingredientCount, unknownAdded: saved.unknownAdded })
  } catch (e) {
    console.error('lookup failed', productId, e?.message ?? e)
    // An outage on our side shouldn't lock the product out for six hours.
    if (claimed) {
      await db.from('products').update({ ingredients_fetched_at: previousFetchedAt }).eq('id', productId)
    }
    return res.status(502).json({ status: 'error' })
  }
}

// POST /api/suggest-dupes  { productId }
// Asks the web for products similar to one we already hold (same type, same hero actives, ideally cheaper).
// Returns only NAMES. The browser then adds each one through /api/add-product, which reads and validates
// the real ingredient list — so every match score is computed from real labels, never from the model's say-so.
//   ready        → { candidates: [{ brand, name, price_inr }] }
//   not_found    → nothing usable (retried after a cooldown)
//   in_progress / busy / unavailable → as in /api/lookup
import { serviceClient, readBody } from '../server/lib/db.js'
import { findDupeCandidates } from '../server/lib/webLookup.js'
import { cleanCandidates, cleanPrice } from '../server/lib/newProduct.js'

const CACHE_MS = 7 * 24 * 60 * 60 * 1000
const MISS_MS = 6 * 60 * 60 * 1000
const RUNNING_MS = 90 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'POST only' })

  const productId = Number(readBody(req).productId)
  if (!Number.isInteger(productId) || productId <= 0) return res.status(400).json({ status: 'error', message: 'productId required' })

  const db = serviceClient()
  if (!db || !process.env.ANTHROPIC_API_KEY) return res.status(503).json({ status: 'unavailable' })

  const key = `dupes:${productId}`
  let logId = null
  const finish = async (status, reason = null, payload = null) => {
    if (logId != null) await db.from('web_lookup_log').update({ status, reason, payload }).eq('id', logId)
  }

  try {
    const since = (ms) => new Date(Date.now() - ms).toISOString()
    const { data: recent, error: recentErr } = await db
      .from('web_lookup_log')
      .select('status, payload, created_at')
      .eq('query_key', key)
      .gte('created_at', since(CACHE_MS))
      .order('created_at', { ascending: false })
      .limit(5)
    if (recentErr) throw recentErr
    const now = Date.now()
    if ((recent ?? []).some((r) => r.status === 'running' && now - new Date(r.created_at).getTime() < RUNNING_MS)) return res.json({ status: 'in_progress' })
    const cached = (recent ?? []).find((r) => r.status === 'added' && Array.isArray(r.payload?.candidates))
    if (cached) return res.json({ status: 'ready', candidates: cached.payload.candidates, cached: true })
    if ((recent ?? []).some((r) => r.status === 'not_found' && now - new Date(r.created_at).getTime() < MISS_MS)) return res.json({ status: 'not_found' })

    const { data: product, error } = await db
      .from('products')
      .select('id, name, category, price_inr, brand:brands(name)')
      .eq('id', productId)
      .maybeSingle()
    if (error) throw error
    if (!product) return res.status(404).json({ status: 'error', message: 'unknown product' })

    const cap = Number(process.env.LOOKUP_DAILY_CAP ?? 150)
    const { count } = await db.from('web_lookup_log').select('id', { count: 'exact', head: true }).gte('created_at', since(DAY_MS))
    if ((count ?? 0) >= cap) return res.json({ status: 'busy' })

    const { data: logRow, error: logErr } = await db.from('web_lookup_log').insert({ query_key: key, status: 'running' }).select('id').single()
    if (logErr) throw logErr
    logId = logRow.id

    const { data: links } = await db
      .from('product_ingredients')
      .select('position_in_list, ingredient:ingredients(inci_name, common_name, is_active)')
      .eq('product_id', productId)
      .order('position_in_list', { ascending: true })
      .limit(40)
    const actives = (links ?? []).filter((l) => l.ingredient?.is_active).slice(0, 6).map((l) => l.ingredient.common_name || l.ingredient.inci_name)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 55_000)
    let json
    try {
      json = await findDupeCandidates({ brand: product.brand?.name ?? '', name: product.name, category: product.category, actives }, { signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }

    const candidates = cleanCandidates(json?.candidates, { brand: product.brand?.name ?? '', name: product.name })
    if (!candidates.length) {
      await finish('not_found', 'no-candidates')
      return res.json({ status: 'not_found' })
    }

    // The searched product's own price, if we did not have one.
    const targetPrice = cleanPrice(json?.target_price_inr)
    if (targetPrice && product.price_inr == null) {
      await db.from('products').update({ price_inr: targetPrice, price_checked_at: new Date().toISOString() }).eq('id', productId).is('price_inr', null)
    }

    await finish('added', null, { candidates })
    return res.json({ status: 'ready', candidates })
  } catch (e) {
    console.error('suggest-dupes failed', productId, e?.message ?? e)
    await finish('error', String(e?.message ?? e).slice(0, 160)).catch(() => {})
    return res.status(502).json({ status: 'error' })
  }
}

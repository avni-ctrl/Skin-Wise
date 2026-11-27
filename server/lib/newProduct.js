// Pure rules for adding a product the customer typed that is not in our catalog yet.
// No network, no database — unit-tested in scripts/test-add-product.mjs.
import { normalizeKey, productNameSimilar, isHttpsUrl } from './ingredients.js'

const FILLER = new Set(['the', 'a', 'an', 'for', 'with', 'and', 'of', 'in', 'ml', 'g', 'gm', 'oz', 'pack'])
const tokens = (s) => normalizeKey(s).split(' ').filter((t) => t && !FILLER.has(t))

// Is the product the web gave us the one the customer typed?
// Customers often paste a long shop title ("… Ceramides 3:1:1 Golden Ratio for Barrier Repair") while the
// brand's page uses the short name, so we accept a match in EITHER direction — but never a generic name
// (one or two words) that merely appears inside the query.
export function nameMatchesQuery(query, brand, name) {
  const want = tokens(query)
  const have = tokens(`${brand} ${name}`)
  if (!want.length || !have.length) return false
  const wantSet = new Set(want)
  const haveSet = new Set(have)
  const forward = want.filter((t) => haveSet.has(t)).length / want.length
  const reverse = have.filter((t) => wantSet.has(t)).length / have.length
  return forward >= 0.8 || (reverse >= 0.85 && tokens(name).length >= 3)
}

// Same names the catalog already uses, so new products slot into existing filters.
export const CATEGORIES = ['Cleanser', 'Toner/Mist', 'Active Serum', 'Moisturizer', 'Sunscreen', 'Mask/Treatment', 'Eye Care', 'Face Oil', 'Lip Care', 'Body Care', 'Cosmetics']

// → cleaned query string, or null if it is not worth a paid web search.
export function cleanQuery(input) {
  if (typeof input !== 'string') return null
  const q = input.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
  if (q.length < 4 || q.length > 100) return null
  if (/https?:\/\/|www\./i.test(q)) return null
  if (!/[a-z]{3}/i.test(q)) return null
  return q
}

export const queryKey = (q) => normalizeKey(q)

// Keep only a result we trust enough to write into the database.
// → { ok:true, brand, name, category, sourceUrl, raw } | { ok:false, reason }
export function validateFoundProduct(query, f) {
  if (!f || f.found !== true) return { ok: false, reason: String(f?.reason ?? 'not-found').slice(0, 160) }
  const brand = String(f.brand ?? '').replace(/\s+/g, ' ').trim()
  let name = String(f.product_name ?? '').replace(/\s+/g, ' ').trim()
  if (brand.length < 2 || brand.length > 60 || name.length < 3 || name.length > 120) return { ok: false, reason: 'bad-name' }
  // Strip a leading brand from the product name so it matches how the catalog stores names.
  if (normalizeKey(name).startsWith(normalizeKey(brand) + ' ')) name = name.slice(brand.length).replace(/^[\s\-–:]+/, '').trim()
  if (name.length < 3) return { ok: false, reason: 'bad-name' }

  const category = CATEGORIES.find((c) => c.toLowerCase() === String(f.category ?? '').trim().toLowerCase())
  if (!category) return { ok: false, reason: 'not-skincare' }

  const raw = typeof f.ingredients_raw === 'string' ? f.ingredients_raw.trim() : ''
  if (raw.length < 20 || raw.length > 4000) return { ok: false, reason: 'bad-list' }
  if (!isHttpsUrl(f.source_url)) return { ok: false, reason: 'bad-source' }

  // What we add must be what the customer typed, not a different product the search drifted to.
  if (!nameMatchesQuery(query, brand, name)) return { ok: false, reason: `different-product: model found "${brand} ${name}"`.slice(0, 160) }

  return { ok: true, brand, name, category, sourceUrl: f.source_url, raw }
}

// Existing brand row for this name, ignoring case and punctuation (M.A.C = Mac = mac).
export function findBrand(brands, name) {
  const squash = (s) => normalizeKey(s).replace(/ /g, '') // M.A.C = Mac, Cos-IQ = COSIQ
  const key = squash(name)
  return brands.find((b) => squash(b.name) === key) ?? null
}

// Existing product of that brand that is the same product (both names must cover each other).
export function findSameProduct(products, name, brandName) {
  return (
    products.find(
      (p) => productNameSimilar(name, p.name, brandName) && productNameSimilar(p.name, name, brandName)
    ) ?? null
  )
}

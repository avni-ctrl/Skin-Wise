// Pure helpers for turning a raw ingredient list ("Aqua, Glycerin, Niacinamide…")
// into rows that match the `ingredients` table. No network, no database —
// so it can be unit-tested (see scripts/test-lookup.mjs).

const STOP_LABELS = /^\s*(full\s+)?(ingredients?|inci|ingredient\s+list|ingredients?\s+list)\s*[:\-–—]?\s*/i

// Split on commas that are NOT inside (), [] or {}.
export function splitIngredientList(raw) {
  if (typeof raw !== 'string') return []
  let text = raw
    .replace(/\r?\n+/g, ', ')
    .replace(/[•·●▪]/g, ',')
    .replace(/;/g, ',')
    .replace(STOP_LABELS, '')
    .trim()

  const parts = []
  let depth = 0
  let current = ''
  for (const ch of text) {
    if (ch === '(' || ch === '[' || ch === '{') depth++
    if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1)
    if (ch === ',' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  parts.push(current)

  return parts
    .map((p) => p.replace(/[*†‡]+/g, '').replace(/\s+/g, ' ').trim().replace(/[.\s]+$/g, ''))
    .map((p) => p.replace(/^and\s+/i, ''))
    .filter((p) => p.length >= 2 && p.length <= 100)
}

export function normalizeKey(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Keys to try for one list item, most specific first.
function candidateKeys(item) {
  const keys = []
  const primary = normalizeKey(item)
  if (primary) keys.push(primary)
  const parens = [...item.matchAll(/\(([^)]*)\)/g)].map((m) => normalizeKey(m[1])).filter(Boolean)
  keys.push(...parens)
  // "Water/Aqua/Eau" and "Aqua / Water" style alternates.
  for (const alt of item.split('/')) {
    const k = normalizeKey(alt)
    if (k && !keys.includes(k)) keys.push(k)
  }
  const out = []
  for (const k of keys) {
    out.push(k)
    if (k === 'water' || k === 'eau') out.push('aqua')
    if (k === 'parfum' || k === 'perfume') out.push('fragrance')
  }
  return [...new Set(out)]
}

export function buildDictionary(rows) {
  const map = new Map()
  const add = (key, id) => {
    const k = normalizeKey(key)
    if (k && !map.has(k)) map.set(k, id)
  }
  // inci_name wins over common_name/aliases if two rows collide.
  for (const r of rows) add(r.inci_name, r.id)
  for (const r of rows) add(r.common_name, r.id)
  for (const r of rows) for (const a of r.aliases ?? []) add(a, r.id)
  return map
}

// Title-case "AQUA" / "niacinamide" labels, keep things like "PEG-40" intact.
export function displayName(item) {
  let name = item.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim() || item.trim()
  const lower = normalizeKey(name)
  if (lower === 'water' || lower === 'eau' || lower === 'aqua' || /^(aqua|water)\s*\//i.test(name)) return 'Aqua'
  if (name === name.toUpperCase() || name === name.toLowerCase()) {
    name = name
      .toLowerCase()
      .replace(/(^|[\s\-\/])([a-z])/g, (_, sep, c) => sep + c.toUpperCase())
  }
  return name
}

// → { matched: [{ position, ingredient_id }], unmatched: [{ position, name }] }
// Positions are 1-based and follow label order (label order ≈ concentration order).
export function matchIngredients(items, dictionary) {
  const matched = []
  const unmatched = []
  const seenIds = new Set()
  const seenNames = new Set()
  items.forEach((item, idx) => {
    const position = idx + 1
    let id = null
    for (const key of candidateKeys(item)) {
      if (dictionary.has(key)) {
        id = dictionary.get(key)
        break
      }
    }
    if (id != null) {
      if (seenIds.has(id)) return
      seenIds.add(id)
      matched.push({ position, ingredient_id: id })
    } else {
      const name = displayName(item)
      const key = normalizeKey(name)
      if (!key || seenNames.has(key)) return
      seenNames.add(key)
      unmatched.push({ position, name })
    }
  })
  return { matched, unmatched }
}

// Does the page's product title plausibly match the product we asked for?
// Guards against grabbing the ingredients of a different variant.
const FILLER = new Set(['the', 'a', 'an', 'for', 'with', 'and', 'of', 'in', 'skin', 'face', 'pack', 'ml', 'g', 'gm', 'oz'])
export function productNameSimilar(requested, found, brand = '') {
  const tokens = (s) =>
    normalizeKey(s)
      .split(' ')
      .filter((t) => t && !FILLER.has(t))
  const brandTokens = new Set(tokens(brand))
  const want = tokens(requested).filter((t) => !brandTokens.has(t))
  if (!want.length) return true
  const have = new Set(tokens(found))
  const hits = want.filter((t) => have.has(t)).length
  return hits / want.length >= 0.6
}

export function isHttpsUrl(u) {
  try {
    return new URL(u).protocol === 'https:'
  } catch {
    return false
  }
}

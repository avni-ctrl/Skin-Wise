// Client wrappers for the two serverless endpoints in /api.
// They return plain status objects and never throw, so the UI can always show something honest.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function post(path, payload) {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => null)
    return data ?? { status: 'unavailable' }
  } catch {
    return { status: 'unavailable' }
  }
}

// Make sure the product has a real ingredient list in the database.
// First visitor to search a product waits a few seconds; everyone after gets it instantly.
export async function ensureIngredients(productId) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const data = await post('/api/lookup', { productId })
    if (data.status !== 'in_progress') return data
    await sleep(6000) // someone else triggered this lookup a moment ago — wait for it
  }
  return { status: 'not_found' }
}

// Personalised, product-specific explanation (cached server-side per skin profile).
export async function getExplanation(productId, profile) {
  return post('/api/explain', {
    productId,
    profile: profile
      ? {
          skin_type: profile.skin_type ?? null,
          skin_concerns: profile.skin_concerns ?? [],
          known_allergens: profile.known_allergens ?? [],
        }
      : null,
  })
}

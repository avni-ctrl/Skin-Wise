// User-owned data: profile, routine, shelf, photo check-ins.
// All tables are RLS-protected (owner-only, keyed to auth.uid()).
import { supabase } from '../lib/supabase'

const PENDING_KEY = 'skinwise_pending_profile'

// ---------- profile ----------

export async function getProfile(userId) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function saveProfile(userId, profile) {
  const { error } = await supabase.from('users').upsert({ id: userId, ...profile }, { onConflict: 'id' })
  if (error) throw error
}

// Quiz completion = the site's primary signup.
// If email confirmation is enabled there is no session yet; stash the profile
// locally and flush it on first SIGNED_IN.
export async function signUpWithProfile({ email, password, profile, treatments = [], routineProductIds = [] }) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  const payload = { profile, treatments, routineProductIds }
  if (data.session) {
    await writeProfilePayload(data.session.user.id, payload)
    return { session: data.session, needsConfirmation: false }
  }
  localStorage.setItem(PENDING_KEY, JSON.stringify(payload))
  return { session: null, needsConfirmation: true }
}

export async function writeProfilePayload(userId, { profile, treatments, routineProductIds }) {
  await saveProfile(userId, { ...profile, email: profile.email ?? undefined })

  if (treatments?.length) {
    await supabase.from('user_treatments').insert(
      treatments.map((t) => ({ user_id: userId, treatment_name: t, prescribed_by: 'dermatologist' }))
    )
  }
  // Stage-5 go-to products seed both the routine and the shelf.
  if (routineProductIds?.length) {
    await supabase.from('user_routine').insert(
      routineProductIds.map((pid, i) => ({ user_id: userId, product_id: pid, time_of_day: 'AM', step_order: i + 1 }))
    )
    await supabase.from('user_shelf').insert(
      routineProductIds.map((pid) => ({ user_id: userId, product_id: pid, opened_on: new Date().toISOString().slice(0, 10) }))
    )
  }
}

export async function flushPendingProfile(userId) {
  const raw = localStorage.getItem(PENDING_KEY)
  if (!raw) return false
  try {
    await writeProfilePayload(userId, JSON.parse(raw))
    localStorage.removeItem(PENDING_KEY)
    return true
  } catch (e) {
    console.error('Failed to flush pending profile', e)
    return false
  }
}

// ---------- routine (Skin Garden) ----------

const ROUTINE_FIELDS = 'id, product_id, time_of_day, step_order, added_on, product:products(id, name, category, price_inr, brand:brands(name))'

export async function getRoutine(userId) {
  const { data, error } = await supabase
    .from('user_routine')
    .select(ROUTINE_FIELDS)
    .eq('user_id', userId)
    .order('step_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addRoutineItem(userId, productId, timeOfDay, stepOrder) {
  const { data, error } = await supabase
    .from('user_routine')
    .insert({ user_id: userId, product_id: productId, time_of_day: timeOfDay, step_order: stepOrder })
    .select(ROUTINE_FIELDS)
    .single()
  if (error) throw error
  return data
}

export async function removeRoutineItem(id) {
  const { error } = await supabase.from('user_routine').delete().eq('id', id)
  if (error) throw error
}

export async function reorderRoutine(items) {
  await Promise.all(
    items.map((item, i) =>
      supabase.from('user_routine').update({ step_order: i + 1 }).eq('id', item.id)
    )
  )
}

// ---------- shelf (Product Museum) ----------

const SHELF_FIELDS = 'id, product_id, opened_on, mfd, expiry_date, calculated_expires, status, product:products(id, name, category, price_inr, pao_months, pao_heat_adjusted, brand:brands(name))'

export function computeShelfStatus(item) {
  const pao = item.product?.pao_months ?? 12
  const opened = item.opened_on ? new Date(item.opened_on) : null
  let expires = item.expiry_date ? new Date(item.expiry_date) : null
  if (opened) {
    const paoEnd = new Date(opened)
    paoEnd.setMonth(paoEnd.getMonth() + pao)
    expires = expires && expires < paoEnd ? expires : paoEnd
  }
  if (!expires) return { status: 'good', expires: null, lifeLeft: 1 }

  const now = new Date()
  const totalMs = opened ? expires - opened : 1
  const leftMs = expires - now
  const lifeLeft = Math.max(0, Math.min(1, totalMs > 0 ? leftMs / totalMs : 0))
  let status = 'good'
  if (leftMs <= 0) status = 'expired'
  else if (leftMs < 1000 * 60 * 60 * 24 * 30) status = 'expiring_soon'
  return { status, expires, lifeLeft }
}

export async function getShelf(userId) {
  const { data, error } = await supabase
    .from('user_shelf')
    .select(SHELF_FIELDS)
    .eq('user_id', userId)
    .order('id', { ascending: true })
  if (error) throw error
  return (data ?? []).map((item) => ({ ...item, ...computeShelfStatus(item) }))
}

export async function addShelfItem(userId, productId, openedOn = null) {
  const { data, error } = await supabase
    .from('user_shelf')
    .insert({ user_id: userId, product_id: productId, opened_on: openedOn })
    .select(SHELF_FIELDS)
    .single()
  if (error) throw error
  return { ...data, ...computeShelfStatus(data) }
}

export async function removeShelfItem(id) {
  const { error } = await supabase.from('user_shelf').delete().eq('id', id)
  if (error) throw error
}

// ---------- photo check-ins (private bucket) ----------

export async function uploadCheckin(userId, file, notes = '') {
  const stamp = Date.now()
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
  const path = `${userId}/${stamp}.${ext}`
  const { error: upErr } = await supabase.storage.from('progress-photos').upload(path, file, { upsert: false })
  if (upErr) throw upErr
  const { data, error } = await supabase
    .from('progress_photos')
    .insert({ user_id: userId, photo_url: path, notes })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function listCheckins(userId) {
  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', userId)
    .order('taken_on', { ascending: false })
    .order('id', { ascending: false })
  if (error) throw error
  const rows = data ?? []
  // Private bucket: mint short-lived signed URLs for display.
  const withUrls = await Promise.all(
    rows.map(async (row) => {
      const { data: signed } = await supabase.storage.from('progress-photos').createSignedUrl(row.photo_url, 3600)
      return { ...row, signedUrl: signed?.signedUrl ?? null }
    })
  )
  return withUrls
}

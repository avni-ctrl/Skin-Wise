// The core of the daily shelf-reminder job, separated from the HTTP handler so it can be tested.
import { fetchAll } from './db.js'
import { buildEmail, sendEmail } from './reminderEmail.js'
import { computeShelfStatus, dueReminder, toISODate } from '../../src/services/shelfLife.js'

export async function runReminders({ db, apiKey, from, siteUrl, maxEmails = 90, now = new Date(), send = sendEmail }) {
  const items = await fetchAll(db, 'user_shelf', 'id, user_id, opened_on, expiry_date, product:products(name, pao_months, pao_heat_adjusted)')
  const candidates = items.filter((i) => i.product && (i.opened_on || i.expiry_date))
  if (!candidates.length) return { due: 0, claimed: 0, emails: 0, failed: 0 }

  const userIds = [...new Set(candidates.map((i) => i.user_id))]
  const users = new Map()
  for (let i = 0; i < userIds.length; i += 200) {
    const { data, error } = await db.from('users').select('id, email, name, city').in('id', userIds.slice(i, i + 200))
    if (error) throw error
    for (const u of data ?? []) users.set(u.id, u)
  }

  const due = []
  for (const item of candidates) {
    const user = users.get(item.user_id)
    if (!user?.email) continue
    const s = computeShelfStatus(item, user.city, now)
    const days = dueReminder(s.daysLeft)
    if (!days || !s.expires) continue
    due.push({ shelfId: item.id, userId: item.user_id, days, expiresOn: toISODate(s.expires), productName: item.product.name, daysLeft: s.daysLeft, reason: s.reason, expires: s.expires })
  }
  if (!due.length) return { due: 0, claimed: 0, emails: 0, failed: 0 }

  // Claim reminders we haven't sent yet. Only newly inserted rows come back.
  const { data: claimedRows, error: claimErr } = await db
    .from('shelf_reminders')
    .upsert(
      due.map((d) => ({ shelf_id: d.shelfId, days_before: d.days, expires_on: d.expiresOn })),
      { onConflict: 'shelf_id,days_before,expires_on', ignoreDuplicates: true }
    )
    .select('shelf_id, days_before, expires_on')
  if (claimErr) throw claimErr
  const claimed = new Set((claimedRows ?? []).map((r) => `${r.shelf_id}|${r.days_before}|${r.expires_on}`))
  const fresh = due.filter((d) => claimed.has(`${d.shelfId}|${d.days}|${d.expiresOn}`))

  const byUser = new Map()
  for (const d of fresh) {
    if (!byUser.has(d.userId)) byUser.set(d.userId, [])
    byUser.get(d.userId).push(d)
  }

  const release = async (rows) => {
    for (const r of rows) await db.from('shelf_reminders').delete().eq('shelf_id', r.shelfId).eq('days_before', r.days).eq('expires_on', r.expiresOn)
  }

  let sent = 0
  let failed = 0
  for (const [userId, rows] of byUser) {
    if (sent >= maxEmails) {
      await release(rows) // over today's budget — try again tomorrow
      continue
    }
    rows.sort((a, b) => a.daysLeft - b.daysLeft)
    try {
      const mail = buildEmail({ name: users.get(userId).name, items: rows, siteUrl })
      await send({ apiKey, from, to: users.get(userId).email, ...mail })
      sent++
    } catch (e) {
      failed++
      console.error('reminder email failed', userId, e?.message ?? e)
      await release(rows) // let tomorrow's run retry
    }
  }
  return { due: due.length, claimed: fresh.length, emails: sent, failed }
}

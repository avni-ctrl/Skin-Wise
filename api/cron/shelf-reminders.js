// GET /api/cron/shelf-reminders — runs once a day (see vercel.json "crons").
// Emails users whose products reach 30 / 14 / 7 days before expiry.
//
// Needs these Vercel environment variables (see PR description):
//   CRON_SECRET (any long random string — Vercel sends it, we check it)
//   RESEND_API_KEY, REMINDER_FROM (an address on a domain verified in Resend),
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Optional: SITE_URL, REMINDER_MAX_EMAILS.
// Safe by design: refuses to run without the secret and never emails the same reminder twice.
import { timingSafeEqual } from 'node:crypto'
import { serviceClient } from '../../server/lib/db.js'
import { runReminders } from '../../server/lib/reminderJob.js'

const authorised = (req) => {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const a = Buffer.from(String(req.headers?.authorization ?? ''))
  const b = Buffer.from(`Bearer ${secret}`)
  return a.length === b.length && timingSafeEqual(a, b)
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!process.env.CRON_SECRET) return res.status(503).json({ status: 'unconfigured', missing: 'CRON_SECRET' })
  if (!authorised(req)) return res.status(401).json({ status: 'unauthorised' })

  const db = serviceClient()
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.REMINDER_FROM
  if (!db || !apiKey || !from) return res.status(503).json({ status: 'unconfigured' })

  try {
    const result = await runReminders({
      db,
      apiKey,
      from,
      siteUrl: process.env.SITE_URL || 'https://skinwisee.com',
      maxEmails: Number(process.env.REMINDER_MAX_EMAILS ?? 90),
    })
    return res.json({ status: 'ok', ...result })
  } catch (e) {
    console.error('shelf-reminders failed', e?.message ?? e)
    return res.status(500).json({ status: 'error' })
  }
}

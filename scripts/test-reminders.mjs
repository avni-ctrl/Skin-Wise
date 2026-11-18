import test from 'node:test'
import assert from 'node:assert/strict'
import { runReminders } from '../server/lib/reminderJob.js'
import { buildEmail } from '../server/lib/reminderEmail.js'
import handler from '../api/cron/shelf-reminders.js'

// Minimal in-memory stand-in for the Supabase client (only what the job uses).
function fakeDb({ shelf, users }) {
  const reminders = []
  const key = (r) => `${r.shelf_id}|${r.days_before}|${r.expires_on}`
  const rowsFor = (table) => (table === 'user_shelf' ? shelf : table === 'users' ? users : [])
  const db = {
    reminders,
    from(table) {
      const q = { table, filters: [] }
      const api = {
        select() { return api },
        range(a, b) { q.range = [a, b]; return Promise.resolve({ data: rowsFor(table).slice(a, b + 1), error: null }) },
        in(col, vals) { return Promise.resolve({ data: rowsFor(table).filter((r) => vals.includes(r[col])), error: null }) },
        upsert(rows) {
          const inserted = []
          for (const r of rows) if (!reminders.some((x) => key(x) === key(r))) { reminders.push(r); inserted.push(r) }
          return { select: () => Promise.resolve({ data: inserted, error: null }) }
        },
        delete() {
          const f = {}
          const chain = {
            eq(c, v) {
              f[c] = v
              if (Object.keys(f).length === 3) {
                const i = reminders.findIndex((x) => x.shelf_id === f.shelf_id && x.days_before === f.days_before && x.expires_on === f.expires_on)
                if (i >= 0) reminders.splice(i, 1)
                return Promise.resolve({ error: null })
              }
              return chain
            },
          }
          return chain
        },
      }
      return api
    },
  }
  return db
}

const NOW = new Date('2026-11-18T04:00:00Z')
const product = (name) => ({ name, pao_months: 12, pao_heat_adjusted: 6 })
const users = [
  { id: 'u1', email: 'a@example.com', name: 'Avni Test', city: 'Shimla' },
  { id: 'u2', email: 'b@example.com', name: 'Riya', city: 'Delhi' },
  { id: 'u3', email: null, name: 'No Email', city: 'Delhi' },
]
// Shimla (cool): 12-month PAO. Opened 2025-11-28 → expires 2026-11-28 → 10 days left → 14-day reminder.
const shelf = [
  { id: 1, user_id: 'u1', opened_on: '2025-11-28', expiry_date: null, product: product('Barrier Cream') },
  { id: 2, user_id: 'u1', opened_on: '2026-11-10', expiry_date: null, product: product('Fresh Serum') }, // far away
  { id: 3, user_id: 'u2', opened_on: '2026-05-25', expiry_date: null, product: product('Delhi Moisturiser') }, // hot: 6mo → 2026-11-25 → 7 days left → 7
  { id: 4, user_id: 'u2', opened_on: '2026-08-10', expiry_date: null, product: product('Vitamin C 10% Serum') }, // 3mo cap → 2026-11-10 → already oxidised → no reminder
  { id: 5, user_id: 'u3', opened_on: '2025-11-28', expiry_date: null, product: product('Orphan') }, // user has no email
]

test('sends one email per person, only for products that are due', async () => {
  const sent = []
  const r = await runReminders({ db: fakeDb({ shelf, users }), apiKey: 'k', from: 'SkinWise <r@x.com>', siteUrl: 'https://skinwisee.com', now: NOW, send: async (m) => { sent.push(m) } })
  assert.equal(r.emails, 2)
  assert.equal(sent.length, 2)
  assert.deepEqual(sent.map((m) => m.to).sort(), ['a@example.com', 'b@example.com'])
  assert.match(sent.find((m) => m.to === 'a@example.com').subject, /Barrier Cream.*10 days left/)
  assert.ok(!sent.some((m) => /Fresh Serum|Orphan|Vitamin C/.test(m.subject + m.text)))
})

test('running twice the same day does not email again', async () => {
  const db = fakeDb({ shelf, users })
  const send = async () => {}
  const first = await runReminders({ db, apiKey: 'k', from: 'f', siteUrl: 'https://s', now: NOW, send })
  const second = await runReminders({ db, apiKey: 'k', from: 'f', siteUrl: 'https://s', now: NOW, send })
  assert.equal(first.emails, 2)
  assert.equal(second.emails, 0)
})

test('a failed send releases the claim so tomorrow retries it', async () => {
  const db = fakeDb({ shelf, users })
  const failing = await runReminders({ db, apiKey: 'k', from: 'f', siteUrl: 'https://s', now: NOW, send: async () => { throw new Error('boom') } })
  assert.equal(failing.failed, 2)
  assert.equal(db.reminders.length, 0)
  const retry = await runReminders({ db, apiKey: 'k', from: 'f', siteUrl: 'https://s', now: NOW, send: async () => {} })
  assert.equal(retry.emails, 2)
})

test('daily email budget is respected and the rest is retried later', async () => {
  const db = fakeDb({ shelf, users })
  const r = await runReminders({ db, apiKey: 'k', from: 'f', siteUrl: 'https://s', maxEmails: 1, now: NOW, send: async () => {} })
  assert.equal(r.emails, 1)
  assert.equal(db.reminders.length, 1)
})

test('the next threshold fires later for the same product (14 then 7)', async () => {
  const db = fakeDb({ shelf, users })
  const send = async () => {}
  await runReminders({ db, apiKey: 'k', from: 'f', siteUrl: 'https://s', now: NOW, send })
  const later = new Date('2026-11-22T04:00:00Z') // Barrier Cream now 6 days left → 7-day reminder
  const r = await runReminders({ db, apiKey: 'k', from: 'f', siteUrl: 'https://s', now: later, send })
  assert.ok(r.emails >= 1)
})

test('email escapes HTML in product names', () => {
  const m = buildEmail({ name: 'Avni', siteUrl: 'https://skinwisee.com/', items: [{ productName: '<script>alert(1)</script> Serum', daysLeft: 7, reason: 'pao', expires: new Date('2026-12-01T00:00:00Z') }] })
  assert.ok(!m.html.includes('<script>'))
  assert.match(m.html, /&lt;script&gt;/)
})

const mkRes = () => { const r = { code: 200, body: null, setHeader() { return r }, status(c) { r.code = c; return r }, json(b) { r.body = b; return r } }; return r }
test('endpoint refuses to run without a cron secret, and rejects a wrong one', async () => {
  delete process.env.CRON_SECRET
  let res = mkRes(); await handler({ headers: {} }, res)
  assert.equal(res.code, 503)
  process.env.CRON_SECRET = 'right-secret'
  res = mkRes(); await handler({ headers: { authorization: 'Bearer wrong' } }, res)
  assert.equal(res.code, 401)
  res = mkRes(); await handler({ headers: { authorization: 'Bearer right-secret' } }, res) // secret ok, but no keys configured
  assert.equal(res.code, 503)
  delete process.env.CRON_SECRET
})

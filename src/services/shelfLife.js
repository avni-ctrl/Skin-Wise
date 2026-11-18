// Shelf-life maths for the Skin Shelf (Product Museum). Pure: no imports, no network.
// Used by the website AND the daily reminder job, so both always agree.
//
// Rules, strongest first:
//  1. Printed expiry date (if the user entered one) always caps the life.
//  2. Opened product: opened date + PAO months. In a hot city we use the shorter
//     heat-adjusted PAO from the products table.
//  3. Plain Vitamin C / ascorbic acid serums oxidise quickly once opened, so they are
//     capped at 3 months and flagged "oxidized" rather than just "expired".
//  4. A product that is not opened yet has no open-clock; only a printed expiry applies.

export const REMINDER_DAYS = [30, 14, 7]
export const VITAMIN_C_MAX_MONTHS = 3

const DAY_MS = 24 * 60 * 60 * 1000

export const HOT_CITIES = ['mumbai', 'delhi', 'chennai', 'kolkata', 'hyderabad', 'ahmedabad', 'jaipur', 'surat', 'nagpur', 'lucknow', 'kanpur', 'indore', 'bhopal', 'patna', 'vadodara', 'gurgaon', 'gurugram', 'noida', 'faridabad', 'ghaziabad']

// Plain vitamin C only — stable derivatives (glucoside, phosphate…) are not capped.
const PLAIN_VITAMIN_C = /\bvitamin\s*c\b|l[-\s]?ascorbic|\bascorbic\s+acid\b/i

export const isHotCity = (city) => {
  const c = String(city ?? '').toLowerCase()
  return Boolean(c) && HOT_CITIES.some((h) => c.includes(h))
}

export const isPlainVitaminC = (name) => PLAIN_VITAMIN_C.test(String(name ?? ''))

const toDate = (v) => {
  if (!v) return null
  const d = v instanceof Date ? new Date(v) : new Date(`${String(v).slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function addMonths(date, months) {
  const d = new Date(date)
  const day = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, lastDay))
  return d
}

export const toISODate = (d) => d.toISOString().slice(0, 10)

// Today's date on the USER's clock (an IST evening can still be "yesterday" in UTC).
export const todayISO = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

// item: { opened_on, expiry_date, product: { name, pao_months, pao_heat_adjusted } }
// → { status, expires, lifeLeft, daysLeft, reason, months }
//   status: unopened | good | expiring_soon | expired | oxidized
export function computeShelfStatus(item, city = null, now = new Date()) {
  const product = item?.product ?? {}
  const opened = toDate(item?.opened_on)
  const printed = toDate(item?.expiry_date)
  const hot = isHotCity(city)

  const basePao = product.pao_months ?? 12
  const paoMonths = hot && product.pao_heat_adjusted ? Math.min(product.pao_heat_adjusted, basePao) : basePao
  const vitC = isPlainVitaminC(product.name)
  const months = vitC ? Math.min(paoMonths, VITAMIN_C_MAX_MONTHS) : paoMonths

  let expires = null
  let reason = null
  if (opened) {
    expires = addMonths(opened, months)
    reason = vitC && months < paoMonths ? 'oxidation' : 'pao'
  }
  if (printed && (!expires || printed < expires)) {
    expires = printed
    reason = 'printed'
  }

  if (!expires) return { status: 'unopened', expires: null, lifeLeft: 1, daysLeft: null, reason: null, months }

  const nowMs = now.getTime()
  const daysLeft = Math.ceil((expires.getTime() - nowMs) / DAY_MS)
  const total = opened ? expires.getTime() - opened.getTime() : null
  const lifeLeft = total && total > 0 ? Math.max(0, Math.min(1, (expires.getTime() - nowMs) / total)) : daysLeft > 0 ? 1 : 0

  let status = 'good'
  if (daysLeft <= 0) status = reason === 'oxidation' ? 'oxidized' : 'expired'
  else if (daysLeft <= 30) status = 'expiring_soon'
  else if (!opened) status = 'unopened'
  return { status, expires, lifeLeft, daysLeft, reason, months }
}

// The next reminder that is due today: the smallest threshold we have already crossed.
// e.g. 12 days left → 14. 5 days left → 7. 40 days left → null. Already expired → null.
export function dueReminder(daysLeft) {
  if (daysLeft == null || daysLeft <= 0) return null
  const crossed = REMINDER_DAYS.filter((d) => daysLeft <= d)
  return crossed.length ? Math.min(...crossed) : null
}

// Wording used by the website and the email, so both say the same thing.
export function reminderCopy({ productName, daysLeft, reason, expires }) {
  const when = expires.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  const why =
    reason === 'oxidation'
      ? 'Vitamin C loses its power quickly once opened.'
      : reason === 'printed'
        ? 'This is the expiry date you entered.'
        : 'This is its safe window after opening.'
  return {
    subject: `${productName} is nearly done — ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`,
    line: `${productName} should be used up or retired by ${when} (${daysLeft} day${daysLeft === 1 ? '' : 's'} left). ${why}`,
  }
}

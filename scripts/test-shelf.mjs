import test from 'node:test'
import assert from 'node:assert/strict'
import { computeShelfStatus, dueReminder, addMonths, isHotCity, isPlainVitaminC, toISODate, reminderCopy } from '../src/services/shelfLife.js'

const NOW = new Date('2026-11-18T06:00:00Z')
const serum = { name: 'Niacinamide 10% Serum', pao_months: 12, pao_heat_adjusted: 6 }
const vitc = { name: 'Vitamin C 10% Face Serum', pao_months: 12, pao_heat_adjusted: 6 }

test('addMonths clamps month ends (31 Aug + 6 months = 28 Feb)', () => {
  assert.equal(toISODate(addMonths(new Date('2026-08-31T00:00:00Z'), 6)), '2027-02-28')
})

test('hot city uses the shorter heat-adjusted shelf life, cool city does not', () => {
  const item = { opened_on: '2026-07-19', product: serum }
  const hot = computeShelfStatus(item, 'Gurgaon', NOW)
  const cool = computeShelfStatus(item, 'Shimla', NOW)
  assert.equal(toISODate(hot.expires), '2027-01-19')
  assert.equal(toISODate(cool.expires), '2027-07-19')
  assert.equal(hot.months, 6)
  assert.equal(cool.months, 12)
})

test('plain vitamin C is capped at 3 months and reported as oxidized, not just expired', () => {
  const r = computeShelfStatus({ opened_on: '2026-07-19', product: vitc }, 'Delhi', NOW)
  assert.equal(toISODate(r.expires), '2026-10-19')
  assert.equal(r.status, 'oxidized')
  assert.equal(r.reason, 'oxidation')
  assert.ok(r.daysLeft < 0)
})

test('stable vitamin C derivatives are not capped', () => {
  assert.equal(isPlainVitaminC('Vitamin C 10% Face Serum'), true)
  assert.equal(isPlainVitaminC('L-Ascorbic Acid 15% Serum'), true)
  assert.equal(isPlainVitaminC('Ascorbyl Glucoside Serum'), false)
  assert.equal(isPlainVitaminC('Sodium Ascorbyl Phosphate Cream'), false)
})

test('printed expiry wins when it is earlier than the opened-clock', () => {
  const r = computeShelfStatus({ opened_on: '2026-11-01', expiry_date: '2026-12-01', product: serum }, 'Shimla', NOW)
  assert.equal(r.reason, 'printed')
  assert.equal(toISODate(r.expires), '2026-12-01')
  assert.equal(r.status, 'expiring_soon')
})

test('unopened product has no clock until opened', () => {
  const r = computeShelfStatus({ opened_on: null, product: serum }, 'Delhi', NOW)
  assert.equal(r.status, 'unopened')
  assert.equal(r.expires, null)
})

test('unopened product with a printed expiry still warns when that date is near', () => {
  const r = computeShelfStatus({ opened_on: null, expiry_date: '2026-12-05', product: serum }, 'Delhi', NOW)
  assert.equal(r.status, 'expiring_soon')
})

test('status turns expiring_soon inside 30 days, good outside', () => {
  const near = computeShelfStatus({ opened_on: '2026-05-25', product: serum }, 'Delhi', NOW) // ends 2026-11-25
  const far = computeShelfStatus({ opened_on: '2026-11-01', product: serum }, 'Delhi', NOW)
  assert.equal(near.status, 'expiring_soon')
  assert.equal(far.status, 'good')
})

test('dueReminder picks the tightest threshold crossed and never fires after expiry', () => {
  assert.equal(dueReminder(45), null)
  assert.equal(dueReminder(30), 30)
  assert.equal(dueReminder(20), 30)
  assert.equal(dueReminder(14), 14)
  assert.equal(dueReminder(9), 14)
  assert.equal(dueReminder(7), 7)
  assert.equal(dueReminder(1), 7)
  assert.equal(dueReminder(0), null)
  assert.equal(dueReminder(-3), null)
  assert.equal(dueReminder(null), null)
})

test('isHotCity handles blanks and mixed case', () => {
  assert.equal(isHotCity(''), false)
  assert.equal(isHotCity(null), false)
  assert.equal(isHotCity('NEW DELHI'), true)
})

test('reminder copy names the product, the date and the reason', () => {
  const c = reminderCopy({ productName: 'Vitamin C Serum', daysLeft: 7, reason: 'oxidation', expires: new Date('2026-12-01T00:00:00Z') })
  assert.match(c.subject, /7 days left/)
  assert.match(c.line, /1 Dec 2026/)
  assert.match(c.line, /Vitamin C/)
})

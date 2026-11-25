// Endpoints must fail SAFELY (503, no crash, no secrets) when the server isn't configured.
import test from 'node:test'
import assert from 'node:assert/strict'
import lookup from '../api/lookup.js'
import explain from '../api/explain.js'

const mkRes = () => {
  const r = { code: 200, headers: {}, body: null }
  r.setHeader = (k, v) => { r.headers[k] = v; return r }
  r.status = (c) => { r.code = c; return r }
  r.json = (b) => { r.body = b; return r }
  return r
}

for (const [name, fn] of [['lookup', lookup], ['explain', explain]]) {
  test(`${name}: rejects GET`, async () => {
    const res = mkRes(); await fn({ method: 'GET' }, res)
    assert.equal(res.code, 405)
  })
  test(`${name}: rejects a bad productId`, async () => {
    const res = mkRes(); await fn({ method: 'POST', body: { productId: 'x; drop table' } }, res)
    assert.equal(res.code, 400)
  })
  test(`${name}: returns 503 "unavailable" when keys are missing`, async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY; delete process.env.ANTHROPIC_API_KEY
    const res = mkRes(); await fn({ method: 'POST', body: { productId: 1 } }, res)
    assert.equal(res.code, 503)
    assert.equal(res.body.status, 'unavailable')
  })
}

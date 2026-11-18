// Builds and sends the shelf reminder email through Resend. Server-only.
import { reminderCopy } from '../../src/services/shelfLife.js'

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// items: [{ productName, daysLeft, reason, expires }]  (already sorted, soonest first)
export function buildEmail({ name, items, siteUrl }) {
  const first = String(name ?? '').trim().split(/\s+/)[0]
  const hello = first ? `Hi ${first},` : 'Hi,'
  const lines = items.map((i) => reminderCopy(i))
  const subject = items.length === 1 ? lines[0].subject : `${items.length} products on your shelf are nearly done`
  const link = `${siteUrl.replace(/\/$/, '')}/product-museum`

  const text = [hello, '', ...lines.map((l) => `• ${l.line}`), '', `Open your shelf: ${link}`, '', 'You get these because you added products to your SkinWise shelf.'].join('\n')
  const html = `<div style="font-family:Georgia,serif;color:#1C3F30;max-width:520px;margin:auto;line-height:1.55">
<p>${esc(hello)}</p>
<ul style="padding-left:18px">${lines.map((l) => `<li style="margin:8px 0">${esc(l.line)}</li>`).join('')}</ul>
<p><a href="${esc(link)}" style="color:#A99148">Open your shelf</a></p>
<p style="font-size:12px;color:#8C8A82">You get these because you added products to your SkinWise shelf.</p>
</div>`
  return { subject, text, html }
}

export async function sendEmail({ apiKey, from, to, subject, text, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`)
  }
}

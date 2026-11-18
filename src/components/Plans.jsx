import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { ease } from '../lib/easing'

// Display only — there is NO payment or paywall here. Pro is "coming soon" and the
// button just collects emails (waitlist table, interest = 'pro').
const PRO_PRICE = '₹199'
const PRO_PERIOD = 'per month'

const FREE_FEATURES = [
  'Formula Analysis — a score from the real ingredient list, for your skin',
  'Skin Ritual — AM / PM routines with clash checks',
  'Skin Shelf — shelf life for your city, with expiry reminders',
  'Dupe Finder — same actives, lower price',
  'The two-minute skin profile quiz',
]

const PRO_FEATURES = [
  'Photo progress — see your skin change week by week',
  'Products picked for you, from your skin analysis and past purchases',
  '1:1 conversations about your skin',
  'Your best-fit skincare, chosen with you',
  'Packaging styled to your personality',
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Tick({ gold }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={gold ? 'var(--gold2)' : 'var(--accent)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] shrink-0" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

function NotifyForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | saving | done | error

  async function submit(e) {
    e.preventDefault()
    const value = email.trim().toLowerCase()
    if (!EMAIL_RE.test(value)) return setState('invalid')
    setState('saving')
    const { error } = await supabase.from('waitlist').insert({ email: value, interest: 'pro' })
    // 23505 = this email is already on the list — that is fine for the visitor.
    setState(!error || error.code === '23505' ? 'done' : 'error')
  }

  if (state === 'done') {
    return <p className="mt-6 text-[0.85rem] italic text-gold2" style={{ fontFamily: 'var(--font-display)' }}>You’re on the list — we’ll tell you when Pro opens.</p>
  }
  return (
    <form onSubmit={submit} className="mt-6" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (state !== 'saving') setState('idle') }}
          placeholder="your@email.com"
          aria-label="Email address"
          className="min-w-0 flex-1 rounded-full border border-line bg-transparent px-5 py-3 text-[0.85rem] text-ink outline-none focus:border-gold2"
        />
        <button
          type="submit"
          disabled={state === 'saving'}
          className="rounded-full bg-ink px-6 py-3 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-bg transition hover:opacity-90 disabled:opacity-60"
          style={{ fontFamily: 'var(--font-head)' }}
        >
          {state === 'saving' ? 'Saving…' : 'Notify me'}
        </button>
      </div>
      {state === 'invalid' && <p className="mt-2 text-[0.75rem] text-terra">Please enter a valid email address.</p>}
      {state === 'error' && <p className="mt-2 text-[0.75rem] text-terra">Couldn’t save that — please try again in a moment.</p>}
    </form>
  )
}

function PlanCard({ delay, children, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.8, delay, ease: ease.silk }}
      className="flex flex-col rounded-[1.6rem] border bg-card/85 p-7 shadow-[var(--shadow)] backdrop-blur-sm md:p-9"
      style={{ borderColor: accent ? 'var(--gold2)' : 'var(--line)' }}
    >
      {children}
    </motion.div>
  )
}

export default function Plans() {
  return (
    <section id="plans" className="relative z-10 bg-bg">
      <div className="mx-auto max-w-[1100px] px-6 py-20 md:px-10 md:py-28">
        <div className="text-center">
          <p className="tag-caps mb-6" style={{ fontFamily: 'var(--font-head)' }}>Plans</p>
          <h2 className="headline text-[2.2rem] md:text-[3.2rem]">
            Start free. <em>Go deeper</em> when you’re ready.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <PlanCard delay={0}>
            <div className="flex h-7 items-center">
              <p className="tag-caps" style={{ fontFamily: 'var(--font-head)' }}>Free</p>
            </div>
            <p className="mt-3 text-[2.6rem] leading-none" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>₹0</p>
            <p className="mt-2 text-[0.8rem] text-ink2">Everything you need to understand your skincare.</p>
            <ul className="mt-6 space-y-3 text-[0.88rem] leading-snug text-ink2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex gap-3"><Tick />{f}</li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <Link
                to="/build"
                data-cursor
                className="inline-block rounded-full bg-ink px-8 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-bg transition hover:opacity-90"
                style={{ fontFamily: 'var(--font-head)' }}
              >
                Build your profile
              </Link>
            </div>
          </PlanCard>

          <PlanCard delay={0.12} accent>
            <div className="flex h-7 items-center justify-between gap-3">
              <p className="tag-caps" style={{ fontFamily: 'var(--font-head)' }}>Pro</p>
              <span className="rounded-full border border-gold2 px-3 py-1 text-[0.62rem] uppercase tracking-[0.18em] text-gold2">Coming soon</span>
            </div>
            <p className="mt-3 flex items-baseline gap-2 leading-none">
              <span className="text-[2.6rem]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{PRO_PRICE}</span>
              <span className="text-[0.8rem] text-ink2">{PRO_PERIOD}</span>
            </p>
            <p className="mt-2 text-[0.8rem] text-ink2">Everything in Free, plus a skincare plan made around you.</p>
            <ul className="mt-6 space-y-3 text-[0.88rem] leading-snug text-ink2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex gap-3"><Tick gold />{f}</li>
              ))}
            </ul>
            <div className="mt-auto pt-2">
              <NotifyForm />
            </div>
          </PlanCard>
        </div>
      </div>
    </section>
  )
}

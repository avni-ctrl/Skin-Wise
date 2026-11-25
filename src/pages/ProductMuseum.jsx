import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import FeatureHero from '../components/FeatureHero'
import ProductSearch from '../components/ProductSearch'
import Footer from '../components/Footer'
import { addShelfItem, getShelf, removeShelfItem, setShelfDates } from '../services/userData'
import { reminderCopy, todayISO } from '../services/shelfLife'
import { useAuth } from '../context/AuthContext'
import { ease } from '../lib/easing'
import { useReducedMotion } from '../lib/usePrefs'

const STATUS_META = {
  unopened: { label: 'sealed', color: 'var(--gold2)' },
  good: { label: 'in bloom', color: 'var(--accent)' },
  expiring_soon: { label: 'fading', color: 'var(--amber)' },
  expired: { label: 'rested', color: 'var(--terra)' },
  oxidized: { label: 'oxidized', color: 'var(--terra)' },
}

const fmt = (iso) =>
  iso ? new Date(`${String(iso).slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : null

function SummaryBlob({ count, label, color, speed }) {
  const reduced = useReducedMotion()
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="grid h-20 w-20 place-items-center text-[1.4rem] text-on-accent"
        style={{
          background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${color} 88%, white), ${color})`,
          borderRadius: '58% 42% 55% 45% / 48% 55% 45% 52%',
          animation: reduced ? 'none' : `breathe ${speed}s ease-in-out infinite, amoeba ${speed * 2.4}s ease-in-out infinite`,
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
        }}
      >
        {count}
      </div>
      <span className="text-[0.68rem] uppercase tracking-[0.22em] text-ink2">{label}</span>
    </div>
  )
}

function ShelfCard({ item, onRemove, onOpen }) {
  const meta = STATUS_META[item.status] ?? STATUS_META.good
  const dim = item.status === 'expired' || item.status === 'oxidized'
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: dim ? 0.62 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.5, ease: ease.settle }}
      whileHover={{ y: -4, scale: 1.015 }}
      className="relative overflow-hidden rounded-[1.6rem] border border-line bg-card/85 p-5 shadow-[var(--shadow)] backdrop-blur-sm"
    >
      {item.status === 'expiring_soon' && (
        <svg className="absolute right-3 top-3 h-8 w-8 opacity-70" viewBox="0 0 32 32" fill="none" stroke="var(--amber)" strokeWidth="1.2">
          <path d="M4 28c6-2 8-8 8-14M12 14c3-1 5-4 5-8M12 20c4 0 7 2 8 6" />
          <circle cx="17" cy="6" r="1.6" fill="var(--amber)" stroke="none" />
          <circle cx="20" cy="26" r="1.6" fill="var(--amber)" stroke="none" />
        </svg>
      )}
      <p className="pr-8 text-[0.95rem] leading-snug text-ink">{item.product?.name}</p>
      <p className="mt-0.5 text-[0.72rem] text-ink2">
        {item.product?.brand?.name}
        {item.product?.category ? ` · ${item.product.category}` : ''}
      </p>

      {/* liquid-fill life bar */}
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${meta.color}, color-mix(in srgb, ${meta.color} 65%, var(--gold)))` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(item.lifeLeft * 100)}%` }}
          transition={{ duration: 1, ease: ease.silk }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span
          className="rounded-full px-3 py-1 text-[0.64rem] uppercase tracking-[0.18em]"
          style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
        >
          {meta.label}
        </span>
        <span className="text-[0.68rem] text-ink2">
          {item.expires
            ? item.daysLeft <= 0
              ? `${item.status === 'oxidized' ? 'oxidized' : 'rested'} ${fmt(item.expires.toISOString())}`
              : `${item.daysLeft} day${item.daysLeft === 1 ? '' : 's'} left`
            : 'clock starts when opened'}
        </span>
      </div>

      <p className="mt-3 text-[0.7rem] leading-relaxed text-ink2">
        {item.purchased_on && <>bought {fmt(item.purchased_on)}</>}
        {item.purchased_on && item.opened_on && ' · '}
        {item.opened_on && <>opened {fmt(item.opened_on)}</>}
        {!item.purchased_on && !item.opened_on && 'dates not added'}
      </p>

      {(item.status === 'expiring_soon' || item.status === 'oxidized' || item.status === 'expired') && item.expires && (
        <p className="mt-2 text-[0.72rem] leading-relaxed" style={{ color: meta.color }}>
          {item.status === 'expiring_soon'
            ? reminderCopy({ productName: item.product?.name, daysLeft: item.daysLeft, reason: item.reason, expires: item.expires }).line
            : item.reason === 'oxidation'
              ? 'Vitamin C has oxidised — it is likely no longer effective. Time to replace it.'
              : 'Past its safe window — better to retire it.'}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        {!item.opened_on ? (
          <button
            onClick={onOpen}
            className="rounded-full border border-gold2 px-4 py-1.5 text-[0.7rem] text-gold2 transition-colors hover:bg-gold2 hover:text-bg"
          >
            I opened it today
          </button>
        ) : (
          <span />
        )}
        <button onClick={onRemove} className="text-[0.7rem] text-ink2/60 transition-colors hover:text-terra">
          retire
        </button>
      </div>
    </motion.div>
  )
}

export default function ProductMuseum() {
  const { session, profile } = useAuth()
  const city = profile?.city ?? null
  const [shelf, setShelf] = useState([])
  const [adding, setAdding] = useState(false)
  const [pending, setPending] = useState(null) // product chosen, waiting for dates
  const [form, setForm] = useState({ opened: false, purchasedOn: '', openedOn: '', expiryDate: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session?.user) getShelf(session.user.id, city).then(setShelf).catch(console.error)
  }, [session, city])

  const counts = {
    expired: shelf.filter((s) => s.status === 'expired' || s.status === 'oxidized').length,
    expiring: shelf.filter((s) => s.status === 'expiring_soon').length,
    good: shelf.filter((s) => s.status === 'good' || s.status === 'unopened').length,
  }
  const needAttention = counts.expired + counts.expiring
  const today = todayISO()

  function choose(product) {
    setPending(product)
    setError('')
    setForm({ opened: false, purchasedOn: today, openedOn: today, expiryDate: '' })
  }

  function closeForm() {
    setPending(null)
    setAdding(false)
    setError('')
  }

  async function confirmAdd(e) {
    e.preventDefault()
    if (form.purchasedOn && form.purchasedOn > today) return setError('The purchase date cannot be in the future.')
    if (form.opened && !form.openedOn) return setError('Please pick the date you opened it.')
    if (form.opened && form.openedOn > today) return setError('The opened date cannot be in the future.')
    if (form.opened && form.purchasedOn && form.openedOn < form.purchasedOn) return setError('You cannot open a product before you bought it.')
    setSaving(true)
    try {
      const item = await addShelfItem(session.user.id, pending.id, form.opened ? form.openedOn : null, {
        purchasedOn: form.purchasedOn || null,
        expiryDate: form.expiryDate || null,
        city,
      })
      setShelf((v) => [...v, item])
      closeForm()
    } catch (err) {
      console.error(err)
      setError('Could not save that. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function markOpened(item) {
    try {
      const updated = await setShelfDates(item.id, { openedOn: today }, city)
      setShelf((v) => v.map((s) => (s.id === item.id ? updated : s)))
    } catch (err) {
      console.error(err)
    }
  }

  async function remove(id) {
    await removeShelfItem(id)
    setShelf((v) => v.filter((s) => s.id !== id))
  }

  return (
    <div className="px-4 md:px-8">
      <FeatureHero
        tag="skin shelf · the shelf, curated"
        title={[<>Your shelf, as a</>, <><em>collection.</em></>]}
        sub="Every bottle catalogued from the day it opens — its real life computed for your city, its fading noted, its oxidising flagged."
        img="/images/portrait-man.png"
        imgAlt="Editorial portrait of a young man with clear skin"
        dark
        pos="center 22%"
      />
      <div className="mx-auto max-w-[1000px] pt-14">

        {!session ? (
          <div className="mx-auto mt-16 max-w-md text-center">
            <p className="text-[2.6rem]">🏛</p>
            <p className="mt-4 text-[1.15rem] italic text-ink2" style={{ fontFamily: 'var(--font-display)' }}>
              Every collection starts with a collector. Build your profile to open your museum.
            </p>
            <Link to="/build" className="mt-8 inline-block rounded-full bg-accent px-7 py-3 text-[0.85rem] font-medium text-on-accent">
              Build your profile
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-12 flex justify-center gap-8 md:gap-14">
              <SummaryBlob count={counts.expired} label="rested" color="var(--terra)" speed={5.6} />
              <SummaryBlob count={counts.expiring} label="fading" color="var(--amber)" speed={4.3} />
              <SummaryBlob count={counts.good} label="in bloom" color="var(--accent)" speed={6.8} />
            </div>

            {needAttention > 0 && (
              <p className="mx-auto mt-8 max-w-md rounded-2xl border border-amber/40 bg-amber/10 px-5 py-3 text-center text-[0.8rem] text-ink">
                {needAttention} product{needAttention === 1 ? ' needs' : 's need'} your attention — check the cards below.
              </p>
            )}

            <div className="mt-12">
              {shelf.length === 0 ? (
                <p className="py-14 text-center text-[1.2rem] italic text-ink2" style={{ fontFamily: 'var(--font-display)' }}>
                  Your shelf is waiting to bloom.
                </p>
              ) : (
                <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence>
                    {shelf.map((item) => (
                      <ShelfCard key={item.id} item={item} onRemove={() => remove(item.id)} onOpen={() => markOpened(item)} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

            <div className="mt-10 flex justify-center">
              {pending ? (
                <form onSubmit={confirmAdd} className="w-full max-w-[560px] rounded-[1.6rem] border border-line bg-card/85 p-6 shadow-[var(--shadow)] backdrop-blur-sm">
                  <p className="text-[0.95rem] text-ink">{pending.name}</p>
                  <p className="text-[0.72rem] text-ink2">{pending.brand?.name}</p>

                  <label className="mt-5 block text-[0.75rem] text-ink2">
                    Bought on <span className="opacity-70">(optional)</span>
                    <input
                      type="date"
                      max={today}
                      value={form.purchasedOn}
                      onChange={(e) => setForm({ ...form, purchasedOn: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-line bg-transparent px-3 py-2 text-[0.85rem] text-ink"
                    />
                  </label>

                  <div className="mt-5 flex gap-3 text-[0.8rem]">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, opened: false })}
                      className={`flex-1 rounded-xl border px-3 py-2 transition-colors ${!form.opened ? 'border-gold2 text-gold2' : 'border-line text-ink2'}`}
                    >
                      Not opened yet
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, opened: true })}
                      className={`flex-1 rounded-xl border px-3 py-2 transition-colors ${form.opened ? 'border-gold2 text-gold2' : 'border-line text-ink2'}`}
                    >
                      Already opened
                    </button>
                  </div>

                  {form.opened ? (
                    <label className="mt-4 block text-[0.75rem] text-ink2">
                      Opened on
                      <input
                        type="date"
                        max={today}
                        value={form.openedOn}
                        onChange={(e) => setForm({ ...form, openedOn: e.target.value })}
                        className="mt-1 block w-full rounded-xl border border-line bg-transparent px-3 py-2 text-[0.85rem] text-ink"
                      />
                    </label>
                  ) : (
                    <p className="mt-3 text-[0.72rem] italic text-ink2">
                      No problem — its clock starts the day you tap “I opened it today”.
                    </p>
                  )}

                  <label className="mt-4 block text-[0.75rem] text-ink2">
                    Expiry date printed on the pack <span className="opacity-70">(optional)</span>
                    <input
                      type="date"
                      value={form.expiryDate}
                      onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-line bg-transparent px-3 py-2 text-[0.85rem] text-ink"
                    />
                  </label>

                  {error && <p className="mt-3 text-[0.75rem] text-terra">{error}</p>}

                  <div className="mt-6 flex items-center justify-between">
                    <button type="button" onClick={closeForm} className="text-[0.78rem] text-ink2">cancel</button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-full bg-accent px-7 py-2.5 text-[0.85rem] font-medium text-on-accent disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Add to shelf'}
                    </button>
                  </div>
                </form>
              ) : adding ? (
                <div className="w-full max-w-[560px]">
                  <ProductSearch compact placeholder="Which bottle joins the collection?" onSelect={choose} autoFocus />
                  <button onClick={() => setAdding(false)} className="mx-auto mt-3 block text-[0.78rem] text-ink2">cancel</button>
                </div>
              ) : (
                <button onClick={() => setAdding(true)} className="rounded-full bg-accent px-7 py-3 text-[0.85rem] font-medium text-on-accent">
                  + Acquire for the collection
                </button>
              )}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import FeatureHero from '../components/FeatureHero'
import ProductSearch from '../components/ProductSearch'
import Footer from '../components/Footer'
import { addShelfItem, getShelf, removeShelfItem } from '../services/userData'
import { useAuth } from '../context/AuthContext'
import { ease } from '../lib/easing'
import { useReducedMotion } from '../lib/usePrefs'

const STATUS_META = {
  good: { label: 'in bloom', color: 'var(--accent)' },
  expiring_soon: { label: 'fading', color: 'var(--amber)' },
  expired: { label: 'rested', color: 'var(--terra)' },
  oxidized: { label: 'oxidized', color: 'var(--terra)' },
}

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

function ShelfCard({ item, onRemove }) {
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
            ? item.status === 'expired'
              ? `rested ${item.expires.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
              : `until ${item.expires.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
            : item.opened_on
              ? `opened ${item.opened_on}`
              : 'unopened'}
        </span>
      </div>
      <button
        onClick={onRemove}
        className="absolute bottom-3 right-4 text-[0.7rem] text-ink2/60 hover:text-terra transition-colors"
      >
        retire
      </button>
    </motion.div>
  )
}

export default function ProductMuseum() {
  const { session } = useAuth()
  const [shelf, setShelf] = useState([])
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (session?.user) getShelf(session.user.id).then(setShelf).catch(console.error)
  }, [session])

  const counts = {
    expired: shelf.filter((s) => s.status === 'expired' || s.status === 'oxidized').length,
    expiring: shelf.filter((s) => s.status === 'expiring_soon').length,
    good: shelf.filter((s) => s.status === 'good').length,
  }

  async function add(product) {
    const item = await addShelfItem(session.user.id, product.id, new Date().toISOString().slice(0, 10))
    setShelf((v) => [...v, item])
    setAdding(false)
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

            <div className="mt-12">
              {shelf.length === 0 ? (
                <p className="py-14 text-center text-[1.2rem] italic text-ink2" style={{ fontFamily: 'var(--font-display)' }}>
                  Your shelf is waiting to bloom.
                </p>
              ) : (
                <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence>
                    {shelf.map((item) => (
                      <ShelfCard key={item.id} item={item} onRemove={() => remove(item.id)} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

            <div className="mt-10 flex justify-center">
              {adding ? (
                <div className="w-full max-w-[560px]">
                  <ProductSearch compact placeholder="Which bottle joins the collection?" onSelect={add} autoFocus />
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

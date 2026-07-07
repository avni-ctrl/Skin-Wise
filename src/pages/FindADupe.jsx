import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Headline from '../components/Headline'
import ProductSearch from '../components/ProductSearch'
import Footer from '../components/Footer'
import { findDupes } from '../services/dupes'
import { addShelfItem } from '../services/userData'
import { useAuth } from '../context/AuthContext'
import { ease, spring } from '../lib/easing'

function DupeCard({ dupe, i, onAdd, added, canAdd }) {
  const p = dupe.product
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...spring.bloom, delay: 0.15 + i * 0.09 }}
      className="flex flex-col rounded-[1.6rem] border border-line bg-card/85 p-6 shadow-[var(--shadow)] backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.95rem] leading-snug text-ink">{p.name}</p>
          <p className="mt-0.5 text-[0.72rem] text-ink2">{p.brand?.name}{p.category ? ` · ${p.category}` : ''}</p>
        </div>
        <span className="shrink-0 rounded-full bg-gold/15 px-3 py-1 text-[0.72rem] text-gold2">
          {dupe.compatibility}% match
        </span>
      </div>

      <p className="mt-3 text-[1.15rem]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        {p.price_inr != null ? `₹${p.price_inr.toLocaleString('en-IN')}` : <span className="text-ink2 text-[0.85rem] font-normal italic">price not on record</span>}
        {dupe.savings > 0 && (
          <span className="ml-2 text-[0.75rem] font-normal text-accent">saves ₹{dupe.savings.toLocaleString('en-IN')}</span>
        )}
      </p>

      {dupe.sharedActives.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {dupe.sharedActives.slice(0, 4).map((ing) => (
            <span key={ing.id} className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[0.64rem] text-ink2">
              {ing.common_name || ing.inci_name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-4">
        {canAdd ? (
          <button
            onClick={onAdd}
            disabled={added}
            className="w-full rounded-full border border-accent px-4 py-2 text-[0.78rem] text-accent transition-colors hover:bg-accent hover:text-on-accent disabled:border-line disabled:text-ink2"
          >
            {added ? 'On your shelf ✓' : 'Add to shelf'}
          </button>
        ) : (
          <Link to="/build" className="block w-full rounded-full border border-line px-4 py-2 text-center text-[0.78rem] text-ink2 hover:border-gold2 hover:text-gold2 transition-colors">
            Build a profile to save it
          </Link>
        )}
      </div>
    </motion.div>
  )
}

export default function FindADupe() {
  const { session } = useAuth()
  const location = useLocation()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [addedIds, setAddedIds] = useState(new Set())

  async function scan(product) {
    setScanning(true)
    setResult(null)
    try {
      const res = await findDupes(product.id)
      // let the scanner breathe once — fast, never slow
      setTimeout(() => {
        setResult(res)
        setScanning(false)
      }, 700)
    } catch (e) {
      console.error(e)
      setScanning(false)
    }
  }

  // arriving from Formula Lab's Smart Swap
  useEffect(() => {
    const pid = location.state?.productId
    if (pid) scan({ id: pid })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  async function addToShelf(productId) {
    await addShelfItem(session.user.id, productId, new Date().toISOString().slice(0, 10))
    setAddedIds((s) => new Set([...s, productId]))
  }

  return (
    <div className="px-4 pt-32 md:px-8 md:pt-40">
      <div className="mx-auto max-w-[1000px]">
        <div className="text-center">
          <p className="tag-caps mb-4">find a dupe</p>
          <Headline lines={[['Same', 'good', '. Smaller price.']]} />
          <p className="mx-auto mt-5 max-w-md text-[0.9rem] text-ink2">
            Free for everyone, no login. Search what you love — we rebuild it from its ingredients.
          </p>
        </div>

        {/* the scanner */}
        <div className="mx-auto mt-12 max-w-[620px]">
          <div
            className={`rounded-[2.2rem] border-2 border-dashed p-6 transition-colors duration-500 ${
              scanning ? 'border-gold' : 'border-line'
            }`}
            style={{ boxShadow: scanning ? '0 0 40px -8px color-mix(in srgb, var(--gold) 45%, transparent)' : 'none' }}
          >
            <ProductSearch placeholder="Drop in the product you love…" onSelect={scan} />
            <AnimatePresence>
              {scanning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 flex flex-wrap justify-center gap-2"
                >
                  {['reading label', 'splitting molecules', 'matching formulas'].map((s, i) => (
                    <motion.span
                      key={s}
                      className="rounded-full border border-gold/40 px-3 py-1 text-[0.68rem] text-gold2"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.25 }}
                    >
                      {s}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div key={result.target.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-14">
              {/* the considered comparison: target … gold line … dupes */}
              <div className="mx-auto mb-10 flex max-w-[700px] items-center gap-4 px-2">
                <div className="text-right">
                  <p className="text-[0.95rem] text-ink">{result.target.name}</p>
                  <p className="text-[0.72rem] text-ink2">
                    {result.target.brand?.name}
                    {result.target.price_inr != null && ` · ₹${result.target.price_inr.toLocaleString('en-IN')}`}
                  </p>
                </div>
                <motion.div
                  className="h-px flex-1"
                  style={{ background: 'linear-gradient(90deg, var(--gold), color-mix(in srgb, var(--gold) 30%, transparent))' }}
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.9, ease: ease.silk }}
                />
                <p className="smallcaps text-[0.78rem] text-gold2">{result.dupes.length} echoes</p>
              </div>

              {result.dupes.length === 0 ? (
                <p className="py-10 text-center italic text-ink2" style={{ fontFamily: 'var(--font-display)' }}>
                  This one stands alone — no honest match in the library yet.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {result.dupes.map((d, i) => (
                    <DupeCard
                      key={d.product.id}
                      dupe={d}
                      i={i}
                      canAdd={Boolean(session)}
                      added={addedIds.has(d.product.id)}
                      onAdd={() => addToShelf(d.product.id)}
                    />
                  ))}
                </div>
              )}

              {/* soft prompt AFTER results — never a gate */}
              {!session && result.dupes.length > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-10 text-center text-[0.85rem] text-ink2"
                >
                  Like these? <Link to="/build" className="text-gold2 underline underline-offset-4">Build your profile</Link> to save dupes to your shelf and get verdicts tuned to your skin.
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  )
}

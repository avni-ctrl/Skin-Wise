import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import FeatureHero from '../components/FeatureHero'
import ProductSearch from '../components/ProductSearch'
import ScoreRing from '../components/ScoreRing'
import Accordion from '../components/Accordion'
import Footer from '../components/Footer'
import { backdropBus } from '../components/backdropBus'
import { getProductVerdict } from '../services/verdict'
import { findDupes } from '../services/dupes'
import { getRoutine } from '../services/userData'
import { useAuth } from '../context/AuthContext'
import { ease, spring } from '../lib/easing'

function FloatingMolecules({ ingredients }) {
  const [fact, setFact] = useState(null)
  return (
    <div className="relative mx-auto mt-10 flex max-w-[560px] flex-wrap justify-center gap-3">
      {ingredients.slice(0, 10).map((ing, i) => (
        <motion.button
          key={ing.id}
          onClick={() => setFact(fact?.id === ing.id ? null : ing)}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
          transition={{
            opacity: { delay: i * 0.06 },
            scale: { delay: i * 0.06, ...spring.drift },
            y: { duration: 3 + (i % 4), repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 },
          }}
          className="rounded-full border border-line bg-card/60 px-4 py-1.5 text-[0.72rem] text-ink2 backdrop-blur-sm hover:border-gold2 hover:text-ink transition-colors"
        >
          {ing.common_name || ing.inci_name}
        </motion.button>
      ))}
      <AnimatePresence>
        {fact && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full text-center text-[0.8rem] italic text-ink2 mt-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {fact.plain_explanation || `${fact.inci_name} — ${fact.function ?? 'supporting ingredient'}.`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FormulaLab() {
  const { session, profile } = useAuth()
  const [routine, setRoutine] = useState([])
  const [selected, setSelected] = useState(null)
  const [verdict, setVerdict] = useState(null)
  const [swap, setSwap] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user) getRoutine(session.user.id).then(setRoutine).catch(console.error)
  }, [session])

  async function analyze(product) {
    setSelected(product)
    setVerdict(null)
    setSwap(null)
    setLoading(true)
    try {
      const v = await getProductVerdict(product.id, profile, routine)
      setVerdict(v)
      // the backdrop reflects the USER's real result
      if (v.routineConflicts.length) backdropBus.pulseConflict()
      else backdropBus.pulseHarmony()
      findDupes(product.id, 3).then((d) => {
        const best = d.dupes.find((x) => x.cheaper) ?? d.dupes[0]
        if (best) setSwap(best)
      }).catch(() => {})
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const labelColor = verdict
    ? verdict.score <= 40 ? 'var(--terra)' : verdict.score <= 70 ? 'var(--amber)' : 'var(--accent)'
    : 'var(--accent)'

  return (
    <div className="px-4 md:px-8">
      <FeatureHero
        tag="formula analysis · the reading room"
        title={[<>Read every</>, <><em>ingredient.</em></>]}
        sub="Search anything on your shelf or wishlist — we score it against your skin, your routine, your city."
        img="/images/garden-doodle.jpg"
        imgAlt="Hand-drawn doodles of skincare bottles and jars, some open, some closed"
        dark={false}
        pos="center"
      />
      <div className="mx-auto max-w-[1000px] pt-14">
        <div className="mt-1">
          <ProductSearch onSelect={analyze} />
        </div>

        {!session && (
          <p className="mt-6 text-center text-[0.78rem] text-ink2">
            Verdicts work for everyone — <Link to="/build" className="text-gold2 underline underline-offset-4">build your profile</Link> to personalize them to your skin and routine.
          </p>
        )}

        <AnimatePresence mode="wait">
          {loading && selected && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-14 text-center">
              <p className="italic text-ink2" style={{ fontFamily: 'var(--font-display)' }}>
                Reading {selected.name}&rsquo;s label…
              </p>
              <motion.div
                className="mx-auto mt-6 h-3 w-3 rounded-full bg-gold"
                animate={{ scale: [1, 2, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.1, repeat: Infinity }}
              />
            </motion.div>
          )}

          {verdict && !loading && (
            <motion.div
              key={verdict.product.id}
              initial={{ opacity: 0, y: 46 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.65, ease: ease.settle }}
              className="mt-14"
            >
              {/* verdict card */}
              <div className="rounded-[2rem] border border-line bg-card/85 p-7 shadow-[var(--shadow)] backdrop-blur-md md:p-10">
                <div className="flex flex-col items-center gap-7 md:flex-row md:gap-12">
                  <ScoreRing score={verdict.score} />
                  <div className="text-center md:text-left">
                    <p className="smallcaps text-[1.5rem] tracking-[0.3em]" style={{ color: labelColor }}>
                      {verdict.label}
                    </p>
                    <h2 className="mt-1 text-[1.4rem] leading-tight" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      {verdict.product.name}
                    </h2>
                    <p className="text-[0.82rem] text-ink2">
                      {verdict.product.brand?.name}
                      {verdict.product.price_inr != null && ` · ₹${verdict.product.price_inr.toLocaleString('en-IN')}`}
                      {verdict.product.category && ` · ${verdict.product.category}`}
                    </p>
                    <p className="mt-3 max-w-md text-[0.82rem] italic text-ink2" style={{ fontFamily: 'var(--font-display)' }}>
                      {verdict.personalized
                        ? 'Scored against your saved skin profile and routine.'
                        : 'General score — build your profile for a personal one.'}
                    </p>
                  </div>
                </div>

                <FloatingMolecules ingredients={verdict.ingredients} />

                <div className="mt-10">
                  <Accordion
                    defaultOpen={verdict.routineConflicts.length ? 1 : 0}
                    items={[
                      {
                        title: 'Key Ingredients',
                        badge: verdict.keyIngredients.length,
                        content: verdict.keyIngredients.length ? (
                          <ul className="space-y-3">
                            {verdict.keyIngredients.map((ing) => (
                              <li key={ing.id}>
                                <span className="text-ink">{ing.common_name || ing.inci_name}</span>
                                <span className="text-ink2"> — {ing.plain_explanation || ing.function}</span>
                              </li>
                            ))}
                          </ul>
                        ) : 'No headline actives — this one is a quiet, supporting formula.',
                      },
                      {
                        title: 'Routine Conflicts',
                        badge: verdict.routineConflicts.length,
                        badgeColor: verdict.routineConflicts.length ? 'var(--amber)' : 'var(--accent)',
                        content: verdict.routineConflicts.length ? (
                          <ul className="space-y-4">
                            {verdict.routineConflicts.map((c, i) => (
                              <li key={i} className="rounded-xl border border-amber/40 bg-amber/10 p-4">
                                <p className="text-ink">
                                  {c.ingredient.common_name || c.ingredient.inci_name} clashes with{' '}
                                  <b>{c.withItem.product?.name}</b> ({c.routineIngredient.common_name || c.routineIngredient.inci_name})
                                </p>
                                <p className="mt-1">{c.explanation}</p>
                                <p className="mt-1 italic text-gold2" style={{ fontFamily: 'var(--font-display)' }}>Fix: {c.fix}</p>
                              </li>
                            ))}
                          </ul>
                        ) : session
                          ? 'Nothing in your saved routine argues with this formula. Layer freely.'
                          : 'Sign in with a profile and we’ll cross-check this against your actual routine.',
                      },
                      {
                        title: 'Shelf-Life',
                        content: verdict.shelfLife.note,
                      },
                      {
                        title: 'Realistic Timeline',
                        content: (
                          <ul className="space-y-2">
                            {verdict.timeline.map((t, i) => (
                              <li key={i}>
                                <span className="text-gold2">{t.label}</span>
                                <span className="text-ink2"> — {t.note}</span>
                              </li>
                            ))}
                          </ul>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>

              {/* Smart Swap */}
              {swap && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6, ease: ease.silk }}
                  className="mt-6 flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-gold/40 bg-card/85 p-6 shadow-[var(--shadow)] backdrop-blur-md md:flex-row md:items-center md:p-8"
                >
                  <div>
                    <p className="tag-caps mb-2">smart swap</p>
                    <p className="text-[1.05rem]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      {swap.product.name} <span className="text-ink2 font-normal">· {swap.product.brand?.name}</span>
                    </p>
                    <p className="mt-1 text-[0.8rem] text-ink2">
                      {swap.compatibility}% ingredient match
                      {swap.savings > 0 && ` · saves ₹${swap.savings.toLocaleString('en-IN')}`}
                      {swap.product.price_inr != null && ` · ₹${swap.product.price_inr.toLocaleString('en-IN')}`}
                    </p>
                  </div>
                  <Link
                    to="/find-a-dupe"
                    state={{ productId: verdict.product.id }}
                    className="shrink-0 rounded-full border border-gold2 px-6 py-2.5 text-[0.8rem] text-gold2 hover:bg-gold2 hover:text-bg transition-colors"
                  >
                    See all dupes →
                  </Link>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  )
}

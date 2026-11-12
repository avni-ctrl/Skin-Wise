import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import FeatureHero from '../components/FeatureHero'
import ProductSearch from '../components/ProductSearch'
import ScoreRing from '../components/ScoreRing'
import Accordion from '../components/Accordion'
import Footer from '../components/Footer'
import { backdropBus } from '../components/backdropBus'
import { getProductVerdict } from '../services/verdict'
import { ensureIngredients, getExplanation } from '../services/lookup'
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
  const [phase, setPhase] = useState('reading') // reading | fetching
  const [unavailable, setUnavailable] = useState(null)
  const [explain, setExplain] = useState({ state: 'idle', content: null })
  const runId = useRef(0)

  useEffect(() => {
    if (session?.user) getRoutine(session.user.id).then(setRoutine).catch(console.error)
  }, [session])

  async function analyze(product) {
    const run = ++runId.current
    const stale = () => run !== runId.current
    setSelected(product)
    setVerdict(null)
    setSwap(null)
    setUnavailable(null)
    setExplain({ state: 'idle', content: null })
    setPhase('reading')
    setLoading(true)
    try {
      let v = await getProductVerdict(product.id, profile, routine)
      if (stale()) return
      if (v.unavailable) {
        // No trustworthy ingredient list yet — go and find it on the web (once; cached for everyone after).
        setPhase('fetching')
        const found = await ensureIngredients(product.id)
        if (stale()) return
        if (found.status !== 'ready') {
          setUnavailable({ product, reason: found.status })
          return
        }
        v = await getProductVerdict(product.id, profile, routine)
        if (stale()) return
        if (v.unavailable) {
          setUnavailable({ product, reason: 'not_found' })
          return
        }
      }
      setVerdict(v)
      // the backdrop reflects the USER's real result
      if (v.routineConflicts.length) backdropBus.pulseConflict()
      else backdropBus.pulseHarmony()
      findDupes(product.id, 3).then((d) => {
        if (stale()) return
        const best = d.dupes.find((x) => x.cheaper) ?? d.dupes[0]
        if (best) setSwap(best)
      }).catch(() => {})
      // Personalised write-up arrives a moment later; the score is already on screen.
      setExplain({ state: 'loading', content: null })
      getExplanation(product.id, profile).then((r) => {
        if (stale()) return
        setExplain(r.status === 'ok' ? { state: 'ready', content: r.content } : { state: 'none', content: null })
      })
    } catch (e) {
      console.error(e)
      if (!stale()) setUnavailable({ product, reason: 'error' })
    } finally {
      if (!stale()) setLoading(false)
    }
  }

  const labelColor = verdict
    ? verdict.label === 'AVOID' ? 'var(--terra)' : verdict.label === 'CAUTION' ? 'var(--amber)' : 'var(--accent)'
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
                {phase === 'fetching'
                  ? `Finding ${selected.name}’s official ingredient list…`
                  : `Reading ${selected.name}’s label…`}
              </p>
              {phase === 'fetching' && (
                <p className="mx-auto mt-2 max-w-sm text-[0.75rem] text-ink2">
                  First time anyone has searched this one, so we’re looking it up on the web. Takes about 10–25 seconds — next time it’s instant.
                </p>
              )}
              <motion.div
                className="mx-auto mt-6 h-3 w-3 rounded-full bg-gold"
                animate={{ scale: [1, 2, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.1, repeat: Infinity }}
              />
            </motion.div>
          )}

          {unavailable && !loading && (
            <motion.div
              key="unavailable"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-14 rounded-[2rem] border border-line bg-card/85 p-8 text-center shadow-[var(--shadow)] backdrop-blur-md"
            >
              <p className="tag-caps mb-3">no verified label yet</p>
              <h2 className="text-[1.3rem]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {unavailable.product.name}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[0.85rem] leading-relaxed text-ink2">
                {unavailable.reason === 'busy'
                  ? 'We’ve looked up a lot of products today and need a short breather. Please try again later — we’d rather wait than guess your score.'
                  : unavailable.reason === 'unavailable' || unavailable.reason === 'error'
                    ? 'We couldn’t reach our ingredient lookup just now. Try again in a minute.'
                    : 'We couldn’t find a trustworthy ingredient list for this product online, and we won’t guess one — a made-up score is worse than none. Try a nearby variant, or check back soon.'}
              </p>
              <button
                onClick={() => analyze(unavailable.product)}
                className="mt-6 rounded-full border border-gold2 px-6 py-2.5 text-[0.8rem] text-gold2 transition-colors hover:bg-gold2 hover:text-bg"
              >
                Try again
              </button>
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
                  <ScoreRing score={verdict.score} color={labelColor} />
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
                    <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                      <span className="rounded-full border border-line px-3 py-1 text-[0.7rem] text-ink2">Safety for you · {verdict.subScores.safety}</span>
                      <span className="rounded-full border border-line px-3 py-1 text-[0.7rem] text-ink2">Goal fit · {verdict.subScores.goal}</span>
                    </div>
                    <p className="mt-3 max-w-md text-[0.78rem] italic text-ink2" style={{ fontFamily: 'var(--font-display)' }}>
                      {verdict.personalized
                        ? 'Scored from the real ingredient list against your skin profile and routine.'
                        : 'General score — build your profile for a personal one.'}
                    </p>
                    {verdict.sourceUrl && (
                      <p className="mt-1 text-[0.7rem] text-ink2">
                        {verdict.dataStatus === 'verified' ? 'Verified label' : 'Ingredients auto-read from'}{' '}
                        <a href={verdict.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-gold2 underline underline-offset-4">
                          {(() => { try { return new URL(verdict.sourceUrl).hostname.replace(/^www\./, '') } catch { return 'source' } })()}
                        </a>
                        {verdict.dataStatus === 'auto' && ' — double-check on the pack.'}
                      </p>
                    )}
                  </div>
                </div>

                <FloatingMolecules ingredients={verdict.ingredients} />

                <div className="mt-10">
                  <Accordion
                    defaultOpen={0}
                    items={[
                      {
                        title: 'Why this score — for your skin',
                        content: (
                          <div className="space-y-4">
                            {explain.state === 'loading' && <p className="italic">Writing your personal read…</p>}
                            {explain.state === 'ready' && (
                              <>
                                <p className="text-ink" style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{explain.content.headline}</p>
                                {explain.content.suits.length > 0 && (
                                  <div>
                                    <p className="smallcaps mb-1 text-[0.68rem] text-ink">Works for you</p>
                                    <ul className="list-disc space-y-1 pl-5">{explain.content.suits.map((t, i) => <li key={i}>{t}</li>)}</ul>
                                  </div>
                                )}
                                {explain.content.watch_out.length > 0 && (
                                  <div>
                                    <p className="smallcaps mb-1 text-[0.68rem] text-ink">Watch out</p>
                                    <ul className="list-disc space-y-1 pl-5">{explain.content.watch_out.map((t, i) => <li key={i}>{t}</li>)}</ul>
                                  </div>
                                )}
                              </>
                            )}
                            {explain.state !== 'ready' && explain.state !== 'loading' && (
                              <>
                                {verdict.pros.length === 0 && verdict.cons.length === 0 && (
                                  <p>No ingredient stands out for or against your profile — a neutral formula for you.</p>
                                )}
                                {verdict.pros.length > 0 && (
                                  <ul className="list-disc space-y-1 pl-5">{verdict.pros.map((f, i) => <li key={i}>{f.text}</li>)}</ul>
                                )}
                                {verdict.cons.length > 0 && (
                                  <ul className="list-disc space-y-1 pl-5">{verdict.cons.map((f, i) => <li key={i}>{f.text}</li>)}</ul>
                                )}
                              </>
                            )}
                            {verdict.concernDetail.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {verdict.concernDetail.map((c) => (
                                  <span key={c.concern} className="rounded-full border border-line px-3 py-1 text-[0.7rem]">
                                    {c.concern} · {c.fit}% covered{c.ingredients[0] ? ` (${c.ingredients.slice(0, 2).join(', ')})` : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ),
                      },
                      {
                        title: 'Key Ingredients',
                        badge: verdict.keyIngredients.length,
                        content: verdict.keyIngredients.length ? (
                          <ul className="space-y-3">
                            {verdict.keyIngredients.map((ing) => {
                              const ai = explain.content?.key_ingredients?.find((k) => k.name.toLowerCase().includes((ing.common_name || ing.inci_name).toLowerCase()) || k.name.toLowerCase().includes(ing.inci_name.toLowerCase()))
                              return (
                                <li key={ing.id}>
                                  <span className="text-ink">{ing.common_name || ing.inci_name}</span>
                                  <span className="text-ink2"> — {ing.plain_explanation || ing.function || 'supporting ingredient'}</span>
                                  {(ai?.why_for_you || ing.forYou) && (
                                    <span className="mt-0.5 block text-gold2">For you: {ai?.why_for_you || ing.forYou}</span>
                                  )}
                                </li>
                              )
                            })}
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
                          <div className="space-y-3">
                            <p className="text-ink">{verdict.timeline.headline}</p>
                            {verdict.timeline.entries.length > 0 && (
                              <ul className="space-y-2">
                                {verdict.timeline.entries.map((t, i) => (
                                  <li key={i}>
                                    <span className="text-gold2">{t.window}</span>
                                    <span className="text-ink2"> — {t.ingredient}{t.relevant ? ' (your goal)' : ''}{t.note ? `. ${t.note}` : ''}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {explain.content?.what_to_expect && <p className="italic">{explain.content.what_to_expect}</p>}
                          </div>
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

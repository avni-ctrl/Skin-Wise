import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, Reorder } from 'framer-motion'
import FeatureHero from '../components/FeatureHero'
import ProductSearch from '../components/ProductSearch'
import Footer from '../components/Footer'
import { backdropBus } from '../components/backdropBus'
import { checkRoutineConflicts } from '../services/conflicts'
import { addRoutineItem, getRoutine, removeRoutineItem, reorderRoutine, listCheckins, uploadCheckin } from '../services/userData'
import { useAuth } from '../context/AuthContext'
import { ease } from '../lib/easing'

function GuestGate() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <p className="text-[2.6rem]">🌱</p>
      <p className="mt-4 text-[1.15rem] italic text-ink2" style={{ fontFamily: 'var(--font-display)' }}>
        A garden needs a gardener. Build your skin profile and your ritual takes root here.
      </p>
      <Link to="/build" className="mt-8 inline-block rounded-full bg-accent px-7 py-3 text-[0.85rem] font-medium text-on-accent">
        Build your profile
      </Link>
    </div>
  )
}

function PhotoCheckin({ userId }) {
  const [checkins, setCheckins] = useState([])
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    listCheckins(userId).then(setCheckins).catch(console.error)
  }, [userId])

  const todayDone = checkins.some((c) => c.taken_on === new Date().toISOString().slice(0, 10))

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      await uploadCheckin(userId, file)
      setCheckins(await listCheckins(userId))
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <section className="mt-16">
      <p className="tag-caps mb-3">private progress</p>
      <h2 className="headline text-[1.6rem] md:text-[2rem]">Today&rsquo;s <em>check-in</em></h2>
      <p className="mt-2 max-w-md text-[0.82rem] text-ink2">
        One photo a day, visible only to you. Self-tracked — we never diagnose.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onFile} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-full border border-accent px-6 py-2.5 text-[0.82rem] text-accent hover:bg-accent hover:text-on-accent transition-colors disabled:opacity-50"
        >
          {busy ? 'Saving…' : todayDone ? 'Add another photo' : 'Capture today'}
        </button>
        {todayDone && <span className="text-[0.78rem] italic text-gold2" style={{ fontFamily: 'var(--font-display)' }}>Today is in the book. ✓</span>}
      </div>
      {checkins.length > 0 && (
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
          {checkins.slice(0, 14).map((c) => (
            <figure key={c.id} className="shrink-0">
              {c.signedUrl ? (
                <img src={c.signedUrl} alt={`Check-in ${c.taken_on}`} className="h-24 w-20 rounded-xl object-cover border border-line" />
              ) : (
                <div className="h-24 w-20 rounded-xl border border-line bg-card" />
              )}
              <figcaption className="mt-1 text-center text-[0.62rem] text-ink2">{c.taken_on}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  )
}

export default function SkinGarden() {
  const { session, profile } = useAuth()
  const [mode, setMode] = useState('AM')
  const [items, setItems] = useState([])
  const [conflicts, setConflicts] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    backdropBus.set({ gardenMode: mode })
  }, [mode])

  useEffect(() => {
    if (session?.user) getRoutine(session.user.id).then(setItems).catch(console.error)
  }, [session])

  const current = items.filter((it) => it.time_of_day === mode)
  const hasSPF = current.some((it) => it.product?.category === 'Sunscreen')

  async function scan() {
    setScanning(true)
    setConflicts(null)
    try {
      const found = await checkRoutineConflicts(items)
      // let the wave sweep before revealing — craft, not latency
      setTimeout(() => {
        setConflicts(found)
        setScanning(false)
        if (found.length) backdropBus.pulseConflict()
        else backdropBus.pulseHarmony()
      }, 1100)
    } catch (e) {
      console.error(e)
      setScanning(false)
    }
  }

  async function add(product) {
    const item = await addRoutineItem(session.user.id, product.id, mode, current.length + 1)
    setItems((v) => [...v, item])
    setAdding(false)
  }

  async function remove(id) {
    await removeRoutineItem(id)
    setItems((v) => v.filter((it) => it.id !== id))
  }

  function onReorder(newOrder) {
    setItems((v) => [...v.filter((it) => it.time_of_day !== mode), ...newOrder])
    reorderRoutine(newOrder).catch(console.error)
  }

  function exportRoutine() {
    const fmt = (tod) =>
      items
        .filter((it) => it.time_of_day === tod)
        .map((it, i) => `  ${i + 1}. ${it.product?.name ?? 'Product'} (${it.product?.brand?.name ?? ''})`)
        .join('\n') || '  —'
    const text = `SKINWISE ROUTINE — ${profile?.name ?? ''}\n\nAM\n${fmt('AM')}\n\nPM\n${fmt('PM')}\n\nKnow your skin. Know your products.`
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'skinwise-routine.txt'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="px-4 md:px-8">
      <FeatureHero
        tag="skin garden · where rituals take root"
        title={[<>Your daily</>, <><em>ritual.</em></>]}
        sub="Morning and night, planted step by step — every leaf checked so nothing in your garden fights itself."
        img="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1600&auto=format&fit=crop"
        imgAlt="Deep green leaves holding drops of water"
        dark
        pos="center"
      />
      <div className="mx-auto max-w-[820px] pt-14">

        {!session ? (
          <GuestGate />
        ) : (
          <>
            {/* AM/PM amoeba toggle — drives the living backdrop */}
            <div className="mx-auto mt-10 flex w-fit rounded-full border border-line bg-card/70 p-1 backdrop-blur-sm">
              {['AM', 'PM'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`relative rounded-full px-8 py-2.5 text-[0.85rem] transition-colors ${mode === m ? 'text-on-accent' : 'text-ink2'}`}
                >
                  {mode === m && (
                    <motion.span
                      layoutId="garden-mode"
                      className="absolute inset-0 rounded-full bg-accent"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      style={{ borderRadius: '58% 42% 55% 45% / 48% 55% 45% 52%' }}
                    />
                  )}
                  <span className="relative">{m === 'AM' ? '☀ AM' : '☾ PM'}</span>
                </button>
              ))}
            </div>

            {/* missing SPF */}
            <AnimatePresence>
              {mode === 'AM' && !hasSPF && current.length > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mx-auto mt-6 w-fit rounded-full border border-amber/50 bg-amber/10 px-5 py-2 text-[0.78rem] text-amber"
                >
                  Your morning is missing its roof — no SPF in the AM ritual.
                </motion.p>
              )}
            </AnimatePresence>

            {/* routine list */}
            <div className="relative mt-10">
              {scanning && (
                <motion.div
                  className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 rounded-2xl"
                  style={{ background: 'linear-gradient(180deg, transparent, color-mix(in srgb, var(--gold) 22%, transparent), transparent)' }}
                  initial={{ y: -60, opacity: 0 }}
                  animate={{ y: [0, (current.length || 1) * 92], opacity: [0.9, 0.6] }}
                  transition={{ duration: 1.05, ease: 'easeInOut' }}
                />
              )}
              {current.length === 0 ? (
                <p className="py-12 text-center italic text-ink2" style={{ fontFamily: 'var(--font-display)' }}>
                  This bed is unplanted — add your first {mode} step below.
                </p>
              ) : (
                <Reorder.Group axis="y" values={current} onReorder={onReorder} className="space-y-3">
                  {current.map((it, idx) => {
                    const itemConflicts = (conflicts ?? []).filter(
                      (c) => c.itemA.id === it.id || c.itemB.id === it.id
                    )
                    const state = conflicts == null ? 'idle' : itemConflicts.length ? 'conflict' : 'safe'
                    return (
                      <Reorder.Item
                        key={it.id}
                        value={it}
                        whileDrag={{ scale: 1.03, boxShadow: 'var(--shadow)' }}
                        className={`flex cursor-grab items-center gap-4 rounded-2xl border bg-card/85 px-5 py-4 backdrop-blur-sm transition-colors active:cursor-grabbing ${
                          state === 'conflict' ? 'border-amber' : state === 'safe' ? 'border-accent/60' : 'border-line'
                        }`}
                      >
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[0.78rem] text-on-accent"
                          style={{ background: state === 'conflict' ? 'var(--amber)' : 'var(--accent)', borderRadius: '58% 42% 55% 45% / 48% 55% 45% 52%' }}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.92rem] text-ink">{it.product?.name}</p>
                          <p className="truncate text-[0.72rem] text-ink2">
                            {it.product?.brand?.name}{it.product?.category ? ` · ${it.product.category}` : ''}
                          </p>
                          {itemConflicts.map((c, i) => (
                            <p key={i} className="mt-1 text-[0.72rem] text-amber">
                              ⚠ {c.explanation} <span className="italic">({c.fix})</span>
                            </p>
                          ))}
                        </div>
                        <button onClick={() => remove(it.id)} aria-label="Remove" className="text-ink2 hover:text-terra transition-colors">×</button>
                      </Reorder.Item>
                    )
                  })}
                </Reorder.Group>
              )}
            </div>

            {/* actions */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {adding ? (
                <div className="w-full">
                  <ProductSearch compact placeholder={`Add a ${mode} step…`} onSelect={add} autoFocus />
                  <button onClick={() => setAdding(false)} className="mx-auto mt-3 block text-[0.78rem] text-ink2">cancel</button>
                </div>
              ) : (
                <>
                  <button onClick={() => setAdding(true)} className="rounded-full bg-accent px-6 py-2.5 text-[0.82rem] font-medium text-on-accent">
                    + Add a step
                  </button>
                  <button
                    onClick={scan}
                    disabled={scanning || items.length < 2}
                    className="rounded-full border border-gold2 px-6 py-2.5 text-[0.82rem] text-gold2 hover:bg-gold2 hover:text-bg transition-colors disabled:opacity-40"
                  >
                    {scanning ? 'Scanning…' : 'Check for conflicts'}
                  </button>
                  <button onClick={exportRoutine} className="rounded-full border border-line px-6 py-2.5 text-[0.82rem] text-ink2 hover:text-ink transition-colors">
                    Export
                  </button>
                </>
              )}
            </div>

            <AnimatePresence>
              {conflicts != null && !scanning && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: ease.silk }}
                  className="mt-6 text-center text-[0.85rem] italic"
                  style={{ fontFamily: 'var(--font-display)', color: conflicts.length ? 'var(--amber)' : 'var(--accent)' }}
                >
                  {conflicts.length
                    ? `${conflicts.length} quarrel${conflicts.length > 1 ? 's' : ''} found — marked amber above.`
                    : 'Your ritual is in harmony. Every step agrees.'}
                </motion.p>
              )}
            </AnimatePresence>

            <PhotoCheckin userId={session.user.id} />
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}

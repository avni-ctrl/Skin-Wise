import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useReducedMotion, useIsMobile } from '../lib/usePrefs'
import { ease } from '../lib/easing'

// The dive: one smooth camera move into her cheek, then four held stations —
// epidermis, dermis, subcutaneous, muscle — each with what it absorbs. The
// scroll is spring-smoothed so every hand-off feels like silk, not slides.
const SHOT0 = '/images/dive-0.jpg'
const SHOT1 = '/images/dive-1.jpg'
const SHOT2 = '/images/dive-2.jpg'
const SHOT3 = '/images/dive-3.jpg'
const SHOT4 = '/images/dive-4.jpg'

// Station captions — straight from the layer artwork.
const STATIONS = [
  { name: 'Epidermis', absorbs: 'Water · Moisture', note: 'The protective barrier. Locks moisture in and shields from damage.', io: [0.25, 0.29, 0.4, 0.44] },
  { name: 'Dermis', absorbs: 'Skincare actives · Hydration', note: 'Collagen, elastin and blood vessels that keep skin firm and plump.', io: [0.45, 0.49, 0.58, 0.62] },
  { name: 'Subcutaneous', absorbs: 'Oils · Lipid-soluble ingredients', note: 'The fat layer — cushions, contours and anchors everything above.', io: [0.63, 0.67, 0.76, 0.8] },
  { name: 'Muscle', absorbs: 'Very large molecules — minimal', note: 'The deepest layer. Movement, expression, and where absorption ends.', io: [0.81, 0.85, 0.95, 0.99] },
]

const RAIL = [
  ['Epidermis', 0.25, 0.44],
  ['Dermis', 0.44, 0.62],
  ['Subcutaneous', 0.62, 0.8],
  ['Muscle', 0.8, 1],
]

const DIVE_QUOTES = [
  'Your skin is a story — we just help you read it.',
  'Your barrier remembers everything.',
  'Glow is chemistry keeping its promises.',
  'The best product is the one your skin finishes.',
  'Beauty is depth. So is skincare.',
]

function HeroStage({ progress, session, reduced }) {
  const opacity = useTransform(progress, [0, 0.06, 0.12], [1, 1, 0])
  const y = useTransform(progress, [0, 0.12], [0, reduced ? 0 : -70])
  const [qi, setQi] = useState(() => Math.floor(Math.random() * DIVE_QUOTES.length))

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setQi((i) => (i + 1) % DIVE_QUOTES.length), 7000)
    return () => clearInterval(id)
  }, [reduced])

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center">
      <motion.p
        initial={{ opacity: 0, letterSpacing: '0.5em' }}
        animate={{ opacity: 1, letterSpacing: '0.34em' }}
        transition={{ duration: 1.2, delay: 0.1, ease: ease.silk }}
        className="mb-7 text-[0.72rem] uppercase md:text-[0.82rem]"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: '#EBD9A0' }}
      >
        Skincare intelligence · Made for Indian skin
      </motion.p>
      <h1 className="headline text-[3rem] leading-[1.04] md:text-[5rem]" style={{ color: '#FBF9F6' }}>
        {[
          <>Know your <em style={{ color: '#EBD9A0' }}>Skin,</em></>,
          <>Know your <em style={{ color: '#EBD9A0' }}>Products.</em></>,
        ].map((line, i) => (
          <motion.span
            key={i}
            className="block"
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35 + i * 0.18, ease: ease.silk }}
          >
            {line}
          </motion.span>
        ))}
      </h1>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.9, ease: ease.silk }}
        className="mt-10 flex flex-wrap items-center justify-center gap-7"
      >
        <Link
          to={session ? '/skin-garden' : '/build'}
          className="btn-shimmer rounded-full px-8 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] transition hover:opacity-90"
          style={{ fontFamily: 'var(--font-head)', background: '#FBF9F6', color: '#1C3F30' }}
        >
          {session ? 'Open your ritual' : 'Discover your skin'}
        </Link>
        <Link
          to="/formula-lab"
          className="link-line text-[0.72rem] uppercase tracking-[0.18em]"
          style={{ fontFamily: 'var(--font-head)', fontWeight: 500, color: '#FBF9F6' }}
        >
          Check a product
        </Link>
      </motion.div>

      <div className="mt-11 grid min-h-[2.6rem] place-items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={qi}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.7, ease: ease.silk }}
            className="max-w-md text-[1.02rem] italic"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 500, color: '#EBD9A0' }}
          >
            &ldquo;{DIVE_QUOTES[qi]}&rdquo;
          </motion.p>
        </AnimatePresence>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[0.62rem] uppercase tracking-[0.34em]"
        style={{ fontFamily: 'var(--font-head)', color: 'rgba(251,249,246,0.75)' }}
      >
        Scroll — descend through skin
        <motion.span
          aria-hidden="true"
          className="mx-auto mt-3 block h-8 w-px"
          style={{ background: '#C9A227', transformOrigin: 'top' }}
          animate={reduced ? undefined : { scaleY: [0.2, 1, 0.2], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.p>
    </motion.div>
  )
}

// One held station of the descent. Settles gently (1.05 → 1), holds perfectly
// still while its caption reads, then drifts up to 1.1 as the next arrives —
// no violent zooms, just breath.
function Station({ progress, src, alt, z, io, exit = true }) {
  const [inA, inB, outA, outB] = io
  const opacity = useTransform(progress, exit ? [inA, inB, outA, outB] : [inA, inB, 1, 1], [0, 1, 1, exit ? 0 : 1])
  const scale = useTransform(progress, [inA, inB + 0.04, outA, outB], [1.06, 1, 1, exit ? 1.1 : 1.04])
  return (
    <motion.img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ opacity, scale, zIndex: z, transformOrigin: '42% 52%', willChange: 'transform, opacity' }}
    />
  )
}

// The absorb card — glassy, right side, one per station.
function AbsorbCard({ progress, s }) {
  const [a, b, c, d] = s.io
  const opacity = useTransform(progress, [a, b, c, d], [0, 1, 1, 0])
  const y = useTransform(progress, [a, b], [30, 0])
  return (
    <motion.div style={{ opacity, y }} className="absolute right-5 top-1/2 z-20 w-[290px] -translate-y-1/2 md:right-12 md:w-[330px]">
      <div
        className="rounded-[1.5rem] border p-6 backdrop-blur-md"
        style={{ borderColor: 'rgba(201,162,39,0.35)', background: 'rgba(251,249,246,0.72)', boxShadow: '0 24px 60px -24px rgba(28,63,48,0.35)' }}
      >
        <p className="text-[0.62rem] uppercase tracking-[0.32em]" style={{ fontFamily: 'var(--font-head)', color: '#A99148' }}>
          this deep, skin absorbs
        </p>
        <h3 className="mt-2 text-[1.7rem] leading-none" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: '#1C3F30' }}>
          {s.name}
        </h3>
        <p className="mt-3 text-[0.88rem] font-medium" style={{ fontFamily: 'var(--font-head)', color: '#1C3F30' }}>
          {s.absorbs}
        </p>
        <p className="mt-2 text-[0.82rem] leading-relaxed" style={{ color: '#5c5a52' }}>
          {s.note}
        </p>
      </div>
    </motion.div>
  )
}

function RailStop({ progress, label, start, end, i }) {
  const lo = Math.max(0, start - 0.03)
  const hi = Math.min(1, end + 0.03)
  const stops = [lo, Math.min(start, hi - 0.002), Math.min(end, hi - 0.001), hi]
  const active = useTransform(progress, stops, [0.3, 1, 1, 0.3])
  const grow = useTransform(progress, stops, [1, 1.7, 1.7, 1])
  return (
    <div className="flex items-center gap-3">
      <motion.span style={{ opacity: active, scale: grow, background: '#C9A227' }} className="block h-1.5 w-1.5 rounded-full" />
      <motion.span
        style={{ opacity: active, fontFamily: 'var(--font-head)', color: '#EBD9A0' }}
        className="text-[0.56rem] uppercase tracking-[0.3em]"
      >
        {`0${i + 1} ${label}`}
      </motion.span>
    </div>
  )
}

function DiveFallback({ session }) {
  return (
    <section aria-label="Descending through the layers of skin">
      <div className="relative flex h-[88vh] items-end overflow-hidden">
        <img src={SHOT0} alt="A luminous close portrait — bare, healthy skin" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: 'center 30%' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(22,48,36,0.35), rgba(22,48,36,0.05) 40%, rgba(22,48,36,0.72))' }} />
        <div className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pb-16 text-center">
          <p className="mb-4 text-[0.72rem] uppercase tracking-[0.3em]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: '#EBD9A0' }}>
            Skincare intelligence · Made for Indian skin
          </p>
          <h1 className="headline text-[2.6rem] leading-[1.05]" style={{ color: '#FBF9F6' }}>
            Know your <em style={{ color: '#EBD9A0' }}>Skin,</em><br />Know your <em style={{ color: '#EBD9A0' }}>Products.</em>
          </h1>
          <Link
            to={session ? '/skin-garden' : '/build'}
            className="mt-8 inline-block rounded-full px-8 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.18em]"
            style={{ fontFamily: 'var(--font-head)', background: '#FBF9F6', color: '#1C3F30' }}
          >
            {session ? 'Open your ritual' : 'Discover your skin'}
          </Link>
        </div>
      </div>
      {[[SHOT1, 'The epidermis — absorbs water and moisture'], [SHOT2, 'The dermis — absorbs skincare actives and hydration'], [SHOT3, 'The subcutaneous fat layer — absorbs oils'], [SHOT4, 'The muscle layer — where absorption ends']].map(([src, alt]) => (
        <img key={src} src={src} alt={alt} className="w-full" loading="lazy" />
      ))}
    </section>
  )
}

export default function SkinDive({ session }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const mobile = useIsMobile()

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  // Silk: everything below reads from the spring, not the raw scroll.
  const p = useSpring(scrollYProgress, { stiffness: 82, damping: 24, restDelta: 0.0005 })

  // The entry: push into her cheek until skin fills the frame, then hand off.
  const p0Scale = useTransform(p, [0.05, 0.28], [1, 2.7])
  const p0Opacity = useTransform(p, [0, 0.21, 0.29], [1, 1, 0])
  const scrim = useTransform(p, [0, 0.08, 0.18], [1, 0.85, 0])

  // Muscle finale — a slow push into the full stack's muscle rows.
  const s4Opacity = useTransform(p, [0.79, 0.85], [0, 1])
  const s4Scale = useTransform(p, [0.79, 0.86, 0.92, 1], [1.06, 1, 1, 1.22])

  const washOpacity = useTransform(p, [0.94, 1], [0, 0.9])
  const closeOpacity = useTransform(p, [0.95, 0.995], [0, 1])
  const closeY = useTransform(p, [0.95, 1], [26, 0])

  if (reduced || mobile) return <DiveFallback session={session} />

  return (
    <section ref={ref} aria-label="A guided descent through the layers of skin" className="relative" style={{ height: '640vh' }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ background: '#D8CFC2' }}>
        {/* Stations 1–3: epidermis, dermis, subcutaneous */}
        <Station progress={p} src={SHOT1} alt="Inside the cheek — the epidermis" z={4} io={[0.2, 0.27, 0.43, 0.48]} />
        <Station progress={p} src={SHOT2} alt="Deeper — the dermis beneath the epidermis" z={3} io={[0.43, 0.48, 0.61, 0.66]} />
        <Station progress={p} src={SHOT3} alt="Deeper still — the subcutaneous fat layer" z={2} io={[0.61, 0.66, 0.79, 0.85]} />
        {/* Station 4 — the full stack down to muscle; holds to the end */}
        <motion.img
          src={SHOT4}
          alt="The deepest layer — muscle, where absorption ends"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: s4Opacity, scale: s4Scale, zIndex: 1, transformOrigin: '44% 60%', willChange: 'transform, opacity' }}
        />

        {/* The portrait we enter through */}
        <motion.img
          src={SHOT0}
          alt="A luminous close portrait — bare, healthy skin catching the light"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: p0Opacity, scale: p0Scale, zIndex: 10, transformOrigin: '60% 48%', objectPosition: 'center 32%', willChange: 'transform, opacity' }}
        />
        <motion.div style={{ opacity: scrim, zIndex: 11 }} className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(22,48,36,0.42) 0%, rgba(22,48,36,0.06) 34%, rgba(22,48,36,0.12) 60%, rgba(22,48,36,0.6) 100%)' }} />
        </motion.div>

        {/* absorb cards — one per station */}
        {STATIONS.map((s) => (
          <AbsorbCard key={s.name} progress={p} s={s} />
        ))}

        {/* closing wash + line */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: washOpacity, zIndex: 20, background: 'linear-gradient(180deg, transparent 25%, rgba(22,48,36,0.9) 100%)' }}
          className="pointer-events-none absolute inset-0"
        />
        <motion.div style={{ opacity: closeOpacity, y: closeY, zIndex: 30 }} className="pointer-events-none absolute inset-x-0 bottom-14 text-center">
          <p className="text-[1.6rem] italic md:text-[2.2rem]" style={{ fontFamily: 'var(--font-display)', fontWeight: 500, color: '#FBF9F6' }}>
            Beauty is <em style={{ color: '#EBD9A0' }}>depth.</em> So is skincare.
          </p>
        </motion.div>

        <HeroStage progress={p} session={session} reduced={reduced} />

        {/* depth rail */}
        <div className="absolute left-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-5 md:flex lg:left-10">
          {RAIL.map(([label, s, e], i) => (
            <RailStop key={label} progress={p} label={label} start={s} end={e} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

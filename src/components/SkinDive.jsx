import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import BottleSprite from './BottleSprite'
import { useReducedMotion, useIsMobile, isCapableDevice } from '../lib/usePrefs'
import { ease } from '../lib/easing'

const DiveScene = lazy(() => import('./DiveScene'))

// ---- The dive script: what each depth of skin holds, and which SkinWise
// formulas work there. Progress 0→1 runs surface → dermis over ~5 screens.
const LAYERS = [
  {
    id: 'epidermis',
    depth: '0.1 mm · stratum corneum',
    title: ['The', 'surface'],
    copy: 'Tone, texture and glow are decided here, in a film of cells thinner than paper. Cleansers, exfoliants and sunscreen do their whole job at this depth — they never need to go deeper.',
    bottles: [
      { variant: 'pump', glass: 'cream', ingredient: 'SPF 50', sub: 'Mineral shield' },
      { variant: 'dropper', glass: 'amber', ingredient: 'AHA 5%', sub: 'Glow exfoliant' },
    ],
    dark: false,
    align: 'left',
  },
  {
    id: 'barrier',
    depth: '0.5 mm · lipid barrier',
    title: ['The', 'wall'],
    copy: 'A mortar of ceramides and fatty acids that keeps water in and irritants out. Over-exfoliate or stack too many actives, and this is the wall that cracks first.',
    bottles: [
      { variant: 'jar', glass: 'cream', ingredient: 'Ceramides', sub: 'Barrier balm' },
      { variant: 'dropper', glass: 'sage', ingredient: 'Squalane', sub: 'Lipid mimic' },
    ],
    dark: false,
    align: 'right',
  },
  {
    id: 'hydration',
    depth: '1.5 mm · hydration layer',
    title: ['The', 'reservoir'],
    copy: 'Humectants work here — hyaluronic acid and glycerin pulling water upward and holding it like a sponge. When this layer runs dry, every layer above it shows it.',
    bottles: [
      { variant: 'dropper', glass: 'sage', ingredient: 'Hyaluronic', sub: '2% + B5' },
      { variant: 'tube', glass: 'cream', ingredient: 'Glycerin', sub: 'Water gel' },
    ],
    dark: false,
    align: 'left',
  },
  {
    id: 'dermis',
    depth: '3 mm · dermis',
    title: ['The', 'engine room'],
    copy: 'Collagen and elastin are built down here. Retinoids and peptides send their signals this deep — which is why what you layer tonight shows up months from now, not tomorrow.',
    bottles: [
      { variant: 'dropper', glass: 'amber', ingredient: 'Retinol', sub: '0.3% slow-release' },
      { variant: 'pump', glass: 'emerald', ingredient: 'Peptides', sub: 'Collagen signal' },
    ],
    dark: true,
    align: 'right',
  },
]

const RAIL = ['Surface', 'Barrier', 'Hydration', 'Dermis']

const DIVE_QUOTES = [
  'Your skin is a story — we just help you read it.',
  'Your barrier remembers everything.',
  'Glow is chemistry keeping its promises.',
  'The best product is the one your skin finishes.',
]

// Hero slide — fades and lifts away as the dive begins
function HeroStage({ progress, session, reduced }) {
  const opacity = useTransform(progress, [0, 0.1, 0.17], [1, 1, 0])
  const y = useTransform(progress, [0, 0.17], [0, reduced ? 0 : -90])
  const [qi, setQi] = useState(() => Math.floor(Math.random() * DIVE_QUOTES.length))

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setQi((i) => (i + 1) % DIVE_QUOTES.length), 7000)
    return () => clearInterval(id)
  }, [reduced])

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.1 }}
        className="tag-caps mb-8"
        style={{ fontFamily: 'var(--font-head)' }}
      >
        Skincare intelligence · Made for Indian skin
      </motion.p>
      <h1 className="headline text-[3rem] leading-[1.04] md:text-[5rem]">
        {[
          <>True to your <em>skin,</em></>,
          <>wise to every <em>formula.</em></>,
        ].map((line, i) => (
          <motion.span
            key={i}
            className="block"
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25 + i * 0.18, ease: ease.silk }}
          >
            {line}
          </motion.span>
        ))}
      </h1>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.75, ease: ease.silk }}
        className="mt-10 flex flex-wrap items-center justify-center gap-7"
      >
        <Link
          to={session ? '/skin-garden' : '/build'}
          className="rounded-full bg-ink px-8 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-bg transition hover:opacity-90"
          style={{ fontFamily: 'var(--font-head)' }}
        >
          {session ? 'Open your ritual' : 'Discover your skin'}
        </Link>
        <Link
          to="/formula-lab"
          className="link-line text-[0.72rem] uppercase tracking-[0.18em] text-ink"
          style={{ fontFamily: 'var(--font-head)', fontWeight: 500 }}
        >
          Check a product
        </Link>
      </motion.div>

      {/* rotating house quote, part of the slide */}
      <div className="mt-12 grid min-h-[2.6rem] place-items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={qi}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.7, ease: ease.silk }}
            className="max-w-md text-[1.02rem] italic text-gold2"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}
          >
            &ldquo;{DIVE_QUOTES[qi]}&rdquo;
          </motion.p>
        </AnimatePresence>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[0.62rem] uppercase tracking-[0.34em] text-ink2"
        style={{ fontFamily: 'var(--font-head)' }}
      >
        Scroll — descend through skin
        <motion.span
          aria-hidden="true"
          className="mx-auto mt-3 block h-8 w-px bg-gold"
          animate={reduced ? undefined : { scaleY: [0.2, 1, 0.2], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: 'top' }}
        />
      </motion.p>
    </motion.div>
  )
}

// One narrated layer of the dive
function LayerStage({ progress, layer, start, end }) {
  const mid = (start + end) / 2
  const fade = Math.min(0.09, (end - start) / 2.2)
  const opacity = useTransform(progress, [start, start + fade, end - fade, end], [0, 1, 1, 0])
  const y = useTransform(progress, [start, mid, end], [70, 0, -70])
  const ink = layer.dark ? '#FBF9F6' : '#1C3F30'
  const sub = layer.dark ? 'rgba(251,249,246,0.72)' : '#5c5a52'

  return (
    <motion.div
      style={{ opacity, y }}
      className={`absolute inset-0 z-10 flex items-center px-6 md:px-20 ${
        layer.align === 'right' ? 'justify-end md:pr-32' : 'justify-start md:pl-32'
      }`}
    >
      <div className="flex max-w-xl flex-col gap-8 md:flex-row md:items-center md:gap-12">
        <div>
          <p className="tag-caps mb-5" style={{ fontFamily: 'var(--font-head)', color: '#C9A227' }}>
            {layer.depth}
          </p>
          <h2 className="headline text-[2.4rem] md:text-[3.6rem]" style={{ color: ink }}>
            {layer.title[0]} <em style={{ color: '#C9A227' }}>{layer.title[1]}</em>
          </h2>
          <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed" style={{ color: sub }}>
            {layer.copy}
          </p>
        </div>
        <div className="shrink-0">
          <div className="flex h-36 items-end gap-4 md:h-44">
            {layer.bottles.map((b, i) => (
              <BottleSprite key={b.ingredient} {...b} delay={i * 0.9} className="h-full" />
            ))}
          </div>
          <p
            className="mt-3 text-center text-[0.58rem] uppercase tracking-[0.26em]"
            style={{ fontFamily: 'var(--font-head)', color: '#A99148' }}
          >
            Works at this depth
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function RailStop({ progress, label, start, end, i }) {
  // keyframe offsets must stay inside [0,1] for WAAPI
  const lo = Math.max(0, start - 0.03)
  const hi = Math.min(1, end + 0.03)
  const stops = [lo, Math.min(start, hi - 0.002), Math.min(end, hi - 0.001), hi]
  const active = useTransform(progress, stops, [0.35, 1, 1, 0.35])
  const grow = useTransform(progress, stops, [1, 1.6, 1.6, 1])
  return (
    <div className="flex items-center gap-3">
      <motion.span
        style={{ opacity: active, scale: grow }}
        className="block h-1.5 w-1.5 rounded-full bg-gold"
      />
      <motion.span
        style={{ opacity: active, fontFamily: 'var(--font-head)' }}
        className="text-[0.58rem] uppercase tracking-[0.3em] text-gold2"
      >
        {`0${i + 1} ${label}`}
      </motion.span>
    </div>
  )
}

// Stage windows along scroll progress
const STAGES = [
  [0.2, 0.4],
  [0.4, 0.59],
  [0.59, 0.78],
  [0.78, 0.985],
]

export default function SkinDive({ session }) {
  const ref = useRef(null)
  const progressRef = useRef(0)
  const reduced = useReducedMotion()
  const mobile = useIsMobile()
  const [use3D, setUse3D] = useState(false)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    progressRef.current = v
  })

  useEffect(() => {
    setUse3D(!reduced && !mobile && isCapableDevice())
  }, [reduced, mobile])

  // The world re-lights as you sink: cream → champagne → sage → emerald.
  const bg = useTransform(
    scrollYProgress,
    [0, 0.2, 0.3, 0.5, 0.68, 0.84, 1],
    ['#FBF9F6', '#F7F0E1', '#F0E5CB', '#E3D3A9', '#B9CCBC', '#224836', '#1C3F30']
  )
  // 2D fallback drift (mobile / reduced motion)
  const fallbackY = useTransform(scrollYProgress, [0, 1], ['0%', '-55%'])

  return (
    <section ref={ref} aria-label="A guided descent through the layers of skin" className="relative" style={{ height: '520vh' }}>
      <motion.div style={{ backgroundColor: bg }} className="sticky top-0 h-screen w-full overflow-hidden">
        {use3D ? (
          <Suspense fallback={null}>
            <DiveScene progressRef={progressRef} />
          </Suspense>
        ) : (
          <motion.div aria-hidden="true" style={{ y: fallbackY }} className="absolute -inset-x-20 top-0 h-[300%]">
            <div className="absolute left-[8%] top-[6%] h-[34%] w-[60%] rounded-full opacity-50 blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(232,221,200,0.9), transparent)' }} />
            <div className="absolute right-[4%] top-[30%] h-[30%] w-[55%] rounded-full opacity-40 blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(201,162,39,0.55), transparent)' }} />
            <div className="absolute left-[12%] top-[56%] h-[30%] w-[58%] rounded-full opacity-45 blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(122,154,130,0.7), transparent)' }} />
            <div className="absolute right-[10%] top-[78%] h-[26%] w-[50%] rounded-full opacity-50 blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(28,63,48,0.8), transparent)' }} />
          </motion.div>
        )}

        <HeroStage progress={scrollYProgress} session={session} reduced={reduced} />

        {LAYERS.map((layer, i) => (
          <LayerStage key={layer.id} progress={scrollYProgress} layer={layer} start={STAGES[i][0]} end={STAGES[i][1]} />
        ))}

        {/* depth rail — where you are inside the skin */}
        <div className="absolute left-5 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-5 md:flex lg:left-10">
          {RAIL.map((label, i) => (
            <RailStop key={label} progress={scrollYProgress} label={label} start={STAGES[i][0]} end={STAGES[i][1]} i={i} />
          ))}
        </div>
      </motion.div>
    </section>
  )
}

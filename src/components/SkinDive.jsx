import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { useReducedMotion, useIsMobile } from '../lib/usePrefs'
import { ease } from '../lib/easing'

// The hero is built from the brand's own renders. The camera pushes *through*
// the portrait's skin, and the "Layers of Skin" poster arrives as a real
// object in depth — a stack you fly down through, other faces adrift behind it.
const PORTRAIT = '/images/portrait-hero.png'
const LAYERS = '/images/skin-layers.png'
const FACES = ['/images/portrait-freckle.png', '/images/portrait-man.png', '/images/portrait-glow.png']

// Five strata — surfaced as champagne cues on the right as the scan passes each.
const STRATA = [
  { name: 'Epidermis', note: 'Locks moisture in' },
  { name: 'Dermis', note: 'Collagen & firmness' },
  { name: 'Hypodermis', note: 'Cushions & contours' },
  { name: 'Subcutaneous', note: 'Anchors it all' },
  { name: 'Muscle', note: 'Movement & expression' },
]

const DIVE_QUOTES = [
  'Your skin is a story — we just help you read it.',
  'Your barrier remembers everything.',
  'Glow is chemistry keeping its promises.',
  'The best product is the one your skin finishes.',
  'Beauty is depth. So is skincare.',
]

// Faces adrift in the deep — position (%), base depth, and drift signature.
const FACE_CFG = [
  { left: '6%', top: '16%', z: -820, rotY: 12, w: 150, rise: -140 },
  { left: '80%', top: '24%', z: -640, rotY: -14, w: 172, rise: -220 },
  { left: '68%', top: '60%', z: -900, rotY: -9, w: 132, rise: -100 },
]

const BUBBLES = [
  { left: '12%', size: 78, dur: 15, delay: 0, z: 180 },
  { left: '24%', size: 40, dur: 12, delay: 2, z: 120 },
  { left: '82%', size: 110, dur: 18, delay: 1, z: 220 },
  { left: '90%', size: 54, dur: 13, delay: 3, z: 90 },
  { left: '58%', size: 30, dur: 11, delay: 5, z: 260 },
]

// ---- Hero slide: tagline leads, then the headline, CTA and rotating quote.
function HeroStage({ progress, session, reduced }) {
  const opacity = useTransform(progress, [0, 0.08, 0.15], [1, 1, 0])
  const y = useTransform(progress, [0, 0.15], [0, reduced ? 0 : -70])
  const [qi, setQi] = useState(() => Math.floor(Math.random() * DIVE_QUOTES.length))

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setQi((i) => (i + 1) % DIVE_QUOTES.length), 7000)
    return () => clearInterval(id)
  }, [reduced])

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center"
    >
      {/* first line — the tagline */}
      <motion.p
        initial={{ opacity: 0, letterSpacing: '0.5em' }}
        animate={{ opacity: 1, letterSpacing: '0.34em' }}
        transition={{ duration: 1.2, delay: 0.1, ease: ease.silk }}
        className="mb-7 text-[0.72rem] uppercase md:text-[0.82rem]"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.34em', color: '#EBD9A0' }}
      >
        Know your Skin. Know your Products.
      </motion.p>
      <h1 className="headline text-[3rem] leading-[1.04] md:text-[5rem]" style={{ color: '#FBF9F6' }}>
        {[
          <>True to your <em style={{ color: '#EBD9A0' }}>skin,</em></>,
          <>wise to every <em style={{ color: '#EBD9A0' }}>formula.</em></>,
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

// A face floating in the deep — parallax rise + gentle turn as you descend.
function FaceCard({ progress, src, cfg }) {
  const opacity = useTransform(progress, [0.2, 0.36, 0.86, 0.98], [0, 0.5, 0.5, 0])
  const y = useTransform(progress, [0.2, 1], ['0vh', `${cfg.rise / 10}vh`])
  const z = useTransform(progress, [0.2, 1], [cfg.z, cfg.z + 260])
  return (
    <motion.div
      aria-hidden="true"
      className="absolute overflow-hidden rounded-[14px]"
      style={{
        left: cfg.left,
        top: cfg.top,
        width: cfg.w,
        opacity,
        y,
        z,
        rotateY: cfg.rotY,
        filter: 'blur(1.5px) saturate(0.9)',
        border: '1px solid rgba(201,162,39,0.28)',
        boxShadow: '0 30px 70px -30px rgba(28,63,48,0.55)',
      }}
    >
      <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" style={{ aspectRatio: '3 / 4' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(28,63,48,0.05), rgba(28,63,48,0.42))' }} />
    </motion.div>
  )
}

// Champagne cue pill for one stratum — surfaces as the scan passes its band.
function LayerCue({ progress, stratum, start, end }) {
  const fade = Math.min(0.05, (end - start) / 3)
  const opacity = useTransform(progress, [start, start + fade, end - fade, end], [0, 1, 1, 0])
  const x = useTransform(progress, [start, start + fade], [26, 0])
  return (
    <motion.div style={{ opacity, x }} className="absolute right-6 top-1/2 -translate-y-1/2 lg:right-14">
      <div
        className="rounded-full border px-5 py-2.5 backdrop-blur-sm"
        style={{ borderColor: 'rgba(201,162,39,0.4)', background: 'rgba(251,249,246,0.55)' }}
      >
        <p className="text-[0.62rem] uppercase tracking-[0.28em]" style={{ fontFamily: 'var(--font-head)', color: '#1C3F30', fontWeight: 600 }}>
          {stratum.name}
        </p>
        <p className="mt-0.5 text-[0.82rem] italic" style={{ fontFamily: 'var(--font-display)', color: '#A99148' }}>
          {stratum.note}
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
        style={{ opacity: active, fontFamily: 'var(--font-head)', color: '#A99148' }}
        className="text-[0.56rem] uppercase tracking-[0.3em]"
      >
        {`0${i + 1} ${label}`}
      </motion.span>
    </div>
  )
}

// ---- Reduced-motion / mobile fallback: no pinning, a clean stack.
function DiveFallback({ session }) {
  return (
    <section aria-label="The layers of skin">
      <div className="relative flex h-[88vh] items-end overflow-hidden">
        <img src={PORTRAIT} alt="A luminous, close portrait — bare, healthy skin" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: 'center 30%' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(22,48,36,0.35), rgba(22,48,36,0.05) 40%, rgba(22,48,36,0.72))' }} />
        <div className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pb-16 text-center">
          <p className="mb-4 text-[0.72rem] uppercase tracking-[0.3em]" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: '#EBD9A0' }}>
            Know your Skin. Know your Products.
          </p>
          <h1 className="headline text-[2.6rem] leading-[1.05]" style={{ color: '#FBF9F6' }}>
            True to your <em style={{ color: '#EBD9A0' }}>skin,</em><br />wise to every <em style={{ color: '#EBD9A0' }}>formula.</em>
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
      <div className="bg-bg py-12 text-center">
        <img src={LAYERS} alt="The five layers of skin, from epidermis to muscle" className="mx-auto w-full max-w-[520px] px-6" loading="lazy" />
      </div>
    </section>
  )
}

export default function SkinDive({ session }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const mobile = useIsMobile()

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  // Portrait — pushed toward the camera, then dissolved into depth-of-field.
  const pZ = useTransform(scrollYProgress, [0, 0.3], [0, 520])
  const pScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.55])
  const pOpacity = useTransform(scrollYProgress, [0, 0.2, 0.3], [1, 1, 0])
  const pBlur = useTransform(scrollYProgress, [0.12, 0.3], ['blur(0px)', 'blur(16px)'])
  const scrimOpacity = useTransform(scrollYProgress, [0, 0.13, 0.24], [1, 0.85, 0])

  // Layers poster — rises out of depth, tilts up to face you, then the frame
  // scans down the stack (title/epidermis → muscle/tagline).
  const posterZ = useTransform(scrollYProgress, [0.14, 0.42], [-760, 0])
  const posterScale = useTransform(scrollYProgress, [0.14, 0.44], [0.82, 1])
  const posterRotX = useTransform(scrollYProgress, [0.14, 0.44, 1], [26, 0, -7])
  const posterRotY = useTransform(scrollYProgress, [0.3, 0.62, 0.95], [-5, 3, -2])
  const posterY = useTransform(scrollYProgress, [0.3, 0.96], ['8vh', '-58vh'])
  const posterOpacity = useTransform(scrollYProgress, [0.14, 0.3, 0.92, 1], [0, 1, 1, 0.85])
  const sheenX = useTransform(scrollYProgress, [0.3, 0.7], ['-40%', '140%'])

  // Closing line as the descent bottoms out.
  const closeOpacity = useTransform(scrollYProgress, [0.9, 0.95, 1], [0, 1, 0.92])
  const closeY = useTransform(scrollYProgress, [0.9, 1], [24, 0])

  // Warm the light mid-descent, then settle — kept in cream/champagne so the
  // poster's own background blends at the gutters.
  const bg = useTransform(scrollYProgress, [0, 0.25, 0.6, 1], ['#FBF9F6', '#F4EAD6', '#EEE2CC', '#F7F1E4'])

  const bandStart = 0.3
  const bandEnd = 0.9
  const bands = STRATA.map((_, i) => {
    const span = (bandEnd - bandStart) / STRATA.length
    return [bandStart + i * span, bandStart + (i + 1) * span]
  })

  if (reduced || mobile) return <DiveFallback session={session} />

  return (
    <section
      ref={ref}
      aria-label="A guided descent through the layers of skin"
      className="relative"
      style={{ height: '560vh' }}
    >
      <motion.div
        style={{ backgroundColor: bg, perspective: '1500px', perspectiveOrigin: '50% 42%' }}
        className="sticky top-0 h-screen w-full overflow-hidden"
      >
        {/* faces adrift in the deep */}
        {FACE_CFG.map((cfg, i) => (
          <FaceCard key={i} progress={scrollYProgress} src={FACES[i]} cfg={cfg} />
        ))}

        {/* the descent through the poster — a real object in Z */}
        <motion.div
          style={{ opacity: posterOpacity, z: posterZ, scale: posterScale, rotateX: posterRotX, rotateY: posterRotY }}
          className="absolute inset-0 z-10 flex justify-center overflow-hidden"
          aria-hidden="true"
        >
          <motion.div style={{ y: posterY }} className="relative h-[164vh] w-auto">
            <img src={LAYERS} alt="" className="h-full w-auto max-w-none object-contain drop-shadow-[0_40px_90px_rgba(28,63,48,0.28)]" />
            {/* champagne specular sweep */}
            <motion.div
              style={{ x: sheenX }}
              className="pointer-events-none absolute inset-y-0 w-1/3"
              aria-hidden="true"
            >
              <div className="h-full w-full" style={{ background: 'linear-gradient(105deg, transparent, rgba(255,247,220,0.5) 50%, transparent)', transform: 'skewX(-14deg)' }} />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* portrait we dive into */}
        <motion.div style={{ opacity: pOpacity, z: pZ, scale: pScale, filter: pBlur }} className="absolute inset-0 z-20">
          <img
            src={PORTRAIT}
            alt="A luminous, close portrait — bare, healthy skin catching the light"
            className="h-full w-full object-cover"
            style={{ objectPosition: 'center 32%' }}
          />
          <motion.div style={{ opacity: scrimOpacity }} className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(22,48,36,0.42) 0%, rgba(22,48,36,0.04) 34%, rgba(22,48,36,0.10) 60%, rgba(22,48,36,0.60) 100%)' }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 80% at 50% 40%, transparent 45%, rgba(22,48,36,0.35) 100%)' }} />
          </motion.div>
        </motion.div>

        {/* foreground champagne bubbles — depth-of-field, closest to camera */}
        <motion.div style={{ opacity: posterOpacity }} className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
          {BUBBLES.map((b, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{
                left: b.left,
                bottom: '-12%',
                width: b.size,
                height: b.size,
                z: b.z,
                filter: 'blur(0.5px)',
                background: 'radial-gradient(circle at 32% 30%, rgba(255,255,255,0.85), rgba(235,217,160,0.30) 45%, rgba(201,162,39,0.10) 70%, transparent 78%)',
                border: '1px solid rgba(201,162,39,0.22)',
              }}
              animate={{ y: ['0vh', '-122vh'], opacity: [0, 0.9, 0.9, 0] }}
              transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, ease: 'easeInOut', times: [0, 0.1, 0.85, 1] }}
            />
          ))}
        </motion.div>

        {/* layer cues on the right */}
        {STRATA.map((s, i) => (
          <LayerCue key={s.name} progress={scrollYProgress} stratum={s} start={bands[i][0]} end={bands[i][1]} />
        ))}

        {/* hero slide */}
        <HeroStage progress={scrollYProgress} session={session} reduced={reduced} />

        {/* depth rail */}
        <div className="absolute left-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-5 md:flex lg:left-10">
          {STRATA.map((s, i) => (
            <RailStop key={s.name} progress={scrollYProgress} label={s.name} start={bands[i][0]} end={bands[i][1]} i={i} />
          ))}
        </div>

        {/* closing line */}
        <motion.div style={{ opacity: closeOpacity, y: closeY }} className="pointer-events-none absolute bottom-16 left-1/2 z-30 -translate-x-1/2 text-center">
          <p className="text-[1.6rem] italic md:text-[2.2rem]" style={{ fontFamily: 'var(--font-display)', fontWeight: 500, color: '#1C3F30' }}>
            Beauty is <em style={{ color: '#C9A227' }}>depth.</em> So is skincare.
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}

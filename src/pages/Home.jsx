import { Suspense, lazy, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import Headline from '../components/Headline'
import AmoebaBlob from '../components/AmoebaBlob'
import LiquidBackdrop from '../components/LiquidBackdrop'
import QuoteStrip from '../components/QuoteStrip'
import Footer from '../components/Footer'
import { FaceLine } from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { useIsMobile, useReducedMotion, isCapableDevice } from '../lib/usePrefs'
import { ease } from '../lib/easing'

const SkinDescent = lazy(() => import('../components/SkinDescent'))

const TOOLS = [
  {
    to: '/formula-lab',
    name: 'Formula Lab',
    line: 'check any product’s ingredients & verdict',
    depth: 'the surface',
    color: '#7A9A82',
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="#FBF9F6" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="16" cy="16" r="4" /><circle cx="33" cy="13" r="3" /><circle cx="24" cy="32" r="5" />
        <path d="M19.5 18.5 21 28M20 15l10-1.5M27.5 29l4.5-13" />
      </svg>
    ),
  },
  {
    to: '/skin-garden',
    name: 'Skin Garden',
    line: 'build your AM/PM routine',
    depth: 'the barrier',
    color: '#1C3F30',
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="#FBF9F6" strokeWidth="1.6" strokeLinecap="round">
        <path d="M24 40V20M24 26c0-6-5-10-11-10 0 6 5 10 11 10zM24 20c0-6 5-10 11-10 0 6-5 10-11 10z" />
      </svg>
    ),
  },
  {
    to: '/product-museum',
    name: 'Product Museum',
    line: 'track your shelf & expiries',
    depth: 'the hydration layer',
    color: '#A99148',
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="#FBF9F6" strokeWidth="1.6" strokeLinecap="round">
        <path d="M19 12h10M21 12v6l-6 5v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V23l-6-5v-6" />
        <path d="M15 30h18" />
      </svg>
    ),
  },
  {
    to: '/find-a-dupe',
    name: 'Find a Dupe',
    line: 'cheaper matches for what you love',
    depth: 'the dermis',
    color: '#C9A227',
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="#FBF9F6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 8l5 9 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" />
      </svg>
    ),
  },
]

function ToolSection({ tool, i }) {
  return (
    <section className="relative flex min-h-[92vh] items-center">
      <div className={`mx-auto flex w-full max-w-[1100px] flex-col items-center gap-8 px-6 md:flex-row md:gap-16 ${i % 2 ? 'md:flex-row-reverse' : ''}`}>
        <Link to={tool.to} data-cursor className="group">
          <motion.div whileHover={{ y: -6, scale: 1.03 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
            <AmoebaBlob color={tool.color} size={170}>
              {tool.icon}
            </AmoebaBlob>
          </motion.div>
        </Link>
        <div className="max-w-md text-center md:text-left">
          <p className="tag-caps mb-3">
            descending · {tool.depth}
          </p>
          <h2 className="headline text-[2rem] md:text-[2.8rem]">
            <Link to={tool.to} className="hover:opacity-80 transition-opacity">
              {tool.name}
            </Link>
          </h2>
          <p className="mt-3 text-[0.95rem] text-ink2">{tool.line}</p>
          <Link
            to={tool.to}
            className="mt-6 inline-block rounded-full border border-line px-6 py-2.5 text-[0.82rem] text-ink hover:border-gold2 hover:text-gold2 transition-colors"
          >
            Step inside →
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { session, profile } = useAuth()
  const mobile = useIsMobile()
  const reduced = useReducedMotion()
  const use3D = !mobile && !reduced && isCapableDevice()

  const descentRef = useRef(null)
  const progressRef = useRef(0)
  const { scrollYProgress } = useScroll({ target: descentRef, offset: ['start start', 'end end'] })
  useEffect(() => scrollYProgress.on('change', (v) => (progressRef.current = v)), [scrollYProgress])

  // 2D parallax fallback strata (mobile / reduced motion / low-capability)
  const l1 = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])
  const l2 = useTransform(scrollYProgress, [0, 1], ['0%', '-38%'])
  const l3 = useTransform(scrollYProgress, [0, 1], ['0%', '-62%'])

  const { scrollY } = useScroll()
  const heroLift = useTransform(scrollY, [0, 500], [0, -110])
  const heroFade = useTransform(scrollY, [0, 420], [1, 0])
  const blobDrift = useTransform(scrollY, [0, 600], [1, 1.25])

  return (
    <div>
      {/* ---- 6.1 HERO ---- */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {!reduced && (
          <motion.div className="absolute inset-0" style={{ scale: blobDrift, opacity: heroFade }}>
            <LiquidBackdrop className="opacity-70" />
          </motion.div>
        )}
        <motion.div
          className="relative z-10 mx-auto max-w-[900px] px-6 pt-24 text-center"
          style={{ y: heroLift, opacity: heroFade }}
        >
          <div className="mx-auto mb-6 w-16 md:w-20">
            <FaceLine draw delay={0.2} className="w-full" />
          </div>
          <Headline
            size="hero"
            lines={[
              ['Know your', 'skin', '.'],
              ['Know your', 'products', '.'],
            ]}
          />
          <p className="mx-auto mt-6 max-w-md text-[0.95rem] leading-relaxed text-ink2">
            AI-powered skincare intelligence — tuned to your skin, your city, your climate.
          </p>
          <Link to={session ? '/skin-garden' : '/build'} data-cursor>
            <motion.span
              className="mt-10 inline-block rounded-[2.2rem] bg-accent px-9 py-4 text-[0.9rem] font-medium text-on-accent shadow-[var(--shadow)]"
              style={{
                borderRadius: '58% 42% 55% 45% / 48% 55% 45% 52%',
                animation: reduced ? 'none' : 'breathe 4.5s ease-in-out infinite',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              {session ? 'Tend your skin garden' : 'Discover your skin profile'}
            </motion.span>
          </Link>
          <motion.p
            className="mt-14 text-[0.68rem] uppercase tracking-[0.3em] text-ink2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 1, ease: ease.silk }}
          >
            scroll to descend through skin
          </motion.p>
        </motion.div>
      </section>

      {/* ---- 6.0 + 6.2 THE DESCENT ---- */}
      <div ref={descentRef} className="relative">
        <div className="pointer-events-none sticky top-0 h-0 z-0">
          <div className="relative h-screen w-full overflow-hidden">
            {use3D ? (
              <Suspense fallback={null}>
                <SkinDescent progressRef={progressRef} />
              </Suspense>
            ) : (
              <>
                <motion.div className="absolute -inset-x-20 top-0 h-[140vh]" style={{ y: l1, background: 'radial-gradient(60% 40% at 30% 30%, rgba(232,221,200,0.35), transparent 70%)' }} />
                <motion.div className="absolute -inset-x-20 top-[30vh] h-[160vh]" style={{ y: l2, background: 'radial-gradient(55% 40% at 70% 40%, rgba(201,162,39,0.16), transparent 70%)' }} />
                <motion.div className="absolute -inset-x-20 top-[70vh] h-[200vh]" style={{ y: l3, background: 'radial-gradient(65% 45% at 45% 50%, rgba(122,154,130,0.22), transparent 70%)' }} />
              </>
            )}
          </div>
        </div>
        <div className="relative z-10">
          {TOOLS.map((tool, i) => (
            <ToolSection key={tool.to} tool={tool} i={i} />
          ))}
        </div>
      </div>

      {/* ---- 6.3 EDITORIAL TRUST BAND ---- */}
      <section className="relative z-10 overflow-hidden py-24 md:py-36">
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(42% 60% at 78% 30%, rgba(201,162,39,0.13), transparent 70%), radial-gradient(50% 70% at 15% 75%, rgba(122,154,130,0.16), transparent 70%)',
            y: useTransform(scrollY, (v) => v * -0.04),
          }}
        />
        <div className="mx-auto max-w-[760px] px-6 text-center">
          <p className="tag-caps mb-6">why it matters</p>
          <p className="text-[1.35rem] md:text-[1.9rem] leading-snug text-ink" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>
            The average routine layers nineteen active ingredients before breakfast.
            Some of them quietly <em className="text-gold2">cancel each other out</em>.
            Reading the label shouldn&rsquo;t need a chemistry degree — that&rsquo;s our job.
          </p>
        </div>
      </section>

      {/* ---- 6.4 PROFILE CTA ---- */}
      <section className="relative z-10 px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: ease.silk }}
          className="mx-auto flex max-w-[860px] flex-col items-center gap-6 rounded-[2.5rem] border border-line bg-card/80 p-10 text-center shadow-[var(--shadow)] backdrop-blur-md md:p-14"
        >
          {session ? (
            <>
              <p className="tag-caps">your profile</p>
              <h3 className="headline text-[1.7rem] md:text-[2.3rem]">
                Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''} — your garden is <em>growing</em>.
              </h3>
              <Link to="/skin-garden" className="rounded-full bg-accent px-7 py-3 text-[0.85rem] font-medium text-on-accent">
                Open today&rsquo;s ritual
              </Link>
            </>
          ) : (
            <>
              <p className="tag-caps">two minutes, once</p>
              <h3 className="headline text-[1.7rem] md:text-[2.3rem]">
                Get your personalized skin profile in <em>2 minutes</em>.
              </h3>
              <p className="max-w-md text-[0.9rem] text-ink2">
                One quiz builds the profile that powers every verdict, conflict check and dupe on the site — saved to your account.
              </p>
              <Link to="/build" className="rounded-full bg-accent px-7 py-3 text-[0.85rem] font-medium text-on-accent">
                Build your profile
              </Link>
            </>
          )}
        </motion.div>
      </section>

      {/* ---- 6.5 QUOTE STRIP + 6.6 FOOTER ---- */}
      <QuoteStrip />
      <Footer />
    </div>
  )
}

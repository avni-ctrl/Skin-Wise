import { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import QuoteStrip from '../components/QuoteStrip'
import Footer from '../components/Footer'
import SkinDive from '../components/SkinDive'
import SpotlightCard from '../components/SpotlightCard'
import { useAuth } from '../context/AuthContext'
import { useReducedMotion, useIsMobile, isCapableDevice } from '../lib/usePrefs'
import { ease } from '../lib/easing'

const GradientOrb = lazy(() => import('../components/GradientOrb'))

const IMG = {
  hype: '/images/portrait-freckle.png',
  portrait: '/images/portrait-glow.png',
}

// The five rooms of the house, presented as one form over the living orb.
const SYSTEMS = [
  {
    n: 'I',
    to: '/formula-lab',
    name: 'Formula Lab',
    copy: 'Search any Indian skincare product — every active decoded, scored Safe, Caution or Avoid for your skin.',
  },
  {
    n: 'II',
    to: '/skin-garden',
    name: 'Skin Garden',
    copy: 'Grow your AM and PM ritual. Every addition is conflict-checked and layered in the right order.',
  },
  {
    n: 'III',
    to: '/product-museum',
    name: 'Product Museum',
    copy: 'Your shelf, curated. Real usable life per product, tuned to your city — oxidised serums get flagged.',
  },
  {
    n: 'IV',
    to: '/find-a-dupe',
    name: 'Find a Dupe',
    copy: 'Love the formula, not the price? We rebuild it from the ingredient list and surface the echoes.',
  },
  {
    n: 'V',
    to: '/formula-lab',
    name: 'Score a Product',
    copy: 'Hype index vs formula truth — what the internet says, against what the ingredient list earns.',
  },
]

const MARQUEE = ['Ingredients decoded', 'Conflicts caught', 'Shelf life tracked', 'Dupes found', 'Made for Indian skin']

// One organic silhouette per system — irregular amoeba shapes, no rectangles.
const AMOEBAS = [
  '58% 42% 55% 45% / 48% 55% 45% 52%',
  '45% 55% 48% 52% / 58% 42% 58% 42%',
  '52% 48% 42% 58% / 45% 52% 48% 55%',
  '42% 58% 55% 45% / 52% 45% 55% 48%',
  '55% 45% 50% 50% / 45% 55% 42% 58%',
]

function Reveal({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.8, delay, ease: ease.silk }}
    >
      {children}
    </motion.div>
  )
}

// Slide two — the brand moment, truekind-style: just the mark, alone on the
// house cream, nothing else competing.
function BrandSlide() {
  return (
    <section className="relative grid min-h-[92vh] place-items-center overflow-hidden bg-bg px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-120px' }}
        transition={{ duration: 1.3, ease: ease.silk }}
        className="relative text-center"
      >
        {/* callout — bottom left: a gold thread out of the wordmark */}
        <div className="pointer-events-none absolute -left-56 bottom-2 hidden w-56 lg:block" aria-hidden="true">
          <svg viewBox="0 0 220 120" fill="none" className="w-full overflow-visible">
            <motion.path
              d="M215 18 C150 30 90 34 40 78"
              stroke="#C9A227"
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.5, ease: 'easeInOut' }}
            />
            <circle cx="40" cy="78" r="3" fill="#C9A227" />
          </svg>
          <p className="mt-2 text-left text-[0.62rem] uppercase tracking-[0.22em]" style={{ fontFamily: 'var(--font-head)', color: '#A99148' }}>
            Conflicts caught
            <span className="mt-1 block normal-case tracking-normal text-ink2" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '0.82rem' }}>
              every routine checked on every add
            </span>
          </p>
        </div>

        {/* callout — top right */}
        <div className="pointer-events-none absolute -right-56 top-0 hidden w-56 lg:block" aria-hidden="true">
          <p className="mb-2 text-right text-[0.62rem] uppercase tracking-[0.22em]" style={{ fontFamily: 'var(--font-head)', color: '#A99148' }}>
            Verdicts for your skin
            <span className="mt-1 block normal-case tracking-normal text-ink2" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '0.82rem' }}>
              Safe · Caution · Avoid — from your quiz
            </span>
          </p>
          <svg viewBox="0 0 220 120" fill="none" className="w-full overflow-visible">
            <motion.path
              d="M5 102 C70 90 130 86 180 42"
              stroke="#C9A227"
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.7, ease: 'easeInOut' }}
            />
            <circle cx="180" cy="42" r="3" fill="#C9A227" />
          </svg>
        </div>

        <img
          src="/images/logo-transparent.png"
          alt="SkinWise — Know your skin, know your products"
          className="mx-auto w-[min(560px,88vw)] dark:brightness-0 dark:invert"
        />
        <p className="mt-10 text-[0.7rem] uppercase tracking-[0.32em] text-ink2" style={{ fontFamily: 'var(--font-head)' }}>
          Skincare intelligence · Made for Indian skin
        </p>
      </motion.div>
    </section>
  )
}

// The systems — one form floating over the living orb.
function SystemsForm() {
  const reduced = useReducedMotion()
  const mobile = useIsMobile()
  const orbOn = !reduced && !mobile && isCapableDevice()

  return (
    <section className="relative overflow-hidden" style={{ background: '#142E23' }}>
      {orbOn && (
        <Suspense fallback={null}>
          <div aria-hidden="true" className="absolute inset-0 opacity-80">
            <GradientOrb />
          </div>
        </Suspense>
      )}
      <div aria-hidden="true" className="absolute inset-0" style={{ background: 'radial-gradient(90% 70% at 50% 45%, transparent 30%, rgba(20,46,35,0.9) 100%)' }} />

      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <Reveal className="text-center">
          <p className="tag-caps mb-5" style={{ fontFamily: 'var(--font-head)', color: '#EBD9A0' }}>
            The system · five rooms, one profile
          </p>
          <h2 className="headline text-[2.2rem] md:text-[3.4rem]" style={{ color: '#FBF9F6' }}>
            Everything your <em style={{ color: '#EBD9A0' }}>skin</em> asked for
          </h2>
        </Reveal>

        <div className="mt-16 grid items-start gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {SYSTEMS.map((s, i) => (
            <Reveal
              key={s.n}
              delay={i * 0.08}
              className={
                ['lg:mt-0', 'lg:mt-16', 'lg:mt-6', 'lg:mt-20 lg:-translate-x-4', 'lg:mt-2 lg:translate-x-6'][i] +
                (i === 4 ? ' sm:col-span-2 lg:col-span-1' : '')
              }
            >
              <SpotlightCard className="h-full" radius={AMOEBAS[i]}>
                <Link
                  to={s.to}
                  data-cursor
                  className="flex h-full min-h-[290px] flex-col justify-center gap-4 border border-[rgba(251,249,246,0.14)] px-10 py-12 backdrop-blur-md transition-colors hover:border-[rgba(201,162,39,0.45)]"
                  style={{ background: 'rgba(20,46,35,0.55)', borderRadius: 'inherit' }}
                >
                  <span className="text-[0.68rem] uppercase tracking-[0.3em]" style={{ fontFamily: 'var(--font-head)', color: '#C9A227' }}>
                    {s.n}
                  </span>
                  <span className="text-[1.5rem] leading-tight" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: '#FBF9F6' }}>
                    {s.name}
                  </span>
                  <span className="text-[0.86rem] leading-relaxed" style={{ color: 'rgba(251,249,246,0.72)' }}>
                    {s.copy}
                  </span>
                  <span className="mt-auto pt-2 text-[0.68rem] uppercase tracking-[0.2em]" style={{ fontFamily: 'var(--font-head)', color: '#EBD9A0' }}>
                    Step inside →
                  </span>
                </Link>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { session, profile } = useAuth()
  const firstName = profile?.name?.split(' ')[0]

  return (
    <div>
      {/* ---- HERO — the dive into the face ---- */}
      <SkinDive session={session} />

      {/* ---- SLIDE TWO — the mark ---- */}
      <BrandSlide />

      {/* ---- MARQUEE ---- */}
      <section aria-hidden="true" className="marquee border-y border-line py-4" style={{ background: '#1C3F30' }}>
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <span key={copy} className="flex items-center">
              {MARQUEE.map((m) => (
                <span
                  key={`${copy}-${m}`}
                  className="mx-6 flex items-center gap-12 text-[0.78rem] uppercase tracking-[0.3em]"
                  style={{ fontFamily: 'var(--font-head)', color: '#C9A227' }}
                >
                  {m}
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'rgba(251,249,246,0.5)' }} />
                </span>
              ))}
            </span>
          ))}
        </div>
      </section>

      {/* ---- PHILOSOPHY ---- */}
      <section className="relative z-10 py-24 md:py-36">
        <div className="mx-auto max-w-[880px] px-6 text-center">
          <Reveal>
            <p className="tag-caps mb-8" style={{ fontFamily: 'var(--font-head)' }}>
              Why SkinWise exists
            </p>
            <p
              className="text-[1.5rem] leading-snug text-ink md:text-[2.2rem]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}
            >
              India buys skincare on trust and hearsay. Labels are chemistry exams, routines quietly
              fight themselves, and serums die in the heat long before the bottle is empty. We read
              the fine print — <em className="text-gold2">so your skin never pays for it</em>.
            </p>
          </Reveal>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {[
              ['Personal', 'One profile — skin type, concerns, city — powers every verdict on the site.'],
              ['Protective', 'Conflicts, prescription clashes and expired actives get caught before your skin does.'],
              ['Proven', 'Ingredient evidence over influencer noise. Hype is scored against the formula.'],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.12}>
                <div className="border-t border-gold/50 pt-6 text-left">
                  <h3
                    className="text-[0.8rem] uppercase tracking-[0.24em] text-ink"
                    style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}
                  >
                    {t}
                  </h3>
                  <p className="mt-3 text-[0.88rem] leading-relaxed text-ink2">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- THE SYSTEMS FORM over the orb ---- */}
      <SystemsForm />

      {/* ---- HYPE VS FORMULA ---- */}
      <section className="relative z-10 overflow-hidden bg-bg">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-6 py-20 md:grid-cols-2 md:gap-20 md:px-10 md:py-28">
          <Reveal>
            <SpotlightCard>
              <div className="img-frame aspect-[3/4] max-h-[560px] w-full">
                <img src={IMG.hype} alt="Close editorial portrait, freckled skin in daylight" loading="lazy" />
              </div>
            </SpotlightCard>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="tag-caps mb-6" style={{ fontFamily: 'var(--font-head)' }}>
              The hype index
            </p>
            <h2 className="headline text-[2.2rem] md:text-[3.4rem]">
              Hype is loud.
              <br />
              <em>formulas are quiet.</em>
            </h2>
            <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-ink2">
              Every product carries two scores here: how hard the internet is pushing it, and what
              its ingredient list actually earns. When the gap is wide, we say so.
            </p>
            <Link
              to="/formula-lab"
              data-cursor
              className="link-line mt-8 inline-block text-[0.72rem] uppercase tracking-[0.2em] text-ink"
              style={{ fontFamily: 'var(--font-head)', fontWeight: 500 }}
            >
              Score a product →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---- PROFILE CTA ---- */}
      <section className="relative z-10">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-6 py-20 md:grid-cols-2 md:gap-20 md:px-10 md:py-28">
          <Reveal className="order-2 md:order-1">
            {session ? (
              <>
                <p className="tag-caps mb-6" style={{ fontFamily: 'var(--font-head)' }}>
                  Your profile
                </p>
                <h2 className="headline text-[2.2rem] md:text-[3.4rem]">
                  Welcome back{firstName ? `, ` : ''}
                  {firstName && <em>{firstName.toLowerCase()}</em>}
                </h2>
                <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-ink2">
                  Your garden is growing. Today&rsquo;s ritual is ready — and your shelf has been watched while you were away.
                </p>
                <Link
                  to="/skin-garden"
                  data-cursor
                  className="mt-10 inline-block rounded-full bg-ink px-8 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-bg transition hover:opacity-90"
                  style={{ fontFamily: 'var(--font-head)' }}
                >
                  Open today&rsquo;s ritual
                </Link>
              </>
            ) : (
              <>
                <p className="tag-caps mb-6" style={{ fontFamily: 'var(--font-head)' }}>
                  Two minutes, once
                </p>
                <h2 className="headline text-[2.2rem] md:text-[3.4rem]">
                  One quiz. <em>every</em> answer after.
                </h2>
                <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-ink2">
                  Skin type, concerns, city, climate, prescriptions — one two-minute profile powers
                  every verdict, conflict check and dupe on the site.
                </p>
                <Link
                  to="/build"
                  data-cursor
                  className="mt-10 inline-block rounded-full bg-ink px-8 py-3.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-bg transition hover:opacity-90"
                  style={{ fontFamily: 'var(--font-head)' }}
                >
                  Build your profile
                </Link>
              </>
            )}
          </Reveal>
          <Reveal delay={0.15} className="order-1 md:order-2">
            <SpotlightCard radius="9999px 9999px 1.6rem 1.6rem">
              <div className="img-frame aspect-[3/4] max-h-[560px] w-full rounded-t-full">
                <img src={IMG.portrait} alt="Editorial portrait with luminous skin in warm light" loading="lazy" />
              </div>
            </SpotlightCard>
          </Reveal>
        </div>
      </section>

      <QuoteStrip />
      <Footer />
    </div>
  )
}

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
  hype: '/images/portrait-man-new.jpg',
  portrait: '/images/portrait-glow-profile.jpg',
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

// Slide two — truekind-style editorial: headline top-left, a blob-masked
// portrait centre-right, floating value cards around it, one hand-drawn gold
// thread arcing from the words down into the picture.
const SLIDE2_CARDS = [
  {
    title: 'Radical transparency',
    copy: 'Every formula decoded, every active named. No black boxes, no sponsored answers.',
    pos: 'lg:left-[4%] lg:top-[44%]',
    delay: 0.15,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#1C3F30" strokeWidth="1.5" strokeLinecap="round" className="h-5 w-5">
        <circle cx="11" cy="11" r="6" />
        <path d="M15.5 15.5 20 20" />
      </svg>
    ),
  },
  {
    title: 'Conflict-checked rituals',
    copy: 'Your AM and PM garden is checked on every add — nothing in it fights itself.',
    pos: 'lg:left-[16%] lg:top-[68%]',
    delay: 0.3,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#1C3F30" strokeWidth="1.5" strokeLinecap="round" className="h-5 w-5">
        <path d="M12 21c5-3.4 7-7.6 7-11a7 7 0 0 0-14 0c0 3.4 2 7.6 7 11z" />
        <path d="M12 3v18" />
      </svg>
    ),
  },
  {
    title: 'Shelf life, tracked',
    copy: 'Opened dates, Indian heat, oxidising vitamin C — your museum watches it all.',
    pos: 'lg:right-[6%] lg:top-[22%]',
    delay: 0.45,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#1C3F30" strokeWidth="1.5" strokeLinecap="round" className="h-5 w-5">
        <path d="M9 3h6M10 3v4l-4 5c-2 2.6-.6 9 2.5 9h7c3.1 0 4.5-6.4 2.5-9l-4-5V3" />
      </svg>
    ),
  },
  {
    title: 'Dupes, found honestly',
    copy: 'The ₹349 echo of the ₹3,400 serum — matched on actives, not marketing.',
    pos: 'lg:right-[10%] lg:top-[64%]',
    delay: 0.6,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#1C3F30" strokeWidth="1.5" strokeLinecap="round" className="h-5 w-5">
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
        <path d="M19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z" />
      </svg>
    ),
  },
]

function BrandSlide() {
  return (
    <section className="relative overflow-hidden bg-bg py-24 md:py-32">
      <div className="relative mx-auto min-h-[88vh] max-w-[1280px] px-6 md:px-10">
        {/* headline — top left, truekind grammar in the SkinWise voice */}
        <div className="relative z-20 max-w-[620px]">
          <motion.h2
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.9, ease: ease.silk }}
            className="headline text-[2.4rem] leading-[1.02] md:text-[4rem]"
          >
            Personal, protective,
            <br />
            proven
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.9, delay: 0.18, ease: ease.silk }}
            className="mt-1 border-b-2 border-ink pb-2 text-[3rem] italic leading-none md:ml-40 md:text-[4.6rem]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ink)', width: 'fit-content' }}
          >
            skincare.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="mt-5 max-w-[260px] text-[0.8rem] leading-relaxed text-ink2"
          >
            Unreservedly honest verdicts that truly fit — kind to your skin and your wallet, no exceptions.
          </motion.p>
        </div>

        {/* hand-drawn gold thread from the words into the portrait */}
        <svg
          aria-hidden="true"
          viewBox="0 0 420 420"
          fill="none"
          className="pointer-events-none absolute right-[16%] top-[4%] z-10 hidden w-[380px] lg:block"
        >
          <motion.path
            d="M30 30 C230 10 400 90 350 330"
            stroke="#C9A227"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.4, delay: 0.5, ease: 'easeInOut' }}
          />
          <path d="M342 318 L350 332 L336 330" stroke="#C9A227" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* blob-masked portrait, centre-right */}
        <div className="relative mt-14 flex justify-center lg:mt-0 lg:justify-end lg:pr-[10%]">
          {/* soft backing blob */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-[112%] w-[118%] -translate-x-1/2 -translate-y-1/2 lg:left-auto lg:right-[-6%] lg:translate-x-0"
            style={{ background: '#F0E6D7', borderRadius: '55% 45% 58% 42% / 46% 56% 44% 54%', transform: 'rotate(6deg)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 1.1, ease: ease.silk }}
            className="relative z-10 w-[min(520px,88vw)] overflow-hidden"
            style={{ borderRadius: '58% 42% 52% 48% / 55% 46% 54% 45%' }}
          >
            <img
              src="/images/portrait-woman-new.jpg"
              alt="Luminous, healthy skin in soft daylight"
              className="aspect-[5/6] w-full object-cover"
            />
          </motion.div>

          {/* gold leaf accent */}
          <motion.svg
            aria-hidden="true"
            viewBox="0 0 60 60"
            fill="none"
            className="absolute -top-8 right-[6%] z-20 hidden w-14 lg:block"
            initial={{ opacity: 0, rotate: -20, y: 10 }}
            whileInView={{ opacity: 1, rotate: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 1.2, ease: ease.silk }}
          >
            <path d="M30 52 C14 40 12 20 30 8 C48 20 46 40 30 52z" fill="#7A9A82" opacity="0.9" />
            <path d="M30 50 V10" stroke="#1C3F30" strokeWidth="1" opacity="0.5" />
          </motion.svg>
        </div>

        {/* floating value cards — absolute on desktop, tidy grid on mobile */}
        <div className="relative z-20 mt-10 grid gap-4 sm:grid-cols-2 lg:static lg:mt-0">
          {SLIDE2_CARDS.map((c) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, delay: c.delay, ease: ease.silk }}
              className={`lg:absolute lg:w-[230px] ${c.pos}`}
            >
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 5.5 + c.delay * 2, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
                className="rounded-[1.4rem] border border-line bg-card p-6 text-center shadow-[var(--shadow)]"
              >
                <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full" style={{ background: 'var(--bg)' }}>
                  {c.icon}
                </span>
                <p className="text-[0.82rem] font-semibold text-ink" style={{ fontFamily: 'var(--font-head)' }}>
                  {c.title}
                </p>
                <p className="mt-2 text-[0.74rem] leading-relaxed text-ink2">{c.copy}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
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
                <img src={IMG.hype} alt="Close editorial portrait of a young man with clear skin" loading="lazy" />
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
                <img src={IMG.portrait} alt="Editorial profile portrait, luminous skin in soft light" loading="lazy" />
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

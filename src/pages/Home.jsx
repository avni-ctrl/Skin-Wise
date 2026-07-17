import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import QuoteStrip from '../components/QuoteStrip'
import Footer from '../components/Footer'
import SkinDive from '../components/SkinDive'
import { useAuth } from '../context/AuthContext'
import { ease } from '../lib/easing'

// Editorial photography (Unsplash). Swap these for Higgsfield renders when
// credits are available — each slot is a plain <img src>, nothing structural.
const IMG = {
  lab: '/images/bottles-flatlay.jpg',
  garden: '/images/garden-doodle.jpg',
  museum: 'https://images.unsplash.com/photo-1631730359585-38a4935cbec4?q=80&w=1200&auto=format&fit=crop',
  dupe: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1200&auto=format&fit=crop',
  hype: '/images/portrait-freckle.png',
  portrait: '/images/portrait-glow.png',
}

const SYSTEM = [
  {
    n: '01',
    to: '/formula-lab',
    name: 'Formula Lab',
    accent: 'verdicts',
    copy: 'Search any Indian skincare product and read its formula in plain language — every active explained, scored Safe, Caution or Avoid against your skin.',
    img: IMG.lab,
    alt: 'Apothecary flat-lay of amber bottles and botanicals on stone',
  },
  {
    n: '02',
    to: '/skin-garden',
    name: 'Skin Garden',
    accent: 'ritual',
    copy: 'Build your AM and PM routine step by step. Every addition is checked for conflicts — retinol against vitamin C, acids against retinoids — and layered in the right order.',
    img: IMG.garden,
    alt: 'Hand-drawn doodles of skincare bottles, oils and tools',
  },
  {
    n: '03',
    to: '/product-museum',
    name: 'Product Museum',
    accent: 'shelf-life',
    copy: 'Your shelf, curated. We track when each product was opened and compute its real usable life for your city and season — and flag the vitamin C that quietly oxidised.',
    img: IMG.museum,
    alt: 'Copper and amber cosmetic bottles arranged on a dark surface',
  },
  {
    n: '04',
    to: '/find-a-dupe',
    name: 'Find a Dupe',
    accent: 'echoes',
    copy: 'Love the formula, not the price? We rebuild any product from its ingredient list and surface the closest matches at a fraction of the cost.',
    img: IMG.dupe,
    alt: 'Hands holding an amber dropper bottle in low light',
  },
]

const MARQUEE = [
  'Ingredients decoded',
  'Conflicts caught',
  'Shelf life tracked',
  'Dupes found',
  'Made for Indian skin',
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

function SystemRow({ item, i }) {
  return (
    <div
      className={`mx-auto flex max-w-[1200px] flex-col gap-10 px-6 py-16 md:items-center md:gap-20 md:py-24 ${
        i % 2 ? 'md:flex-row-reverse' : 'md:flex-row'
      }`}
    >
      <Reveal className="md:w-1/2">
        <Link to={item.to} data-cursor className="img-frame block aspect-[4/5] max-h-[540px] w-full">
          <img src={item.img} alt={item.alt} loading="lazy" />
        </Link>
      </Reveal>
      <div className="md:w-1/2">
        <Reveal>
          <p className="tag-caps mb-5" style={{ fontFamily: 'var(--font-head)' }}>
            {item.n} — the system
          </p>
          <h2 className="headline text-[2.2rem] md:text-[3.2rem]">
            <Link to={item.to} className="transition-opacity hover:opacity-80">
              {item.name.split(' ')[0]} <em>{item.name.split(' ').slice(1).join(' ').toLowerCase() || item.accent}</em>
            </Link>
          </h2>
          <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-ink2">{item.copy}</p>
          <Link
            to={item.to}
            data-cursor
            className="link-line mt-8 inline-block text-[0.72rem] uppercase tracking-[0.2em] text-ink"
            style={{ fontFamily: 'var(--font-head)', fontWeight: 500 }}
          >
            Step inside →
          </Link>
        </Reveal>
      </div>
    </div>
  )
}

export default function Home() {
  const { session, profile } = useAuth()

  const firstName = profile?.name?.split(' ')[0]

  return (
    <div>
      {/* ---- HERO — the dive: a pinned descent through the skin's layers ---- */}
      <SkinDive session={session} />

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

      {/* ---- THE SYSTEM 01–04 ---- */}
      <section className="relative z-10">
        <div className="mx-auto max-w-[1200px] px-6">
          <Reveal>
            <div className="flex items-end justify-between border-b border-line pb-6">
              <h2 className="headline text-[2rem] md:text-[3rem]">
                The <em>system</em>
              </h2>
              <p className="hidden text-[0.72rem] uppercase tracking-[0.22em] text-ink2 md:block" style={{ fontFamily: 'var(--font-head)' }}>
                Four rooms · One profile
              </p>
            </div>
          </Reveal>
        </div>
        {SYSTEM.map((item, i) => (
          <SystemRow key={item.to} item={item} i={i} />
        ))}
      </section>

      {/* ---- HYPE VS FORMULA — dark editorial band ---- */}
      <section className="relative z-10 overflow-hidden" style={{ background: '#1C3F30' }}>
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-6 py-20 md:grid-cols-2 md:gap-20 md:px-10 md:py-28">
          <Reveal>
            <div className="img-frame aspect-[3/4] max-h-[560px] w-full">
              <img src={IMG.hype} alt="Close editorial portrait, freckled skin in daylight" loading="lazy" />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="tag-caps mb-6" style={{ fontFamily: 'var(--font-head)', color: '#C9A227' }}>
              The hype index
            </p>
            <h2 className="headline text-[2.2rem] md:text-[3.4rem]" style={{ color: '#FBF9F6' }}>
              Hype is loud.
              <br />
              <em style={{ color: '#C9A227' }}>formulas are quiet.</em>
            </h2>
            <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed" style={{ color: 'rgba(251,249,246,0.7)' }}>
              Every product carries two scores here: how hard the internet is pushing it, and what
              its ingredient list actually earns. When the gap is wide, we say so.
            </p>
            <Link
              to="/formula-lab"
              data-cursor
              className="link-line mt-8 inline-block text-[0.72rem] uppercase tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-head)', fontWeight: 500, color: '#C9A227' }}
            >
              Score a product →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---- PROFILE CTA — portrait band ---- */}
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
            <div className="img-frame aspect-[3/4] max-h-[560px] w-full rounded-t-full">
              <img src={IMG.portrait} alt="Editorial portrait with luminous skin on a terracotta wall" loading="lazy" />
            </div>
          </Reveal>
        </div>
      </section>

      <QuoteStrip />
      <Footer />
    </div>
  )
}

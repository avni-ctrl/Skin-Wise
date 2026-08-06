import { motion } from 'framer-motion'
import { useReducedMotion } from '../lib/usePrefs'

// The Dupe Finder backdrop — a serum dropper releasing champagne drops onto a
// dark emerald pool. Each drop lands and rings spread outward: the price, and
// its echo. No photo; pure motion in the house palette.
const WATER = '58%' // where air meets water

// A drop + the rings it makes, kept in sync: the drop falls over the first
// ~45% of the period, then the rings bloom from the impact point.
function Drip({ x, period, delay, ringMax = 4, reduced }) {
  const rings = reduced ? 1 : 3
  return (
    <>
      {/* the falling champagne drop */}
      {!reduced && (
        <motion.span
          aria-hidden="true"
          className="absolute"
          style={{
            left: x,
            top: '17%',
            width: 9,
            height: 13,
            marginLeft: -4.5,
            background: 'radial-gradient(circle at 40% 30%, #FBF5DE, #EBD9A0 55%, #C9A227 90%)',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            filter: 'drop-shadow(0 0 4px rgba(235,217,160,0.5))',
          }}
          animate={{ top: ['17%', WATER], opacity: [0, 1, 1, 0], scaleY: [0.7, 1, 1.25, 0.4] }}
          transition={{ duration: period, times: [0, 0.06, 0.42, 0.46], ease: 'easeIn', repeat: Infinity, delay }}
        />
      )}
      {/* the rings on the surface */}
      {[...Array(rings)].map((_, k) => (
        <motion.span
          key={k}
          aria-hidden="true"
          className="absolute rounded-[50%] border"
          style={{
            left: x,
            top: WATER,
            width: 46,
            height: 14,
            marginLeft: -23,
            marginTop: -7,
            borderColor: 'rgba(235,217,160,0.5)',
          }}
          animate={reduced ? { scale: 2.4, opacity: 0.3 } : { scale: [0.3, ringMax + k], opacity: [0.55, 0] }}
          transition={
            reduced
              ? undefined
              : { duration: period * 0.55, delay: delay + period * 0.45 + k * 0.28, repeat: Infinity, repeatDelay: period * 0.45, ease: 'easeOut' }
          }
        />
      ))}
    </>
  )
}

// The dropper bottle, tip aimed at the pool.
function DropperBottle({ reduced }) {
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 60 120"
      className="absolute left-1/2 top-[3%] w-[54px] -translate-x-1/2 md:w-[64px]"
      animate={reduced ? undefined : { y: [0, 6, 0] }}
      transition={reduced ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* rubber bulb */}
      <rect x="21" y="2" width="18" height="20" rx="7" fill="#1C3F30" />
      {/* collar */}
      <rect x="19" y="21" width="22" height="7" rx="2" fill="#A99148" />
      {/* glass body with champagne serum */}
      <rect x="17" y="27" width="26" height="58" rx="9" fill="rgba(201,162,39,0.28)" stroke="rgba(235,217,160,0.55)" strokeWidth="1.2" />
      <rect x="21" y="52" width="18" height="30" rx="7" fill="rgba(201,162,39,0.5)" />
      {/* dropper tip */}
      <path d="M26 85 L34 85 L31 100 L29 100 Z" fill="rgba(235,217,160,0.7)" />
      <circle cx="30" cy="101" r="2.4" fill="#EBD9A0" />
    </motion.svg>
  )
}

// Tiny bubbles rising through the water.
function Bubbles({ reduced }) {
  if (reduced) return null
  return (
    <>
      {[...Array(9)].map((_, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="absolute rounded-full"
          style={{
            left: `${(i * 41 + 8) % 96}%`,
            bottom: '-4%',
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7), rgba(201,162,39,0.15) 70%, transparent)',
            border: '1px solid rgba(201,162,39,0.25)',
          }}
          animate={{ y: ['0vh', '-42vh'], opacity: [0, 0.7, 0] }}
          transition={{ duration: 7 + (i % 4) * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
        />
      ))}
    </>
  )
}

export default function EchoBackdrop() {
  const reduced = useReducedMotion()
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg, #1C3F30 0%, #163024 46%, #0f241b 58%, #0b1c15 100%)' }}>
      {/* the water surface line + soft caustic sheen */}
      <div aria-hidden="true" className="absolute inset-x-0" style={{ top: WATER, height: 1, background: 'linear-gradient(90deg, transparent, rgba(235,217,160,0.35), transparent)' }} />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0" style={{ top: WATER, background: 'radial-gradient(120% 80% at 50% 0%, rgba(122,154,130,0.14), transparent 70%)' }} />

      <DropperBottle reduced={reduced} />

      {/* three drips at staggered points and tempos */}
      <Drip x="50%" period={2.8} delay={0} ringMax={4.5} reduced={reduced} />
      <Drip x="30%" period={3.6} delay={1.4} ringMax={3.5} reduced={reduced} />
      <Drip x="70%" period={3.2} delay={2.4} ringMax={3.8} reduced={reduced} />

      <Bubbles reduced={reduced} />

      {/* faint mirrored "≈" — the mark of a near-match */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 select-none leading-none"
        style={{ top: '34%', transform: 'translate(-50%, -50%)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(10rem, 30vw, 26rem)', color: 'rgba(201,162,39,0.05)' }}
      >
        ≈
      </span>

      {/* gentle centre darkening so the headline stays legible */}
      <div aria-hidden="true" className="absolute inset-0" style={{ background: 'radial-gradient(70% 45% at 50% 48%, rgba(11,28,21,0.5), transparent 70%)' }} />
    </div>
  )
}

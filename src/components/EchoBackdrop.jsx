import { motion } from 'framer-motion'
import { useReducedMotion } from '../lib/usePrefs'

// The Find a Dupe backdrop — "echoes". A product and its cheaper twin ripple
// outward from three points; soft botanical blobs drift behind. No photo,
// pure motion in the house palette (emerald base, champagne ripples).
const RIPPLES = [
  { x: '26%', y: '38%', dur: 7, delay: 0 },
  { x: '72%', y: '30%', dur: 8.5, delay: 1.4 },
  { x: '58%', y: '70%', dur: 7.8, delay: 2.8 },
]

const BLOBS = [
  { x: '12%', y: '20%', s: 320, c: 'rgba(122,154,130,0.5)', dur: 15 },
  { x: '78%', y: '58%', s: 380, c: 'rgba(201,162,39,0.28)', dur: 19 },
  { x: '44%', y: '84%', s: 260, c: 'rgba(122,154,130,0.4)', dur: 17 },
]

function Ripple({ x, y, dur, delay, reduced }) {
  return (
    <div className="absolute" style={{ left: x, top: y }} aria-hidden="true">
      {[0, 1, 2].map((k) => (
        <motion.span
          key={k}
          className="absolute rounded-full border"
          style={{
            width: 40,
            height: 40,
            marginLeft: -20,
            marginTop: -20,
            borderColor: 'rgba(235,217,160,0.5)',
          }}
          animate={reduced ? { opacity: 0.4, scale: 3 } : { scale: [0.4, 7], opacity: [0.55, 0] }}
          transition={reduced ? undefined : { duration: dur, delay: delay + k * (dur / 3), repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
      {/* the twin dots at the source — original + its dupe */}
      <span className="absolute h-2 w-2 -translate-x-3 -translate-y-1 rounded-full" style={{ background: '#EBD9A0' }} />
      <span className="absolute h-1.5 w-1.5 translate-x-2 translate-y-1 rounded-full" style={{ background: 'rgba(235,217,160,0.6)' }} />
    </div>
  )
}

export default function EchoBackdrop() {
  const reduced = useReducedMotion()
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'radial-gradient(120% 120% at 50% 30%, #1C3F30 0%, #163024 55%, #112620 100%)' }}>
      {/* drifting botanical blobs */}
      {BLOBS.map((b, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="absolute rounded-full blur-3xl"
          style={{ left: b.x, top: b.y, width: b.s, height: b.s, background: `radial-gradient(closest-side, ${b.c}, transparent)` }}
          animate={reduced ? undefined : { x: [0, 30, -20, 0], y: [0, -24, 18, 0] }}
          transition={reduced ? undefined : { duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* echo ripples */}
      {RIPPLES.map((r, i) => (
        <Ripple key={i} {...r} reduced={reduced} />
      ))}

      {/* faint mirrored "≈" — the sign of a near-match */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none leading-none"
        style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(16rem, 42vw, 40rem)', color: 'rgba(201,162,39,0.06)' }}
      >
        ≈
      </span>

      {/* fine grain of gold flecks */}
      {!reduced &&
        [...Array(10)].map((_, i) => (
          <motion.span
            key={`f${i}`}
            aria-hidden="true"
            className="absolute h-1 w-1 rounded-full"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, background: 'rgba(201,162,39,0.5)' }}
            animate={{ y: [0, -18, 0], opacity: [0.15, 0.6, 0.15] }}
            transition={{ duration: 5 + (i % 4), repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
          />
        ))}
    </div>
  )
}

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion, useIsMobile, isCapableDevice } from '../lib/usePrefs'

// Rotating, morphing liquid amoeba that sheds droplets (serum in fluid).
// Each instance breathes on its OWN sine wave — random duration/phase,
// never synced. Droplets: full count on capable desktops, fewer on mobile,
// none under reduced motion (static pre-shaped blob instead).
export default function AmoebaBlob({ color = 'var(--accent)', size = 150, children, className = '' }) {
  const reduced = useReducedMotion()
  const mobile = useIsMobile()
  const seed = useMemo(() => Math.random(), [])
  const dur = 7 + seed * 6
  const dropletCount = reduced ? 0 : mobile ? 2 : isCapableDevice() ? 6 : 3

  const droplets = useMemo(
    () =>
      Array.from({ length: dropletCount }, (_, i) => ({
        angle: (i / Math.max(dropletCount, 1)) * Math.PI * 2 + seed * 6,
        dist: size * (0.62 + (i % 3) * 0.14),
        r: 4 + (i % 3) * 3,
        dur: 6 + i * 1.7 + seed * 3,
      })),
    [dropletCount, seed, size]
  )

  return (
    <div className={`relative grid place-items-center ${className}`} style={{ width: size * 1.6, height: size * 1.6 }}>
      {droplets.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ width: d.r * 2, height: d.r * 2, background: color, opacity: 0.5 }}
          animate={{
            x: [Math.cos(d.angle) * d.dist, Math.cos(d.angle + 2.4) * d.dist * 0.85, Math.cos(d.angle + 4.8) * d.dist, Math.cos(d.angle) * d.dist],
            y: [Math.sin(d.angle) * d.dist * 0.8, Math.sin(d.angle + 2.4) * d.dist, Math.sin(d.angle + 4.8) * d.dist * 0.9, Math.sin(d.angle) * d.dist * 0.8],
            scale: [1, 1.3, 0.8, 1],
          }}
          transition={{ duration: d.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <motion.div
        className="relative grid place-items-center overflow-hidden"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 34% 30%, color-mix(in srgb, ${color} 92%, white) 0%, ${color} 58%, color-mix(in srgb, ${color} 82%, black) 100%)`,
          borderRadius: '58% 42% 55% 45% / 48% 55% 45% 52%',
          animation: reduced ? 'none' : `amoeba ${dur}s ease-in-out infinite`,
          animationDelay: `${-seed * dur}s`,
          boxShadow: `0 18px 50px -18px color-mix(in srgb, ${color} 55%, transparent)`,
        }}
        animate={reduced ? undefined : { rotate: [0, 8, -6, 0] }}
        transition={reduced ? undefined : { duration: dur * 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </div>
  )
}

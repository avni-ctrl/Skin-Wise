import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '../lib/usePrefs'

// 140px verdict ring: Terracotta 0–40 / Amber 41–70 / Sage 71–100,
// counting up as the ring sweeps.
export default function ScoreRing({ score, size = 140, color: colorOverride }) {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(reduced ? score : 0)
  const r = (size - 14) / 2
  const circumference = 2 * Math.PI * r
  const color = colorOverride ?? (score <= 40 ? 'var(--terra)' : score <= 70 ? 'var(--amber)' : 'var(--accent)')

  useEffect(() => {
    if (reduced) {
      setDisplay(score)
      return
    }
    let raf
    const start = performance.now()
    const duration = 1200
    const tick = (now) => {
      const k = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - k, 3)
      setDisplay(Math.round(score * eased))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [score, reduced])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
          transition={{ duration: reduced ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-4xl" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color }}>
          {display}
        </span>
      </div>
    </div>
  )
}

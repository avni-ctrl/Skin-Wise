import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { dur, ease } from '../lib/easing'
import { useReducedMotion } from '../lib/usePrefs'

const QUOTES = [
  'Your skin is a story — we just help you read it.',
  'Every ingredient has a purpose.',
  'Know what you’re putting on, and why.',
  'Skincare, read like a second language.',
  'The label is the formula. Learn to read it.',
  'Good skin is patience, practised daily.',
  'Expensive is not the same as effective.',
  'Your barrier remembers everything.',
  'Twelve steps is a hobby. Four steps is a routine.',
  'Sunscreen is the quietest anti-aging serum ever made.',
  'What suits her skin may quarrel with yours.',
  'A shelf curated is a face cared for.',
  'Actives are strong opinions — schedule them apart.',
  'The best product is the one your skin finishes.',
]

// A random quote each load; crossfades to the next every ~7s while you linger.
export default function QuoteStrip() {
  const start = useMemo(() => Math.floor(Math.random() * QUOTES.length), [])
  const [idx, setIdx] = useState(start)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setIdx((i) => (i + 1) % QUOTES.length), 7000)
    return () => clearInterval(id)
  }, [reduced])

  return (
    <section className="relative z-10 py-24 md:py-32">
      <div className="mx-auto max-w-[900px] px-6 text-center min-h-[7rem] grid place-items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: dur.quote / 2, ease: ease.silk }}
            className="italic text-[1.5rem] md:text-[2.1rem] leading-snug text-ink"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}
          >
            &ldquo;{QUOTES[idx]}&rdquo;
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="mx-auto mt-6 h-px w-24 bg-gold/50" />
    </section>
  )
}

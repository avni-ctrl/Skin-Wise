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

// A random quote each load; crossfades every ~7s. Set between two hairline
// gold rules — an editorial pause, nothing else on stage.
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
    <section className="relative z-10 py-20 md:py-28">
      <div className="mx-auto max-w-[820px] px-6">
        <div className="h-px w-full bg-gold/40" />
        <div className="grid min-h-[9rem] place-items-center py-10 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={idx}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: dur.quote / 2, ease: ease.silk }}
              className="italic text-[1.4rem] leading-snug text-ink md:text-[2rem]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}
            >
              &ldquo;{QUOTES[idx]}&rdquo;
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="h-px w-full bg-gold/40" />
      </div>
    </section>
  )
}

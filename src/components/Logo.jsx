import { motion } from 'framer-motion'

// Appendix A: continuous champagne-gold single-line face — hair arc, forehead,
// nose bump, lips, chin, jaw looping into a small spiral, releasing in a long
// trailing curve below the baseline. One path, rounded caps, no interior detail.
export const FACE_PATH =
  'M14 22 C22 8 42 2 58 8 C70 12 75 20 74 28 C73 34 78 37 77 42 C76 46 71 47 72 51 C73 55 69 56 69 60 C69 63 73 64 72 68 C71 74 63 78 56 76 C47 74 41 66 41 58 C41 50 49 45 55 49 C60 52 58 60 51 60 C44 60 38 68 44 78 C52 91 74 94 98 98'

export function FaceLine({ className = '', draw = false, delay = 0 }) {
  return (
    <svg viewBox="0 0 104 104" fill="none" className={className} aria-hidden="true">
      <motion.path
        d={FACE_PATH}
        stroke="var(--gold)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={draw ? { pathLength: 0 } : false}
        animate={draw ? { pathLength: 1 } : undefined}
        transition={draw ? { duration: 1.2, delay, ease: 'easeInOut' } : undefined}
      />
    </svg>
  )
}

// Wordmark: brush-script "Skin" + serif small-caps "WISE", one baseline, no gap.
export default function Logo({ size = 'nav', withTagline = false, draw = false }) {
  const scale = {
    nav: { script: 'text-[1.7rem]', serif: 'text-[1.18rem]', face: 'w-9 -mr-2 -mt-3', tag: 'text-[0.42rem]' },
    hero: { script: 'text-[4.4rem] md:text-[6rem]', serif: 'text-[3rem] md:text-[4.1rem]', face: 'w-24 md:w-32 -mr-6 -mt-8', tag: 'text-[0.6rem] md:text-[0.72rem]' },
  }[size]

  return (
    <span className="inline-flex flex-col items-center select-none">
      <span className="relative inline-flex items-baseline">
        <span className={`font-[Sacramento] leading-none text-ink ${scale.script}`}>Skin</span>
        <span
          className={`leading-none text-ink ${scale.serif}`}
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.08em' }}
        >
          WISE
        </span>
        <span className={`absolute right-0 top-0 translate-x-[55%] ${scale.face}`}>
          <FaceLine draw={draw} className="w-full" />
        </span>
      </span>
      {withTagline && (
        <span
          className={`mt-1 text-gold2 ${scale.tag}`}
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.34em' }}
        >
          KNOW YOUR SKIN. KNOW YOUR PRODUCTS.
        </span>
      )}
    </span>
  )
}

import { motion } from 'framer-motion'

// The brand mark, matched to the logo artwork: one continuous champagne-gold
// line — hair sweeping in from the upper left over the crown, ending in a
// small curl at the right, folding back into a RIGHT-facing profile
// (brow → nose with a nostril loop → two lip bumps → chin), a large open
// loop at the cheek, then a long neck curve trailing down and to the right.
export const FACE_PATH =
  'M6 8 C60 -6 120 2 158 34 C176 50 188 62 186 70 C194 62 200 74 189 77 C180 80 176 70 184 66 C176 76 170 86 168 98 C176 104 180 112 172 119 C164 124 159 119 165 114 C179 126 181 138 165 140 C179 145 177 157 159 154 C147 157 135 159 125 157 C97 152 85 120 99 100 C109 87 123 98 113 116 C105 130 89 132 85 150 C84 190 104 230 144 258'

export function FaceLine({ className = '', draw = false, delay = 0 }) {
  return (
    <svg viewBox="-4 -10 212 278" fill="none" className={className} aria-hidden="true">
      <motion.path
        d={FACE_PATH}
        stroke="var(--gold)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={draw ? { pathLength: 0 } : false}
        animate={draw ? { pathLength: 1 } : undefined}
        transition={draw ? { duration: 1.4, delay, ease: 'easeInOut' } : undefined}
      />
    </svg>
  )
}

// Wordmark per the artwork: italic serif "Skin" + serif caps "WISE", both
// emerald, one baseline; the gold face line overlaps the right end.
export default function Logo({ size = 'nav', withTagline = false, draw = false }) {
  const scale = {
    nav: { script: 'text-[1.5rem]', serif: 'text-[1.32rem]', face: 'w-10 -mt-4', tag: 'text-[0.44rem]' },
    hero: { script: 'text-[4.2rem] md:text-[5.4rem]', serif: 'text-[3.6rem] md:text-[4.7rem]', face: 'w-28 md:w-36 -mt-12', tag: 'text-[0.62rem] md:text-[0.74rem]' },
  }[size]

  return (
    <span className="inline-flex flex-col items-center select-none">
      <span className="relative inline-flex items-baseline">
        <span
          className={`leading-none text-ink ${scale.script}`}
          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600 }}
        >
          Skin
        </span>
        <span
          className={`ml-1 leading-none text-ink ${scale.serif}`}
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.04em' }}
        >
          WISE
        </span>
        <span className={`absolute right-0 top-0 translate-x-[72%] ${scale.face}`}>
          <FaceLine draw={draw} className="w-full" />
        </span>
      </span>
      {withTagline && (
        <span
          className={`mt-2 text-gold2 ${scale.tag}`}
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.3em' }}
        >
          KNOW YOUR SKIN. KNOW YOUR PRODUCTS.
        </span>
      )}
    </span>
  )
}

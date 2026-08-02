import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { ease } from '../lib/easing'

// One cinematic opening slide for a feature room. Full-bleed backdrop with a
// slow Ken Burns drift, emerald scrim, centred editorial copy, scroll cue.
// Breaks out of any padded parent via the 100vw trick.
export default function FeatureHero({ tag, title, sub, img, imgAlt = '', pos = 'center', dark = true, backdrop, scrim = true, children }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.22])
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const ink = dark ? '#FBF9F6' : '#1C3F30'

  return (
    <section
      ref={ref}
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden"
      style={{ height: '92vh' }}
    >
      {backdrop ? (
        <motion.div style={{ y: bgY }} className="absolute inset-0">
          {backdrop}
        </motion.div>
      ) : (
        <motion.img
          src={img}
          alt={imgAlt}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ scale: bgScale, y: bgY, objectPosition: pos }}
        />
      )}
      {scrim && (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: dark
              ? 'linear-gradient(180deg, rgba(22,48,36,0.55) 0%, rgba(22,48,36,0.25) 45%, rgba(22,48,36,0.66) 100%)'
              : 'linear-gradient(180deg, rgba(251,249,246,0.72) 0%, rgba(251,249,246,0.3) 45%, rgba(251,249,246,0.85) 100%)',
          }}
        />
      )}

      <motion.div style={{ opacity: fade }} className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: ease.silk }}
          className="mb-6 text-[0.68rem] uppercase tracking-[0.34em]"
          style={{ fontFamily: 'var(--font-head)', color: '#EBD9A0' }}
        >
          {tag}
        </motion.p>
        <h1 className="headline text-[2.6rem] leading-[1.03] md:text-[4.4rem]" style={{ color: ink }}>
          {title.map((line, i) => (
            <motion.span
              key={i}
              className="block"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.3 + i * 0.16, ease: ease.silk }}
            >
              {line}
            </motion.span>
          ))}
        </h1>
        {sub && (
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.62, ease: ease.silk }}
            className="mt-6 max-w-md text-[0.95rem] leading-relaxed"
            style={{ color: dark ? 'rgba(251,249,246,0.8)' : '#5c5a52' }}
          >
            {sub}
          </motion.p>
        )}
        {children}
      </motion.div>

      <motion.span
        aria-hidden="true"
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2"
        style={{ opacity: fade }}
      >
        <motion.span
          className="block h-9 w-px"
          style={{ background: '#C9A227', transformOrigin: 'top' }}
          animate={{ scaleY: [0.2, 1, 0.2], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.span>
    </section>
  )
}

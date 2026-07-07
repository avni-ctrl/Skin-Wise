import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useReducedMotion, useIsMobile } from '../lib/usePrefs'
import { ease } from '../lib/easing'

// Signature "serum-drip spread" route transition.
// Purely an overlay: the new page renders underneath immediately, so
// navigation is never blocked and re-clicking mid-transition simply
// restarts the wash (interruptible by construction).
// Reduced motion: no drip — pages crossfade via PageFade below.
export default function SerumTransition() {
  const location = useLocation()
  const reduced = useReducedMotion()
  const mobile = useIsMobile()
  const [wash, setWash] = useState(null)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (reduced) return
    setWash(location.key)
  }, [location.key, reduced])

  if (reduced) return null

  return (
    <AnimatePresence>
      {wash && (
        <motion.div
          key={wash}
          className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => setWash(null)}
        >
          {/* the falling drop */}
          <motion.div
            className="absolute left-1/2 top-0 h-5 w-4 -translate-x-1/2 rounded-full"
            style={{ background: '#7A9A82' }}
            initial={{ y: '-8vh', scaleY: 1.4, opacity: 1 }}
            animate={{ y: '42vh', scaleY: 1, opacity: [1, 1, 0] }}
            transition={{ duration: 0.16, ease: 'easeIn' }}
          />
          {/* the spreading serum wash */}
          <motion.div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: '250vmax',
              height: '250vmax',
              x: '-50%',
              y: '-50%',
              background:
                'radial-gradient(circle, rgba(122,154,130,0.96) 0%, rgba(122,154,130,0.92) 55%, rgba(122,154,130,0) 72%)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1, opacity: [1, 1, 0] }}
            transition={{
              scale: { duration: mobile ? 0.3 : 0.34, delay: 0.14, ease: ease.drip },
              opacity: { duration: 0.5, delay: 0.14, times: [0, 0.55, 1], ease: 'easeOut' },
            }}
          />
          {/* champagne-gold glint sweeping through the spread */}
          {!mobile && (
            <motion.div
              className="absolute inset-y-0 w-[45vw]"
              style={{
                background:
                  'linear-gradient(105deg, transparent 0%, rgba(201,162,39,0.35) 45%, rgba(201,162,39,0.55) 50%, rgba(201,162,39,0.35) 55%, transparent 100%)',
                mixBlendMode: 'screen',
              }}
              initial={{ left: '-50%', opacity: 0 }}
              animate={{ left: '110%', opacity: [0, 1, 0] }}
              transition={{ duration: 0.4, delay: 0.18, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Per-page wrapper: quick fade-through so the page "emerges from underneath".
// For reduced motion this IS the whole transition (250ms crossfade).
export function PageFade({ children }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      transition={{ duration: reduced ? 0.25 : 0.45, ease: ease.silk, delay: reduced ? 0 : 0.12 }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  )
}

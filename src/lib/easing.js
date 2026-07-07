// SkinWise shared motion library — one hand moves the whole site.
// Every button, transition, quiz step and quote crossfade pulls from here.

export const ease = {
  // Silk: the default for opacity/position reveals.
  silk: [0.22, 1, 0.36, 1],
  // Settle: for elements that land (cards, verdicts).
  settle: [0.16, 1, 0.3, 1],
  // Drip: fast-in, soft-out — used by the serum page transition.
  drip: [0.65, 0, 0.35, 1],
}

export const spring = {
  // Pressed into silk — hover/tap on buttons and cards.
  silk: { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 },
  // Drift — search results and floating molecules.
  drift: { type: 'spring', stiffness: 90, damping: 18, mass: 1.1 },
  // Bloom — accordions and verdict cards unfolding.
  bloom: { type: 'spring', stiffness: 150, damping: 22, mass: 1 },
}

export const dur = {
  fast: 0.25,
  base: 0.5,
  slow: 0.9,
  quote: 1.4,
}

// Shared variants
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: dur.base, ease: ease.silk } },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: dur.base, ease: ease.silk } },
}

export const stagger = (delay = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
})

export const hoverLift = {
  whileHover: { y: -4, scale: 1.015 },
  whileTap: { scale: 0.985 },
  transition: spring.silk,
}

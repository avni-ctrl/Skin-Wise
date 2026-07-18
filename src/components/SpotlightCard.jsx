import { useRef, useState } from 'react'

// Spotlight frame (21st.dev-style): a champagne glow that follows the cursor
// around the border and washes softly across the surface. Wrap any image or
// card. Pure CSS vars + one mousemove — no re-render per frame.
export default function SpotlightCard({ children, className = '', radius = '1.6rem', glow = 'rgba(201,162,39,0.55)' }) {
  const ref = useRef(null)
  const [active, setActive] = useState(false)

  function onMove(e) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--sx', `${e.clientX - r.left}px`)
    el.style.setProperty('--sy', `${e.clientY - r.top}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={`group relative ${className}`}
      style={{ borderRadius: radius }}
    >
      {/* border spotlight — gradient ring revealed around the cursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px z-10 transition-opacity duration-500"
        style={{
          borderRadius: radius,
          opacity: active ? 1 : 0,
          padding: '1.5px',
          background: `radial-gradient(280px circle at var(--sx, 50%) var(--sy, 50%), ${glow}, rgba(201,162,39,0.12) 45%, transparent 70%)`,
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      {/* soft interior wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500"
        style={{
          borderRadius: radius,
          opacity: active ? 1 : 0,
          background: 'radial-gradient(340px circle at var(--sx, 50%) var(--sy, 50%), rgba(251,249,246,0.14), transparent 65%)',
        }}
      />
      <div className="relative overflow-hidden" style={{ borderRadius: radius }}>
        {children}
      </div>
    </div>
  )
}

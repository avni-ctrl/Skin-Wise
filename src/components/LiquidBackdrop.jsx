import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../lib/usePrefs'
import { useTheme } from '../context/ThemeContext'

// Appendix B port: SVG goo filter + drifting radial blobs + cursor attraction.
// The feColorMatrix alpha row (0 0 0 22 -11) is the contrast pass that makes
// blobs MERGE instead of blur — do not soften it.
// variant="hero"  → brand palette, ambient drift.
// variant="bloom" → quiz completion: blobs converge + resolve toward gold.
// Reduced motion  → a single static frame of pre-merged blobs.
export default function LiquidBackdrop({ variant = 'hero', bloom = false, className = '' }) {
  const canvasRef = useRef(null)
  const reduced = useReducedMotion()
  const { theme } = useTheme()
  const bloomRef = useRef(bloom)
  bloomRef.current = bloom

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let w, h, raf

    const resize = () => {
      w = canvas.width = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)
    canvas.style.filter = 'url(#skinwise-goo)'

    const dark = theme === 'dark'
    const bgFill = dark ? '#163024' : '#FBF9F6'
    // dark mode: drop the cream blob for a second gold one (porting notes)
    const palette = dark
      ? ['201,162,39', '122,154,130', '201,162,39', '169,145,72']
      : ['124,158,130', '28,63,48', '201,162,39', '251,249,246']

    const rand = (a, b) => Math.random() * (b - a) + a
    const BLOB_COUNT = 9
    const blobs = Array.from({ length: BLOB_COUNT }, (_, i) => ({
      baseX: rand(w * 0.15, w * 0.85),
      baseY: rand(h * 0.25, h * 0.85),
      r: rand(50, 110),
      speed: rand(0.15, 0.4),
      phase: rand(0, Math.PI * 2),
      driftX: rand(40, 120),
      driftY: rand(30, 90),
      color: palette[i % palette.length],
      pull: rand(0.02, 0.06),
    }))

    const mouse = { x: w / 2, y: h / 2, active: false }
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      mouse.active = true
    }
    const onLeave = () => (mouse.active = false)
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseleave', onLeave)

    let t = 0
    let bloomK = 0 // 0 = ambient, 1 = fully resolved gold bloom

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = bgFill
      ctx.fillRect(0, 0, w, h)
      blobs.forEach((b, i) => {
        let x = b.baseX + Math.sin(t * b.speed + b.phase) * b.driftX
        let y = b.baseY + Math.cos(t * b.speed * 0.8 + b.phase) * b.driftY
        if (mouse.active && !bloomRef.current) {
          const dx = mouse.x - x, dy = mouse.y - y
          const dist = Math.hypot(dx, dy)
          if (dist < 260) {
            x += dx * b.pull
            y += dy * b.pull
          }
        }
        // bloom: every blob converges to center and grades to champagne gold
        if (bloomK > 0) {
          x += (w / 2 - x) * bloomK
          y += (h / 2 - y) * bloomK
        }
        const pulse = 1 + Math.sin(t * b.speed * 1.5 + b.phase) * 0.12
        const r = b.r * pulse * (1 + bloomK * (i === 0 ? 1.1 : -0.25))
        const color = bloomK > 0.5 ? '201,162,39' : b.color
        const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(r, 1))
        grad.addColorStop(0, `rgba(${color},0.95)`)
        grad.addColorStop(1, `rgba(${color},0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(x, y, Math.max(r, 1), 0, Math.PI * 2)
        ctx.fill()
      })
    }

    if (reduced) {
      t = 8 // pre-merged still
      draw()
    } else {
      const animate = () => {
        t += 0.01
        if (bloomRef.current && bloomK < 1) bloomK = Math.min(1, bloomK + 0.012)
        if (!bloomRef.current && bloomK > 0) bloomK = Math.max(0, bloomK - 0.03)
        draw()
        raf = requestAnimationFrame(animate)
      }
      animate()
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [reduced, theme, variant])

  return <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full ${className}`} />
}

// Mount ONCE near the app root so the filter exists in the DOM.
export function GooFilterDefs() {
  return (
    <svg className="absolute h-0 w-0" aria-hidden="true">
      <defs>
        <filter id="skinwise-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  )
}

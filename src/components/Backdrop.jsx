import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useReducedMotion, useIsMobile } from '../lib/usePrefs'
import { backdropBus } from './backdropBus'

// The living backdrop: one full-viewport canvas behind every page.
// Idle breathing gradients, a whisper of a cursor ripple, per-route color
// grades that CROSS-FADE on navigation (never reset), and hooks for real
// user signals: Formula Lab conflicts flash amber, Skin Garden follows AM/PM.
// Reduced motion → a single static frame, repainted only on route/theme change.

const C = {
  sage: [122, 154, 130],
  emerald: [28, 63, 48],
  emeraldSoft: [46, 84, 66],
  gold: [201, 162, 39],
  olive: [169, 145, 72],
  cream: [251, 249, 246],
  amber: [199, 154, 74],
}

const GRADES = {
  '/': { light: [C.sage, C.emerald, C.gold, C.cream], dark: [C.gold, C.sage, C.olive, C.emeraldSoft], count: 7, speed: 1, alpha: 0.2 },
  '/formula-lab': { light: [C.emerald, C.sage, C.sage, C.gold], dark: [C.gold, C.sage, C.emeraldSoft, C.olive], count: 8, speed: 0.9, alpha: 0.18, filaments: true },
  '/skin-garden': {
    am: { light: [C.gold, C.olive, C.sage, C.cream], dark: [C.gold, C.olive, C.sage, C.emeraldSoft], count: 6, speed: 0.45, alpha: 0.2 },
    pm: { light: [C.emerald, C.emeraldSoft, C.olive, C.sage], dark: [C.emeraldSoft, C.olive, C.gold, C.emerald], count: 6, speed: 0.4, alpha: 0.24 },
  },
  '/product-museum': { light: [C.cream, C.gold, C.olive, C.sage], dark: [C.gold, C.olive, C.emeraldSoft, C.sage], count: 6, speed: 0.4, alpha: 0.17 },
  '/find-a-dupe': { light: [C.sage, C.cream, C.gold], dark: [C.sage, C.emeraldSoft, C.gold], count: 3, speed: 0.3, alpha: 0.13 },
  default: { light: [C.sage, C.gold, C.cream], dark: [C.gold, C.sage, C.emeraldSoft], count: 5, speed: 0.6, alpha: 0.17 },
}

function gradeFor(pathname, gardenMode) {
  if (pathname.startsWith('/skin-garden')) {
    return GRADES['/skin-garden'][gardenMode === 'PM' ? 'pm' : 'am']
  }
  return GRADES[pathname] ?? GRADES.default
}

export default function Backdrop() {
  const canvasRef = useRef(null)
  const { pathname } = useLocation()
  const reduced = useReducedMotion()
  const mobile = useIsMobile()
  const stateRef = useRef({ pathname, reduced, mobile })
  stateRef.current = { pathname, reduced, mobile }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let w, h, raf
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)

    const resize = () => {
      w = canvas.offsetWidth
      h = canvas.offsetHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const rand = (a, b) => Math.random() * (b - a) + a
    const MAX = 9
    const blobs = Array.from({ length: MAX }, (_, i) => ({
      bx: rand(0.1, 0.9), by: rand(0.15, 0.9),
      r: rand(0.14, 0.3), speed: rand(0.15, 0.4), phase: rand(0, Math.PI * 2),
      dx: rand(0.04, 0.12), dy: rand(0.03, 0.1),
      color: [...C.sage], target: [...C.sage],
      alpha: 0, targetAlpha: 0,
    }))

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: false }
    const onMove = (e) => {
      mouse.tx = e.clientX / w
      mouse.ty = e.clientY / h
      mouse.active = true
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    let bus = backdropBus.get()
    const unsub = backdropBus.subscribe((s) => { bus = s; if (stateRef.current.reduced) drawStatic() })

    const applyGrade = () => {
      const { pathname: path, mobile: isMobile } = stateRef.current
      const dark = document.documentElement.classList.contains('dark')
      const grade = gradeFor(path, bus.gardenMode)
      const palette = dark ? grade.dark : grade.light
      const count = isMobile ? Math.max(3, Math.round(grade.count * 0.6)) : grade.count
      blobs.forEach((b, i) => {
        b.target = palette[i % palette.length]
        b.targetAlpha = i < count ? grade.alpha : 0
      })
      return grade
    }

    let grade = applyGrade()
    const observer = new MutationObserver(() => { grade = applyGrade(); if (stateRef.current.reduced) drawStatic() })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    let t = rand(0, 100)
    const lerp = (a, b, k) => a + (b - a) * k

    const paint = (still = false) => {
      ctx.clearRect(0, 0, w, h)
      for (const b of blobs) {
        // colors + alpha ease toward the current grade → route cross-fade
        b.color = b.color.map((c, i) => lerp(c, b.target[i], still ? 1 : 0.03))
        b.alpha = lerp(b.alpha, b.targetAlpha, still ? 1 : 0.03)
        if (b.alpha < 0.005) continue
        const breathe = 1 + Math.sin(t * b.speed * 1.3 + b.phase) * 0.1
        const x = (b.bx + Math.sin(t * b.speed * grade.speed + b.phase) * b.dx) * w
        const y = (b.by + Math.cos(t * b.speed * 0.8 * grade.speed + b.phase) * b.dy) * h
        const r = b.r * Math.min(w, h) * breathe
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        const [cr, cg, cb] = b.color.map(Math.round)
        g.addColorStop(0, `rgba(${cr},${cg},${cb},${b.alpha})`)
        g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        b._x = x; b._y = y
      }

      // Formula Lab: gold filaments thread between drifting ingredients;
      // a REAL routine conflict pulses them Caution Amber.
      if (grade.filaments) {
        const conflictAge = Date.now() - (bus.conflictPulse || 0)
        const harmonyAge = Date.now() - (bus.harmonyPulse || 0)
        const conflictActive = conflictAge < 1600
        const harmonyActive = harmonyAge < 1600
        const active = blobs.filter((b) => b.alpha > 0.02)
        for (let i = 0; i < active.length; i++) {
          for (let j = i + 1; j < active.length; j++) {
            const a = active[i], c = active[j]
            const dx = a._x - c._x, dy = a._y - c._y
            const dist = Math.hypot(dx, dy)
            const reach = Math.min(w, h) * 0.42
            if (dist > reach) continue
            const near = 1 - dist / reach
            let stroke, alpha
            if (conflictActive) {
              const flicker = 0.5 + 0.5 * Math.sin(t * 26 + i)
              stroke = `rgba(199,154,74,${(0.1 + near * 0.3) * flicker * (1 - conflictAge / 1600)})`
              alpha = 1.4
            } else if (harmonyActive) {
              stroke = `rgba(201,162,39,${(0.12 + near * 0.3) * (1 - harmonyAge / 1600)})`
              alpha = 1.2
            } else {
              stroke = `rgba(201,162,39,${0.03 + near * 0.09})`
              alpha = 0.8
            }
            ctx.strokeStyle = stroke
            ctx.lineWidth = alpha
            ctx.beginPath()
            ctx.moveTo(a._x, a._y)
            ctx.lineTo(c._x, c._y)
            ctx.stroke()
          }
        }
      }

      // cursor ripple — a whisper, not a splash
      if (mouse.active && !still) {
        mouse.x = lerp(mouse.x, mouse.tx, 0.06)
        mouse.y = lerp(mouse.y, mouse.ty, 0.06)
        const rx = mouse.x * w, ry = mouse.y * h
        const rr = Math.min(w, h) * 0.13 * (1 + Math.sin(t * 2) * 0.08)
        const g = ctx.createRadialGradient(rx, ry, rr * 0.55, rx, ry, rr)
        g.addColorStop(0, 'rgba(201,162,39,0)')
        g.addColorStop(0.8, 'rgba(201,162,39,0.05)')
        g.addColorStop(1, 'rgba(201,162,39,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(rx, ry, rr, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const drawStatic = () => {
      grade = applyGrade()
      paint(true)
    }

    let running = !stateRef.current.reduced
    const loop = () => {
      if (!running) return
      t += 0.01
      grade = applyGrade()
      paint()
      raf = requestAnimationFrame(loop)
    }
    if (running) loop()
    else drawStatic()

    const visHandler = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!stateRef.current.reduced && !running) {
        running = true
        loop()
      }
    }
    document.addEventListener('visibilitychange', visHandler)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('visibilitychange', visHandler)
      observer.disconnect()
      unsub()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced])

  // Route changes re-grade via stateRef inside the loop; for reduced motion,
  // repaint one static frame per navigation.
  useEffect(() => {
    if (reduced) {
      // trigger static repaint by nudging the bus (subscribed above)
      backdropBus.set({})
    }
  }, [pathname, reduced])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 h-full w-full pointer-events-none"
    />
  )
}

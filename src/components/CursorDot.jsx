import { useEffect, useRef } from 'react'
import { useHasFinePointer, useReducedMotion } from '../lib/usePrefs'

// Soft-dot cursor: a small gold-ringed dot trails the pointer and blooms
// over anything clickable. Desktop (fine pointer) only.
export default function CursorDot() {
  const fine = useHasFinePointer()
  const reduced = useReducedMotion()
  const dotRef = useRef(null)

  useEffect(() => {
    if (!fine || reduced) {
      document.documentElement.classList.remove('has-cursor-dot')
      return
    }
    document.documentElement.classList.add('has-cursor-dot')
    const dot = dotRef.current
    let x = -100, y = -100, tx = -100, ty = -100
    let hovering = false
    let raf

    const onMove = (e) => {
      tx = e.clientX
      ty = e.clientY
      const el = e.target.closest?.('a, button, [role="button"], input, textarea, select, label, [data-cursor]')
      hovering = Boolean(el)
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    const loop = () => {
      x += (tx - x) * 0.22
      y += (ty - y) * 0.22
      const scale = hovering ? 2.4 : 1
      dot.style.transform = `translate(${x - 6}px, ${y - 6}px) scale(${scale})`
      dot.style.background = hovering
        ? 'color-mix(in srgb, var(--gold) 22%, transparent)'
        : 'color-mix(in srgb, var(--gold) 55%, transparent)'
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-cursor-dot')
    }
  }, [fine, reduced])

  if (!fine || reduced) return null
  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[80] h-3 w-3 rounded-full border border-gold/60 transition-[background] duration-300"
    />
  )
}

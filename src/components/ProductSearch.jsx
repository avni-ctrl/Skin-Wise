import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { searchProducts } from '../services/catalog'
import { spring } from '../lib/easing'

// Organic centered search bar; results drift in with spring physics.
// Reused by Formula Lab, Find a Dupe, Skin Garden and Product Museum.
export default function ProductSearch({ placeholder = 'What product are you curious about?', onSelect, autoFocus = false, compact = false }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    clearTimeout(timer.current)
    if (q.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const rows = await searchProducts(q)
        setResults(rows)
        setSearched(true)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 280)
    return () => clearTimeout(timer.current)
  }, [q])

  return (
    <div className="relative w-full max-w-[620px] mx-auto">
      <div
        className={`flex items-center gap-3 border border-line bg-card/80 backdrop-blur-md shadow-[var(--shadow)] ${
          compact ? 'rounded-2xl px-4 py-2.5' : 'rounded-[2rem] px-6 py-4'
        }`}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--gold2)" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-transparent text-[0.95rem] text-ink outline-none"
        />
        {loading && (
          <motion.span
            className="h-2.5 w-2.5 rounded-full bg-accent"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity }}
          />
        )}
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute z-30 mt-3 w-full overflow-hidden rounded-2xl border border-line bg-card shadow-[var(--shadow)]"
          >
            {results.slice(0, 8).map((p, i) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring.drift, delay: i * 0.045 }}
              >
                <button
                  onClick={() => {
                    onSelect(p)
                    setQ('')
                    setResults([])
                  }}
                  className="flex w-full items-baseline justify-between gap-3 px-5 py-3 text-left hover:bg-accent/10 transition-colors"
                >
                  <span>
                    <span className="block text-[0.9rem] text-ink">{p.name}</span>
                    <span className="block text-[0.72rem] text-ink2">
                      {p.brand?.name}
                      {p.category ? ` · ${p.category}` : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.8rem] text-gold2">
                    {p.price_inr != null ? `₹${p.price_inr.toLocaleString('en-IN')}` : ''}
                  </span>
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {searched && !loading && results.length === 0 && (
        <p className="mt-3 text-center text-[0.8rem] italic text-ink2" style={{ fontFamily: 'var(--font-display)' }}>
          Nothing in the library by that name yet — try another spelling.
        </p>
      )}
    </div>
  )
}

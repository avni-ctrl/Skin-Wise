import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { searchProducts, getProduct } from '../services/catalog'
import { addProductFromWeb } from '../services/lookup'
import { spring } from '../lib/easing'

// Organic centered search bar; results drift in with spring physics.
// Reused by Formula Lab, Find a Dupe, Skin Garden and Product Museum.
export default function ProductSearch({ placeholder = 'What product are you curious about?', onSelect, autoFocus = false, compact = false, webAdd = false }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [web, setWeb] = useState({ state: 'idle', message: '' }) // idle | searching | failed
  const timer = useRef(null)

  useEffect(() => {
    setWeb({ state: 'idle', message: '' })
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

  // Not in our library: search the web, add the product to the database, then open it.
  const searchWeb = async () => {
    const text = q.trim()
    setWeb({ state: 'searching', message: '' })
    const res = await addProductFromWeb(text)
    if (res.status === 'ready' && res.productId) {
      try {
        const product = await getProduct(res.productId)
        setWeb({ state: 'idle', message: '' })
        setQ('')
        setResults([])
        onSelect(product)
        return
      } catch (e) {
        console.error(e)
      }
    }
    const messages = {
      not_found: res.reason === 'not-skincare'
        ? 'That looks like something we do not analyse (hair care, supplements or tools). Try a skincare or makeup product.'
        : 'We could not find a trustworthy ingredient list for that. Try the full name with the brand, e.g. “Brand + product + type”.',
      busy: 'A lot of people are searching today. Please try again tomorrow.',
      unavailable: 'Web search is not switched on yet. Please try again soon.',
    }
    setWeb({ state: 'failed', message: messages[res.status] ?? 'Something went wrong on our side. Please try again in a minute.' })
  }

  const canWeb = webAdd && q.trim().length >= 4

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
            {canWeb && (
              <li className="border-t border-line">
                <button onClick={searchWeb} disabled={web.state === 'searching'} className="w-full px-5 py-3 text-left text-[0.8rem] text-gold2 hover:bg-accent/10 transition-colors">
                  Not the one? Search the web for “{q.trim()}”
                </button>
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>

      {searched && !loading && results.length === 0 && (
        <div className="mt-3 text-center">
          {web.state === 'searching' ? (
            <p className="text-[0.85rem] italic text-ink2" style={{ fontFamily: 'var(--font-display)' }} role="status">
              Searching the web for this product and reading its label… this can take up to a minute.
            </p>
          ) : (
            <>
              <p className="text-[0.8rem] italic text-ink2" style={{ fontFamily: 'var(--font-display)' }}>
                Nothing in the library by that name yet{canWeb ? '.' : ' — try another spelling.'}
              </p>
              {canWeb && (
                <button
                  onClick={searchWeb}
                  className="mt-3 rounded-full bg-accent px-5 py-2 text-[0.8rem] text-bg hover:opacity-90 transition-opacity"
                >
                  Search the web for “{q.trim()}”
                </button>
              )}
            </>
          )}
          {web.state === 'failed' && (
            <p className="mt-3 text-[0.8rem] text-ink2" role="alert">
              {web.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

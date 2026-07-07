import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Logo from './Logo'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { ease } from '../lib/easing'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/formula-lab', label: 'Formula Lab' },
  { to: '/skin-garden', label: 'Skin Garden' },
  { to: '/product-museum', label: 'Product Museum' },
  { to: '/find-a-dupe', label: 'Find a Dupe' },
  { to: '/about', label: 'About' },
]

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative h-8 w-8 rounded-full border border-line grid place-items-center text-gold2 hover:text-gold transition-colors"
    >
      <motion.span
        key={theme}
        initial={{ rotate: -60, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: ease.silk }}
        className="block"
      >
        {dark ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        )}
      </motion.span>
    </button>
  )
}

export default function Nav() {
  const [condensed, setCondensed] = useState(false)
  const [open, setOpen] = useState(false)
  const { session, profile, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 32)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const firstName = profile?.name?.split(' ')[0]

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        condensed
          ? 'py-2 backdrop-blur-xl border-b border-line'
          : 'py-4 border-b border-transparent'
      }`}
      style={{ background: condensed ? 'color-mix(in srgb, var(--bg) 72%, transparent)' : 'transparent' }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 md:px-8">
        <Link to="/" aria-label="SkinWise home" className="shrink-0">
          <Logo size="nav" />
        </Link>

        {/* Desktop links */}
        <nav className="hidden lg:flex items-center gap-7">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `text-[0.82rem] tracking-wide transition-colors ${
                  isActive ? 'text-ink' : 'text-ink2 hover:text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <ThemeToggle />
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-[0.78rem] text-gold2 italic" style={{ fontFamily: 'var(--font-display)' }}>
                Welcome back{firstName ? `, ${firstName}` : ''}
              </span>
              <button
                onClick={() => signOut().then(() => navigate('/'))}
                className="text-[0.78rem] text-ink2 hover:text-ink transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/build"
              className="rounded-full bg-accent px-5 py-2 text-[0.82rem] font-medium text-on-accent shadow-[var(--shadow)] hover:brightness-105 transition"
            >
              Build
            </Link>
          )}
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-3 lg:hidden">
          <ThemeToggle />
          {!session && (
            <Link to="/build" className="rounded-full bg-accent px-4 py-1.5 text-[0.8rem] font-medium text-on-accent">
              Build
            </Link>
          )}
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full border border-line"
          >
            <div className="space-y-[5px]">
              <motion.span animate={{ rotate: open ? 45 : 0, y: open ? 7 : 0 }} className="block h-[1.5px] w-4 bg-ink" />
              <motion.span animate={{ opacity: open ? 0 : 1 }} className="block h-[1.5px] w-4 bg-ink" />
              <motion.span animate={{ rotate: open ? -45 : 0, y: open ? -7 : 0 }} className="block h-[1.5px] w-4 bg-ink" />
            </div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: ease.silk }}
            className="lg:hidden mt-2 mx-4 rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow)]"
          >
            <div className="flex flex-col gap-4">
              {LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => `text-[0.95rem] ${isActive ? 'text-ink' : 'text-ink2'}`}
                >
                  {l.label}
                </NavLink>
              ))}
              {session ? (
                <button
                  onClick={() => { setOpen(false); signOut().then(() => navigate('/')) }}
                  className="text-left text-[0.95rem] text-ink2"
                >
                  Sign out
                </button>
              ) : (
                <Link to="/build" onClick={() => setOpen(false)} className="text-[0.95rem] text-accent font-medium">
                  Build your skin profile →
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}

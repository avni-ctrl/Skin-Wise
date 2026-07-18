import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/formula-lab', label: 'Formula Lab' },
  { to: '/skin-garden', label: 'Skin Garden' },
  { to: '/product-museum', label: 'Product Museum' },
  { to: '/find-a-dupe', label: 'Find a Dupe' },
  { to: '/about', label: 'About' },
]

// Editorial close: an oversized wordmark you almost fall into, then the
// practical rows underneath. Dark emerald in both themes.
export default function Footer() {
  return (
    <footer className="relative z-10 mt-24 overflow-hidden" style={{ background: '#1C3F30', color: '#FBF9F6' }}>
      <div className="mx-auto max-w-[1280px] px-6 pb-10 pt-16 md:px-10">
        <img
          src="/images/logo-transparent.png"
          alt="SkinWise — Know your skin, know your products"
          className="mx-auto w-[min(360px,64vw)] opacity-90"
          style={{ filter: 'brightness(0) invert(1)' }}
        />

        <div className="mt-10 flex flex-col gap-8 border-t border-[rgba(251,249,246,0.16)] pt-8 md:flex-row md:items-start md:justify-between">
          <p
            className="max-w-xs text-[0.7rem] uppercase tracking-[0.24em] text-[rgba(251,249,246,0.65)]"
            style={{ fontFamily: 'var(--font-head)' }}
          >
            Know your skin. Know your products.
          </p>

          <nav className="grid grid-cols-2 gap-x-10 gap-y-3 md:grid-cols-3">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="link-line text-[0.78rem] uppercase tracking-[0.14em] text-[rgba(251,249,246,0.85)] hover:text-[#FBF9F6]"
                style={{ fontFamily: 'var(--font-head)' }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="text-[0.7rem] leading-relaxed text-[rgba(251,249,246,0.55)] md:text-right">
            <p>© {new Date().getFullYear()} SkinWise.</p>
            <p>Informational only — not medical advice.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

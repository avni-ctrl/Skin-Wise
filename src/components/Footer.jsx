import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/formula-lab', label: 'Formula Analysis' },
  { to: '/skin-garden', label: 'Skin Ritual' },
  { to: '/product-museum', label: 'Skin Shelf' },
  { to: '/find-a-dupe', label: 'Dupe Finder' },
  { to: '/about', label: 'About' },
]

// Editorial close: an oversized wordmark you almost fall into, then the
// practical rows underneath. Dark emerald in both themes.
export default function Footer() {
  return (
    <footer className="relative z-10 mt-24 overflow-hidden" style={{ background: '#1C3F30', color: '#FBF9F6' }}>
      <div className="mx-auto max-w-[1280px] px-6 pb-10 pt-16 md:px-10">
        <p className="select-none text-center leading-none">
          <span
            className="text-[4rem] md:text-[6rem]"
            style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, color: '#FBF9F6' }}
          >
            Skin
          </span>
          <span
            className="text-[3.4rem] tracking-[0.06em] md:text-[5.1rem]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: '#C9A227' }}
          >
            WISE
          </span>
        </p>

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

import { Link } from 'react-router-dom'
import Logo from './Logo'

// Restrained on purpose — the eye rests here. No animation.
export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-line mt-24">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-12 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
        <Logo size="nav" withTagline />
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[0.8rem] text-ink2">
          <Link to="/" className="hover:text-ink transition-colors">Home</Link>
          <Link to="/formula-lab" className="hover:text-ink transition-colors">Formula Lab</Link>
          <Link to="/skin-garden" className="hover:text-ink transition-colors">Skin Garden</Link>
          <Link to="/product-museum" className="hover:text-ink transition-colors">Product Museum</Link>
          <Link to="/find-a-dupe" className="hover:text-ink transition-colors">Find a Dupe</Link>
          <Link to="/about" className="hover:text-ink transition-colors">About</Link>
        </nav>
        <div className="text-[0.72rem] text-ink2 text-center md:text-right leading-relaxed">
          <p>© {new Date().getFullYear()} SkinWise.</p>
          <p>Informational only — not medical advice.</p>
        </div>
      </div>
    </footer>
  )
}

import { motion } from 'framer-motion'

// SkinWise-branded bottle illustrations. Every bottle on the site wears the
// house label: italic-serif "SkinWise" over the ingredient name in caps.
// Variants: dropper · pump · jar · tube. Palette-only fills.

const GLASS = {
  amber: { body: '#D9B24A', deep: '#C9A227', lid: '#1C3F30' },
  sage: { body: '#93AC9A', deep: '#7A9A82', lid: '#1C3F30' },
  emerald: { body: '#2E5642', deep: '#1C3F30', lid: '#C9A227' },
  cream: { body: '#EFE6D2', deep: '#E2D5B8', lid: '#1C3F30' },
}

function Label({ x, y, w, h, ingredient, sub, dark = false }) {
  const ink = dark ? '#FBF9F6' : '#1C3F30'
  const gold = dark ? '#C9A227' : '#A99148'
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill={dark ? 'rgba(251,249,246,0.12)' : '#FBF9F6'} stroke={gold} strokeWidth="0.6" />
      <text
        x={x + w / 2}
        y={y + h * 0.36}
        textAnchor="middle"
        fill={ink}
        fontSize={h * 0.26}
        fontStyle="italic"
        fontWeight="600"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        SkinWise
      </text>
      <text
        x={x + w / 2}
        y={y + h * 0.62}
        textAnchor="middle"
        fill={ink}
        fontSize={h * 0.17}
        letterSpacing="0.08em"
        fontWeight="600"
        style={{ fontFamily: 'var(--font-head)', textTransform: 'uppercase' }}
      >
        {ingredient.toUpperCase()}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h * 0.84}
          textAnchor="middle"
          fill={gold}
          fontSize={h * 0.13}
          letterSpacing="0.06em"
          style={{ fontFamily: 'var(--font-head)' }}
        >
          {sub.toUpperCase()}
        </text>
      )}
    </g>
  )
}

function DropperBottle({ c, ingredient, sub }) {
  return (
    <svg viewBox="0 0 64 160" className="h-full w-auto" aria-label={`SkinWise ${ingredient} bottle`}>
      {/* rubber bulb */}
      <ellipse cx="32" cy="12" rx="9" ry="10" fill={c.lid} />
      {/* collar */}
      <rect x="24" y="20" width="16" height="12" rx="2" fill={c.lid} opacity="0.9" />
      {/* pipette hint inside neck */}
      <rect x="30.6" y="32" width="2.8" height="26" fill={c.lid} opacity="0.35" />
      {/* shoulders + body */}
      <path d="M22 32 h20 v10 c8 3 11 9 11 16 v86 c0 6 -5 10 -11 10 h-20 c-6 0 -11 -4 -11 -10 v-86 c0 -7 3 -13 11 -16 z" fill={c.body} />
      <path d="M22 32 h20 v10 c8 3 11 9 11 16 v86 c0 6 -5 10 -11 10 h-20 c-6 0 -11 -4 -11 -10 v-86 c0 -7 3 -13 11 -16 z" fill="none" stroke={c.deep} strokeWidth="1.4" />
      {/* glass highlight */}
      <path d="M18 56 c0 -6 2 -10 6 -12 v100 c-4 -1 -6 -4 -6 -9 z" fill="#FBF9F6" opacity="0.35" />
      <Label x="17" y="76" w="30" h="42" ingredient={ingredient} sub={sub} />
    </svg>
  )
}

function PumpBottle({ c, ingredient, sub }) {
  return (
    <svg viewBox="0 0 64 160" className="h-full w-auto" aria-label={`SkinWise ${ingredient} bottle`}>
      {/* nozzle */}
      <path d="M28 14 h18 c2 0 2 6 0 6 h-10 v6 h-8 z" fill={c.lid} />
      <rect x="26" y="24" width="12" height="10" rx="1.5" fill={c.lid} opacity="0.9" />
      {/* body */}
      <rect x="14" y="34" width="36" height="116" rx="9" fill={c.body} />
      <rect x="14" y="34" width="36" height="116" rx="9" fill="none" stroke={c.deep} strokeWidth="1.4" />
      <path d="M18 46 c0 -4 1 -7 4 -8 v104 c-3 -1 -4 -3 -4 -7 z" fill="#FBF9F6" opacity="0.35" />
      <Label x="19" y="72" w="26" h="44" ingredient={ingredient} sub={sub} dark={c === GLASS.emerald} />
    </svg>
  )
}

function JarPot({ c, ingredient, sub }) {
  return (
    <svg viewBox="0 0 84 96" className="h-full w-auto" aria-label={`SkinWise ${ingredient} jar`}>
      {/* lid */}
      <rect x="14" y="6" width="56" height="16" rx="7" fill={c.lid} />
      <rect x="18" y="20" width="48" height="4" fill={c.deep} opacity="0.6" />
      {/* body */}
      <path d="M12 26 h60 v50 c0 8 -6 14 -14 14 h-32 c-8 0 -14 -6 -14 -14 z" fill={c.body} />
      <path d="M12 26 h60 v50 c0 8 -6 14 -14 14 h-32 c-8 0 -14 -6 -14 -14 z" fill="none" stroke={c.deep} strokeWidth="1.4" />
      <path d="M16 34 c0 -3 1 -5 3 -6 v54 c-2 -1 -3 -3 -3 -6 z" fill="#FBF9F6" opacity="0.35" />
      <Label x="22" y="38" w="40" h="34" ingredient={ingredient} sub={sub} />
    </svg>
  )
}

function TubeStick({ c, ingredient, sub }) {
  return (
    <svg viewBox="0 0 64 160" className="h-full w-auto" aria-label={`SkinWise ${ingredient} tube`}>
      {/* cap it stands on */}
      <rect x="18" y="134" width="28" height="18" rx="4" fill={c.lid} />
      {/* body — crimped at top */}
      <path d="M16 22 l32 0 l-2 -8 l-28 0 z" fill={c.deep} />
      <path d="M14 22 h36 v96 c0 9 -8 16 -18 16 s-18 -7 -18 -16 z" fill={c.body} />
      <path d="M14 22 h36 v96 c0 9 -8 16 -18 16 s-18 -7 -18 -16 z" fill="none" stroke={c.deep} strokeWidth="1.4" />
      <path d="M18 34 c0 -4 1 -6 3 -7 v94 c-2 -1 -3 -3 -3 -6 z" fill="#FBF9F6" opacity="0.35" />
      <Label x="19" y="52" w="26" h="44" ingredient={ingredient} sub={sub} />
    </svg>
  )
}

const VARIANTS = { dropper: DropperBottle, pump: PumpBottle, jar: JarPot, tube: TubeStick }

export default function BottleSprite({
  variant = 'dropper',
  glass = 'amber',
  ingredient,
  sub,
  className = '',
  float = true,
  delay = 0,
}) {
  const Shape = VARIANTS[variant] || DropperBottle
  const c = GLASS[glass] || GLASS.amber
  return (
    <motion.div
      className={className}
      animate={float ? { y: [0, -7, 0], rotate: [0, 1.2, 0] } : undefined}
      transition={float ? { duration: 5.5 + delay, repeat: Infinity, ease: 'easeInOut', delay } : undefined}
      style={{ transformOrigin: '50% 100%' }}
    >
      <Shape c={c} ingredient={ingredient} sub={sub} />
    </motion.div>
  )
}

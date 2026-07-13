// v2 editorial redesign: the goo-filter blob canvas is retired. Pages that
// mounted a LiquidBackdrop now get a still, soft colour field; `bloom` (quiz
// completion) warms it toward champagne. Same props, no animation loop.
export default function LiquidBackdrop({ bloom = false, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`h-full w-full ${className}`}
      style={{
        background: bloom
          ? 'radial-gradient(70% 70% at 50% 45%, color-mix(in srgb, var(--gold) 22%, transparent), transparent 75%)'
          : 'radial-gradient(80% 65% at 30% 25%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%), radial-gradient(60% 55% at 78% 70%, color-mix(in srgb, var(--gold) 8%, transparent), transparent 70%)',
        transition: 'background 1.2s ease',
      }}
    />
  )
}

// Kept for App.jsx compatibility — the goo filter is no longer used.
export function GooFilterDefs() {
  return null
}

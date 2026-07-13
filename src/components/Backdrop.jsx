// v2 editorial redesign: the animated blob canvas is gone. The backdrop is a
// single static wash — photography and typography carry the site now.
export default function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          'radial-gradient(90% 60% at 50% 0%, color-mix(in srgb, var(--accent) 7%, transparent), transparent 70%)',
      }}
    />
  )
}

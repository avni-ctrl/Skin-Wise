import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ease } from '../lib/easing'

// Flower-unfold accordion — petals open with a soft bloom, one at a time.
export default function Accordion({ items, defaultOpen = 0 }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-card/70 backdrop-blur-sm">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="smallcaps text-[0.82rem] text-ink flex items-center gap-3">
                {item.badge != null && (
                  <span
                    className="grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[0.62rem] font-sans tracking-normal"
                    style={{ background: item.badgeColor ?? 'var(--accent)', color: 'var(--on-accent)' }}
                  >
                    {item.badge}
                  </span>
                )}
                {item.title}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.3, ease: ease.silk }}
                className="text-gold2 text-lg leading-none"
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: ease.settle }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-[0.88rem] leading-relaxed text-ink2">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

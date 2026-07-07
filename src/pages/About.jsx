import { motion } from 'framer-motion'
import Headline from '../components/Headline'
import Footer from '../components/Footer'
import { FaceLine } from '../components/Logo'
import { ease } from '../lib/easing'

const BLOCKS = [
  {
    caps: 'the why',
    text: 'Skincare in India is a ₹2-lakh-crore conversation held mostly in whispers and marketing. Labels are written to be skimmed, not understood. We built SkinWise because the truth about a formula shouldn’t need a chemistry degree — it should need two clicks.',
  },
  {
    caps: 'the how',
    text: 'One database, tended by hand: every ingredient catalogued with what it does, whom it suits, and whom it quietly harms. Every verdict on this site is computed from that database against your saved skin profile — never a guess, never a sponsored answer.',
  },
  {
    caps: 'the promise',
    text: 'We will tell you when the ₹349 serum matches the ₹3,400 one. We will tell you when two products in your own routine argue with each other. And we will never diagnose — your dermatologist does medicine; we do reading.',
  },
]

export default function About() {
  return (
    <div className="px-4 pt-32 md:px-8 md:pt-40">
      <div className="mx-auto max-w-[760px]">
        <div className="text-center">
          <p className="tag-caps mb-4">about skinwise</p>
          <Headline lines={[['Skincare,', 'read', ' honestly.']]} />
        </div>

        <div className="mx-auto mt-14 w-24 opacity-80">
          <FaceLine draw className="w-full" />
        </div>

        <div className="mt-14 space-y-16">
          {BLOCKS.map((b, i) => (
            <motion.section
              key={i}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: ease.silk }}
              className={i % 2 ? 'md:pl-24' : 'md:pr-24'}
            >
              <p className="tag-caps mb-4">{b.caps}</p>
              <p className="text-[1.15rem] md:text-[1.35rem] leading-relaxed text-ink" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>
                {b.text}
              </p>
            </motion.section>
          ))}
        </div>

        {/* warm-graded photography placeholder */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mt-20 grid gap-4 sm:grid-cols-3"
        >
          {['linear-gradient(135deg, #e8ddc8, #c9a227aa)', 'linear-gradient(135deg, #7a9a8288, #1c3f3066)', 'linear-gradient(135deg, #fbf9f6, #a9914866)'].map((g, i) => (
            <div key={i} className="aspect-[3/4] rounded-[1.6rem] border border-line" style={{ background: g }} />
          ))}
        </motion.div>
        <p className="mt-3 text-center text-[0.68rem] uppercase tracking-[0.25em] text-ink2">
          golden hour, macro, shallow depth — photography direction
        </p>
      </div>
      <Footer />
    </div>
  )
}

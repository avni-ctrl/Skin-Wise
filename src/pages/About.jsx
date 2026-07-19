import { motion } from 'framer-motion'
import Headline from '../components/Headline'
import Footer from '../components/Footer'
import SpotlightCard from '../components/SpotlightCard'
import { ease } from '../lib/easing'

// The manifesto — numbered like chapters, read like a letter.
const BLOCKS = [
  {
    n: 'I',
    caps: 'the why',
    text: 'Skincare in India is a ₹2-lakh-crore conversation held mostly in whispers and marketing. Labels are written to be skimmed, not understood. We built SkinWise because the truth about a formula shouldn’t need a chemistry degree — it should need two clicks.',
  },
  {
    n: 'II',
    caps: 'the how',
    text: 'One database, tended by hand: every ingredient catalogued with what it does, whom it suits, and whom it quietly harms. Every verdict on this site is computed from that database against your saved skin profile — never a guess, never a sponsored answer.',
  },
  {
    n: 'III',
    caps: 'the promise',
    text: 'We will tell you when the ₹349 serum matches the ₹3,400 one. We will tell you when two products in your own routine argue with each other. And we will never diagnose — your dermatologist does medicine; we do reading.',
  },
]

const VALUES = [
  ['Independent', 'no sponsored verdicts, ever'],
  ['Evidence-first', 'formulas over influencers'],
  ['Climate-aware', 'shelf life tuned to Indian heat'],
  ['Private', 'your skin data stays yours'],
]

export default function About() {
  return (
    <div className="px-4 pt-32 md:px-8 md:pt-40">
      <div className="mx-auto max-w-[880px]">
        <div className="text-center">
          <p className="tag-caps mb-4">about skinwise</p>
          <Headline lines={[['Skincare,', 'read', ' honestly.']]} />
          <p className="mx-auto mt-6 max-w-md text-[0.95rem] leading-relaxed text-ink2">
            A reading room for Indian skincare — built on one database, one skin profile, and a
            refusal to let marketing finish the sentence.
          </p>
        </div>

        {/* the manifesto */}
        <div className="mt-20 space-y-14">
          {BLOCKS.map((b, i) => (
            <motion.section
              key={b.n}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: ease.silk }}
              className="grid gap-4 border-t border-line pt-8 md:grid-cols-[110px_1fr] md:gap-10"
            >
              <div>
                <p className="text-[1.9rem] leading-none" style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>
                  {b.n}
                </p>
                <p className="tag-caps mt-2">{b.caps}</p>
              </div>
              <p className="text-[1.15rem] leading-relaxed text-ink md:text-[1.3rem]" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>
                {b.text}
              </p>
            </motion.section>
          ))}
        </div>

        {/* values strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: ease.silk }}
          className="mt-20 grid gap-6 rounded-[1.8rem] border border-line bg-card/70 p-8 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-4"
        >
          {VALUES.map(([t, d]) => (
            <div key={t} className="border-l-2 border-gold/60 pl-4">
              <p className="text-[0.78rem] uppercase tracking-[0.2em] text-ink" style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>
                {t}
              </p>
              <p className="mt-1.5 text-[0.82rem] italic text-ink2" style={{ fontFamily: 'var(--font-display)' }}>
                {d}
              </p>
            </div>
          ))}
        </motion.div>

        {/* the faces we build for */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mt-20 grid gap-4 sm:grid-cols-3"
        >
          {[
            ['/images/portrait-woman-new.jpg', 'Clear, healthy skin in soft daylight'],
            ['/images/portrait-man-new.jpg', 'Young man with clear skin, editorial light'],
            ['/images/portrait-glow.png', 'Luminous skin in golden hour light'],
          ].map(([src, alt]) => (
            <SpotlightCard key={src}>
              <img src={src} alt={alt} loading="lazy" className="aspect-[3/4] w-full object-cover" />
            </SpotlightCard>
          ))}
        </motion.div>
        <p className="mt-3 text-center text-[0.68rem] uppercase tracking-[0.25em] text-ink2">
          real skin, golden hour — the faces we build for
        </p>

        {/* closing mark */}
        <motion.img
          src="/images/logo-transparent.png"
          alt="SkinWise — Know your skin, know your products"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: ease.silk }}
          className="mx-auto mb-6 mt-24 w-[min(340px,70%)] dark:brightness-0 dark:invert"
        />
      </div>
      <Footer />
    </div>
  )
}

import { motion } from 'framer-motion'
import { ease } from '../lib/easing'

// Signature editorial headline: short confident serif lines, ONE italic word.
// lines = [['Know your', 'skin', '.']] → upright, italic accent, upright tail.
export default function Headline({ lines, size = 'page', className = '', animate = true }) {
  const sizes = {
    hero: 'text-[2.9rem] leading-[1.03] md:text-[4.6rem]',
    page: 'text-[2.5rem] leading-[1.05] md:text-[3.6rem]',
    section: 'text-[1.9rem] leading-[1.08] md:text-[2.6rem]',
  }
  return (
    <h1 className={`headline ${sizes[size]} ${className}`}>
      {lines.map((line, i) => (
        <motion.span
          key={i}
          className="block"
          initial={animate ? { opacity: 0, y: 26 } : false}
          whileInView={animate ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: i * 0.12, ease: ease.silk }}
        >
          {line[0] && <span>{line[0]} </span>}
          {line[1] && <em>{line[1]}</em>}
          {line[2] && <span>{line[2]}</span>}
        </motion.span>
      ))}
    </h1>
  )
}

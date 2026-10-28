import { motion } from 'framer-motion'
import { fadeUp, stagger } from '../../lib/motion'

/** Fades its children up once they scroll into view. */
export function Reveal({ children, className = '', delay = 0, as = 'div' }) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </Tag>
  )
}

/** Container that staggers its <StaggerItem> children into view. */
export function Stagger({ children, className = '', gap = 0.08 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      variants={stagger(gap)}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '', ...rest }) {
  return (
    <motion.div className={className} variants={fadeUp} {...rest}>
      {children}
    </motion.div>
  )
}

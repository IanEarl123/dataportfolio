// Shared Framer Motion variants so every section animates the same way.
const ease = [0.22, 1, 0.36, 1]

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
}

export const stagger = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
})

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
}

export const cardHover = {
  whileHover: { y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  whileTap: { scale: 0.98 },
}

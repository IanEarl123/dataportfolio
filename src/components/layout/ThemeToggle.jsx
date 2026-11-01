import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="icon-btn relative overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.i
          key={theme}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}
        />
      </AnimatePresence>
    </motion.button>
  )
}

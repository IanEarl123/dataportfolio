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
      className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.i
          key={theme}
          initial={{ y: 20, rotate: -90, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -20, rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}
        />
      </AnimatePresence>
    </motion.button>
  )
}

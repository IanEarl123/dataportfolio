import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { Reveal } from './Reveal'

/**
 * Section title. When the admin is signed in, shows a "Manage" pill that
 * jumps to the matching tab of the dashboard.
 */
export default function SectionHeading({ eyebrow, title, subtitle, manageTab, align = 'center' }) {
  const { isAdmin } = useAuth()
  const alignment = align === 'center' ? 'text-center items-center' : 'text-left items-start'

  return (
    <Reveal className={`mb-12 flex flex-col gap-2 ${alignment}`}>
      {eyebrow && <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{eyebrow}</span>}
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white md:text-4xl">{title}</h2>
      {subtitle && <p className="max-w-xl text-sm text-slate-500 dark:text-slate-400 sm:text-base">{subtitle}</p>}
      {isAdmin && manageTab && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          <Link
            to={`/admin?tab=${manageTab}`}
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 transition hover:bg-indigo-600 hover:text-white dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
          >
            <i className="fa-solid fa-pen-to-square" /> Manage
          </Link>
        </motion.div>
      )}
    </Reveal>
  )
}

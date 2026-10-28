import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { usePresence } from '../../context/PresenceContext'
import { useToast } from '../../context/ToastContext'

/** Floating pill shown on public pages while the admin is signed in. */
export default function AdminBar() {
  const { isAdmin, signOut } = useAuth()
  const { onlineCount } = usePresence()
  const toast = useToast()

  return (
    <AnimatePresence>
      {isAdmin && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-4 left-4 z-[150] lg:left-[17rem] flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1.5 pl-4 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90"
        >
          <span className="mr-2 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {onlineCount} live
          </span>
          <Link to="/admin" className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700">
            <i className="fa-solid fa-gauge mr-1.5" />
            Dashboard
          </Link>
          <button
            onClick={async () => {
              await signOut()
              toast.info('Signed out')
            }}
            aria-label="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
          >
            <i className="fa-solid fa-right-from-bracket" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

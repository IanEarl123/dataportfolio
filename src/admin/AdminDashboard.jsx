import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import ThemeToggle from '../components/layout/ThemeToggle'
import AnalyticsPanel from './AnalyticsPanel'
import ResourceManager from './ResourceManager'
import { RESOURCES, RESOURCE_MAP } from './resources'

const TABS = [{ key: 'overview', label: 'Overview', icon: 'fa-solid fa-chart-simple' }, ...RESOURCES]

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = RESOURCE_MAP[params.get('tab')] ? params.get('tab') : 'overview'

  const handleSignOut = async () => {
    await signOut()
    toast.info('Signed out', 'See you next time.')
    navigate('/')
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xl font-bold">
              Ian<span className="text-indigo-600 dark:text-indigo-400">.Admin</span>
            </Link>
            <span className="hidden truncate text-xs text-slate-400 md:inline">{user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="btn-ghost px-3 py-2 text-xs">
              <i className="fa-solid fa-arrow-up-right-from-square" /> <span className="hidden sm:inline">View site</span>
            </Link>
            <ThemeToggle />
            <button onClick={handleSignOut} className="btn-ghost px-3 py-2 text-xs hover:!text-red-600">
              <i className="fa-solid fa-right-from-bracket" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:flex-row">
        <nav className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:w-56 lg:shrink-0 lg:overflow-visible lg:px-0">
          <ul className="flex gap-1 lg:sticky lg:top-24 lg:flex-col">
            {TABS.map((t) => {
              const active = tab === t.key
              return (
                <li key={t.key}>
                  <button
                    onClick={() => setParams(t.key === 'overview' ? {} : { tab: t.key })}
                    className={`relative flex w-full items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                      active ? 'text-white' : 'text-slate-600 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-900'
                    }`}
                  >
                    {active && (
                      <motion.span layoutId="admin-tab" className="absolute inset-0 -z-10 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/25" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                    )}
                    <i className={`${t.icon} w-4 text-center`} />
                    {t.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <section className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {tab === 'overview' ? <AnalyticsPanel /> : <ResourceManager resource={RESOURCE_MAP[tab]} />}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </div>
  )
}

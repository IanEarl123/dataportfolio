import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePageMeta } from '../hooks/usePageMeta'
import ThemeToggle from '../components/layout/ThemeToggle'
import AnalyticsPanel from './AnalyticsPanel'
import ResourceManager from './ResourceManager'
import ProfilePanel from './ProfilePanel'
import CommentsPanel from './CommentsPanel'
import { RESOURCES, RESOURCE_MAP } from './resources'

const PANELS = { overview: AnalyticsPanel, profile: ProfilePanel, comments: CommentsPanel }

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'fa-solid fa-chart-simple' },
  { key: 'profile', label: 'Profile', icon: 'fa-solid fa-id-badge' },
  ...RESOURCES,
  { key: 'comments', label: 'Comments', icon: 'fa-solid fa-comments' },
]

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  usePageMeta('Admin')
  const requested = params.get('tab')
  const tab = RESOURCE_MAP[requested] || PANELS[requested] ? requested : 'overview'
  const Panel = PANELS[tab]

  const handleSignOut = async () => {
    await signOut()
    toast.info('Signed out', 'See you next time.')
    navigate('/')
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass !border-x-0 !border-t-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-mono text-lg font-semibold text-ink">
              Ian<span className="text-accent-ink">.Admin</span>
            </Link>
            <span className="hidden truncate font-mono text-xs text-ink3 md:inline">{user?.email}</span>
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
                      active ? 'text-accent-ink' : 'text-ink2 hover:bg-raised'
                    }`}
                  >
                    {active && (
                      <motion.span layoutId="admin-tab" className="absolute inset-0 -z-10 rounded-xl border border-accent-ink/30 bg-accent/10" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
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
              {Panel ? <Panel /> : <ResourceManager resource={RESOURCE_MAP[tab]} />}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </div>
  )
}

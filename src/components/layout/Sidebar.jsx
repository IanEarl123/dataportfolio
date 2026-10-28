import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import { NAV_LINKS, SOCIALS } from '../../lib/constants'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import AdminLoginModal from '../auth/AdminLoginModal'

const TRIPLE_CLICK_WINDOW_MS = 600

const isActivePath = (pathname, path) =>
  path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`)

/** "Ian.Analyst" logo. Three quick clicks on "Ian" open the admin login. */
function Logo({ onSecret }) {
  const navigate = useNavigate()
  const clicks = useRef({ count: 0, last: 0 })

  const handleSecretClick = () => {
    const now = Date.now()
    const c = clicks.current
    c.count = now - c.last < TRIPLE_CLICK_WINDOW_MS ? c.count + 1 : 1
    c.last = now
    if (c.count >= 3) {
      c.count = 0
      onSecret()
    }
  }

  return (
    <h1 className="select-none text-xl font-bold tracking-tight md:text-2xl">
      <span onClick={handleSecretClick} className="cursor-default text-slate-900 dark:text-white">
        Ian
      </span>
      <button onClick={() => navigate('/')} className="text-indigo-600 dark:text-indigo-400">
        .Analyst
      </button>
    </h1>
  )
}

function NavItems({ pathname, layoutId, onNavigate }) {
  return (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } } }}
      className="flex flex-col gap-1"
    >
      {NAV_LINKS.map((link) => {
        const active = isActivePath(pathname, link.path)
        return (
          <motion.li key={link.path} variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}>
            <NavLink
              to={link.path}
              onClick={onNavigate}
              className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                active ? 'text-white' : 'text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 -z-10 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/25"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <i className={`${link.icon} w-4 text-center transition-transform group-hover:scale-110`} />
              {link.label}
            </NavLink>
          </motion.li>
        )
      })}
    </motion.ul>
  )
}

function Socials() {
  return (
    <div className="flex gap-2">
      {SOCIALS.map((s) => (
        <motion.a
          key={s.label}
          whileHover={{ y: -3 }}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          className={`flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors ${s.hover}`}
        >
          <i className={s.icon} />
        </motion.a>
      ))}
    </div>
  )
}

function TalkButton({ onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        onClick?.()
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
      }}
      className="btn-primary w-full rounded-full"
    >
      <i className="fa-solid fa-paper-plane" /> Let&apos;s Talk
    </motion.button>
  )
}

export default function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 25 })

  useEffect(() => setDrawerOpen(false), [pathname])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const openSecret = () => {
    setDrawerOpen(false)
    if (isAdmin) navigate('/admin')
    else setLoginOpen(true)
  }

  return (
    <>
      {/* Desktop: fixed left sidebar */}
      <aside className="fixed inset-y-0 left-0 z-[100] hidden w-64 flex-col border-r border-slate-200/70 bg-white/70 px-4 py-6 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/70 lg:flex">
        <div className="mb-8 px-4">
          <Logo onSecret={openSecret} />
          <p className="mt-1 text-xs font-medium text-slate-400">Data Analytics Specialist</p>
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto">
          <NavItems pathname={pathname} layoutId="sidebar-pill" />
        </nav>
        <div className="space-y-4 border-t border-slate-200/70 px-2 pt-5 dark:border-slate-800/70">
          <TalkButton />
          <div className="flex items-center justify-between">
            <Socials />
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile / tablet: top bar */}
      <header className="fixed inset-x-0 top-0 z-[100] flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/80 lg:hidden">
        <Logo onSecret={openSecret} />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-xl text-slate-800 dark:text-slate-100"
          >
            <i className="fa-solid fa-bars-staggered" />
          </button>
        </div>
      </header>

      {/* Reading progress */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed left-0 right-0 top-16 z-[101] h-0.5 origin-left bg-gradient-to-r from-indigo-500 to-purple-500 lg:left-64 lg:top-0"
      />

      {/* Mobile drawer, slides in from the left */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[110] bg-slate-950/50 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed inset-y-0 left-0 z-[120] flex w-72 max-w-[85vw] flex-col bg-white px-4 py-5 shadow-2xl dark:bg-slate-950 lg:hidden"
              aria-label="Menu"
            >
              <div className="mb-6 flex items-center justify-between px-4">
                <Logo onSecret={openSecret} />
                <motion.button
                  whileTap={{ scale: 0.9, rotate: 90 }}
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  <i className="fa-solid fa-xmark" />
                </motion.button>
              </div>
              <nav aria-label="Main" className="flex-1 overflow-y-auto">
                <NavItems pathname={pathname} layoutId="drawer-pill" onNavigate={() => setDrawerOpen(false)} />
              </nav>
              <div className="space-y-4 border-t border-slate-100 px-2 pt-5 dark:border-slate-800">
                <TalkButton onClick={() => setDrawerOpen(false)} />
                <Socials />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AdminLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}

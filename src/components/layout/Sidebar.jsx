import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import { CONTACT, NAV_LINKS, SOCIALS } from '../../lib/constants'
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
    <p className="select-none font-mono text-lg font-semibold tracking-tight">
      <span onClick={handleSecretClick} className="cursor-default text-ink">
        Ian
      </span>
      <button onClick={() => navigate('/')} className="text-accent-ink">
        .Analyst
      </button>
    </p>
  )
}

function NavItems({ pathname, layoutId, onNavigate }) {
  return (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } } }}
      className="flex flex-col gap-0.5"
    >
      {NAV_LINKS.map((link, i) => {
        const active = isActivePath(pathname, link.path)
        return (
          <motion.li key={link.path} variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}>
            <NavLink
              to={link.path}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'text-accent-ink' : 'text-ink2 hover:text-ink'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 -z-10 rounded-lg border border-accent-ink/30 bg-accent/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              <span className="w-5 font-mono text-[10px] text-ink3 group-hover:text-cyan-ink">
                {String(i + 1).padStart(2, '0')}
              </span>
              <i className={`${link.icon} w-4 text-center text-xs`} />
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
    <div className="flex gap-1">
      {SOCIALS.map((s) => (
        <motion.a
          key={s.label}
          whileHover={{ y: -2 }}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-ink3 transition-colors hover:text-accent-ink"
        >
          <i className={s.icon} />
        </motion.a>
      ))}
    </div>
  )
}

function TalkButton() {
  return (
    <a href={`mailto:${CONTACT.email}`} className="btn-primary w-full">
      <i className="fa-solid fa-paper-plane text-xs" /> Let&apos;s Talk
    </a>
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
      <aside className="glass fixed inset-y-0 left-0 z-[100] hidden w-60 flex-col !border-y-0 !border-l-0 px-3 py-5 lg:flex">
        <div className="mb-6 px-3">
          <Logo onSecret={openSecret} />
          <p className="mt-1 flex items-center gap-2 font-mono text-[11px] text-ink3">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            data_analyst
          </p>
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto">
          <NavItems pathname={pathname} layoutId="sidebar-pill" />
        </nav>
        <div className="space-y-3 border-t border-line/70 px-1 pt-4">
          <TalkButton />
          <div className="flex items-center justify-between">
            <Socials />
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile / tablet: top bar */}
      <header className="glass fixed inset-x-0 top-0 z-[100] flex h-14 items-center justify-between !border-x-0 !border-t-0 px-4 lg:hidden">
        <Logo onSecret={openSecret} />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            className="icon-btn text-lg text-ink"
          >
            <i className="fa-solid fa-bars-staggered" />
          </button>
        </div>
      </header>

      {/* Reading progress */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed left-0 right-0 top-14 z-[101] h-px origin-left bg-gradient-to-r from-accent to-cyan lg:left-60 lg:top-0"
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
              className="fixed inset-0 z-[110] bg-page/70 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed inset-y-0 left-0 z-[120] flex w-72 max-w-[85vw] flex-col border-r border-line bg-surface px-3 py-4 lg:hidden"
              aria-label="Menu"
            >
              <div className="mb-5 flex items-center justify-between px-3">
                <Logo onSecret={openSecret} />
                <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="icon-btn">
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <nav aria-label="Main" className="flex-1 overflow-y-auto">
                <NavItems pathname={pathname} layoutId="drawer-pill" onNavigate={() => setDrawerOpen(false)} />
              </nav>
              <div className="space-y-3 border-t border-line/70 px-1 pt-4">
                <TalkButton />
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

import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './components/layout/Sidebar'
import Footer from './components/layout/Footer'
import AdminBar from './components/layout/AdminBar'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { Spinner } from './components/ui/States'
import { pageTransition } from './lib/motion'
import { useTrackView } from './hooks/useTrackView'
import Home from './pages/Home'
import About from './components/sections/About'
import Expertise from './components/sections/Expertise'
import Certifications from './components/sections/Certifications'
import Projects from './components/sections/Projects'
import Shop from './components/sections/Shop'
import Experience from './components/sections/Experience'
import Affiliation from './components/sections/Affiliation'
import BlogIndex from './pages/BlogIndex'
import BlogPost from './pages/BlogPost'
import NotFound from './pages/NotFound'

// The dashboard is only for one person, so keep it out of the public bundle.
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))

/** Each public page fills the screen and animates in/out on navigation. */
function Page({ children }) {
  return (
    <motion.main {...pageTransition} className="min-h-screen pt-16 lg:pt-0">
      {children}
    </motion.main>
  )
}

const PUBLIC_PAGES = [
  ['/', Home],
  ['/about', About],
  ['/expertise', Expertise],
  ['/certifications', Certifications],
  ['/projects', Projects],
  ['/blog', BlogIndex],
  ['/blog/:slug', BlogPost],
  ['/shop', Shop],
  ['/experience', Experience],
  ['/affiliation', Affiliation],
]

export default function App() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  useTrackView()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  if (isAdminRoute) {
    return (
      <div className="mesh-bg min-h-screen">
        <ProtectedRoute>
          <Suspense fallback={<Spinner label="Loading dashboard…" />}>
            <motion.div {...pageTransition}>
              <AdminDashboard />
            </motion.div>
          </Suspense>
        </ProtectedRoute>
      </div>
    )
  }

  return (
    <div className="mesh-bg min-h-screen">
      <Sidebar />

      <div className="lg:pl-64">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {PUBLIC_PAGES.map(([path, Component]) => (
              <Route key={path} path={path} element={<Page><Component /></Page>} />
            ))}
            <Route path="*" element={<Page><NotFound /></Page>} />
          </Routes>
        </AnimatePresence>
        <Footer />
      </div>

      <AdminBar />
    </div>
  )
}

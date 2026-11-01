import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './components/layout/Sidebar'
import Footer from './components/layout/Footer'
import AdminBar from './components/layout/AdminBar'
import AmbientBackground from './components/layout/AmbientBackground'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { Spinner } from './components/ui/States'
import { pageTransition } from './lib/motion'
import { useTrackView } from './hooks/useTrackView'
import Home from './pages/Home'

// Everything except the homepage loads on demand to keep the first visit fast.
const About = lazy(() => import('./components/sections/About'))
const Expertise = lazy(() => import('./components/sections/Expertise'))
const Certifications = lazy(() => import('./components/sections/Certifications'))
const Projects = lazy(() => import('./components/sections/Projects'))
const Shop = lazy(() => import('./components/sections/Shop'))
const Experience = lazy(() => import('./components/sections/Experience'))
const Affiliation = lazy(() => import('./components/sections/Affiliation'))
const BlogIndex = lazy(() => import('./pages/BlogIndex'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const NotFound = lazy(() => import('./pages/NotFound'))
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))

/** Each public page fills the screen and animates in/out on navigation. */
function Page({ children }) {
  return (
    <motion.main {...pageTransition} className="min-h-[calc(100vh-3.5rem)] pt-14 lg:pt-0">
      <Suspense fallback={<Spinner />}>{children}</Suspense>
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
      <div className="min-h-screen">
        <AmbientBackground />
        <ProtectedRoute>
          <Suspense fallback={<Spinner label="loading dashboard…" />}>
            <motion.div {...pageTransition}>
              <AdminDashboard />
            </motion.div>
          </Suspense>
        </ProtectedRoute>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AmbientBackground />
      <Sidebar />

      <div className="flex min-h-screen flex-col lg:pl-60">
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

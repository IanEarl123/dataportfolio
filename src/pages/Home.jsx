import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Hero from '../components/sections/Hero'
import StatsAndTerminal from '../components/sections/StatsAndTerminal'
import { NAV_LINKS } from '../lib/constants'
import { usePageMeta } from '../hooks/usePageMeta'

export default function Home() {
  const { hash } = useLocation()
  const navigate = useNavigate()
  usePageMeta()

  // Old one-page links like /#projects now live at /projects.
  useEffect(() => {
    const path = `/${hash.slice(1)}`
    if (hash && NAV_LINKS.some((l) => l.path === path)) navigate(path, { replace: true })
  }, [hash, navigate])

  return (
    <div className="page flex min-h-[calc(100vh-7rem)] flex-col justify-center lg:min-h-[calc(100vh-3.5rem)]">
      <Hero />
      <StatsAndTerminal />
    </div>
  )
}

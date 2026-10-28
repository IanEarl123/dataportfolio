import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Hero from '../components/sections/Hero'
import { NAV_LINKS } from '../lib/constants'

export default function Home() {
  const { hash } = useLocation()
  const navigate = useNavigate()

  // Old one-page links like /#projects now live at /projects.
  useEffect(() => {
    const path = `/${hash.slice(1)}`
    if (hash && NAV_LINKS.some((l) => l.path === path)) navigate(path, { replace: true })
  }, [hash, navigate])

  return <Hero />
}

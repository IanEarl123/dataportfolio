import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Reveal } from './Reveal'

/**
 * Page title with a terminal-style command above it. When the admin is signed
 * in, shows a "Manage" link to the matching tab of the dashboard.
 */
export default function SectionHeading({ command, title, subtitle, manageTab }) {
  const { isAdmin } = useAuth()

  return (
    <Reveal className="mb-10 flex flex-col items-start gap-2">
      {command && (
        <p className="font-mono text-xs text-cyan-ink">
          <span className="text-accent-ink">$</span> {command}
        </p>
      )}
      <h1 className="text-3xl font-bold text-ink md:text-4xl">{title}</h1>
      {subtitle && <p className="max-w-2xl text-sm leading-relaxed text-ink2 sm:text-base">{subtitle}</p>}
      {isAdmin && manageTab && (
        <Link to={`/admin?tab=${manageTab}`} className="btn-ghost mt-1 px-3 py-1 text-xs">
          <i className="fa-solid fa-pen-to-square" /> Manage
        </Link>
      )}
    </Reveal>
  )
}

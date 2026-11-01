import { CONTACT, GITHUB_URL, LINKEDIN_URL } from '../../lib/constants'

const LINKS = [
  { label: CONTACT.email, shortLabel: 'Email', href: `mailto:${CONTACT.email}`, icon: 'fa-solid fa-envelope' },
  { label: 'GitHub', shortLabel: 'GitHub', href: GITHUB_URL, icon: 'fa-brands fa-github', external: true },
  { label: 'LinkedIn', shortLabel: 'LinkedIn', href: LINKEDIN_URL, icon: 'fa-brands fa-linkedin-in', external: true },
]

export default function Footer() {
  return (
    <footer className="border-t border-line/70 bg-surface/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-4 text-xs text-ink3 sm:flex-row sm:px-8">
        <p className="font-mono">© {new Date().getFullYear()} Ian Earl Besañez</p>
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          {LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-accent-ink"
              >
                <i className={l.icon} />
                <span className="hidden sm:inline">{l.label}</span>
                <span className="sm:hidden">{l.shortLabel}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}

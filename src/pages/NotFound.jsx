import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

export default function NotFound() {
  usePageMeta('Page not found')

  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-sm text-cyan-ink">
        <span className="text-accent-ink">$</span> SELECT * FROM pages WHERE path = &apos;here&apos;;
      </p>
      <h1 className="mt-4 bg-gradient-to-r from-accent-ink to-cyan-ink bg-clip-text font-display text-7xl font-bold text-transparent">404</h1>
      <p className="mt-3 font-mono text-sm text-ink3">(0 rows)</p>
      <Link to="/" className="btn-primary mt-8"><i className="fa-solid fa-house text-xs" /> Back home</Link>
    </section>
  )
}

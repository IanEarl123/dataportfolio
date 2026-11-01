import { motion } from 'framer-motion'

export function EmptyState({ icon = 'fa-solid fa-box-open', title = 'Nothing here yet', message = 'Check back soon.' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-12 text-center"
    >
      <i className={`${icon} mb-4 text-2xl text-ink3`} />
      <p className="font-display font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink3">{message}</p>
    </motion.div>
  )
}

export function SkeletonGrid({ count = 3, className = 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3', itemClass = 'h-72' }) {
  return (
    <div className={className} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${itemClass} animate-pulse rounded-2xl bg-raised/70`} />
      ))}
    </div>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink3">
      <i className="fa-solid fa-circle-notch fa-spin text-xl text-accent-ink" />
      <span className="font-mono text-xs">{label}</span>
    </div>
  )
}

import { motion } from 'framer-motion'

export function EmptyState({ icon = 'fa-solid fa-box-open', title = 'Nothing here yet', message = 'Check back soon.' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mx-auto flex max-w-md flex-col items-center rounded-4xl border border-dashed border-slate-200 bg-white/60 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40"
    >
      <i className={`${icon} mb-4 text-3xl text-slate-300 dark:text-slate-600`} />
      <p className="font-bold text-slate-700 dark:text-slate-200">{title}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </motion.div>
  )
}

export function SkeletonGrid({ count = 3, className = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3', itemClass = 'h-72' }) {
  return (
    <div className={className} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${itemClass} animate-pulse rounded-4xl bg-slate-200/70 dark:bg-slate-800/70`} />
      ))}
    </div>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <i className="fa-solid fa-circle-notch fa-spin text-2xl text-indigo-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

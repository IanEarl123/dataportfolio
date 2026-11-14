import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCollection } from '../../hooks/useCollection'
import { usePageMeta } from '../../hooks/usePageMeta'
import SectionHeading from '../ui/SectionHeading'
import FilterChips from '../ui/FilterChips'
import MediaFrame from '../ui/MediaFrame'
import { EmptyState, SkeletonGrid } from '../ui/States'

const STATUS = {
  live: { label: 'Live', className: 'border-accent-ink/40 text-accent-ink' },
  in_progress: { label: 'In progress', className: 'border-amber-400/40 text-amber-600 dark:text-amber-300' },
  coming_soon: { label: 'Coming soon', className: 'border-line text-ink3' },
}

const norm = (s) => s.trim().toLowerCase()

/** One chip per tag, merging spellings like "DAX" and "Dax"; most-used first. */
function collectTags(projects) {
  const tags = new Map()
  for (const p of projects) {
    for (const raw of p.tech_stack ?? []) {
      const key = norm(raw)
      const entry = tags.get(key) ?? { key, label: raw, count: 0 }
      // Prefer the all-caps spelling for acronyms (DAX over Dax).
      if (raw === raw.toUpperCase() && raw.length <= 5) entry.label = raw
      entry.count += 1
      tags.set(key, entry)
    }
  }
  return [...tags.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export default function Projects() {
  usePageMeta('Projects', 'Dashboards, data pipelines and automations built with Power BI, DAX, Excel, SQL, Python and Apps Script.')
  const { data: projects, loading } = useCollection('projects')
  const [tag, setTag] = useState('all')
  const [query, setQuery] = useState('')

  const tags = useMemo(() => collectTags(projects), [projects])
  const q = norm(query)
  const visible = projects.filter(
    (p) =>
      (tag === 'all' || (p.tech_stack ?? []).some((t) => norm(t) === tag)) &&
      (!q || norm(`${p.title} ${p.description ?? ''} ${(p.tech_stack ?? []).join(' ')}`).includes(q)),
  )

  return (
    <div className="page">
      <SectionHeading command="SELECT * FROM projects;" title="Featured Projects" subtitle="Dashboards, pipelines and automations I've built." manageTab="projects" />

      {!loading && projects.length > 0 && (
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <FilterChips
            options={[{ key: 'all', label: 'All', count: projects.length }, ...tags]}
            value={tag}
            onChange={setTag}
            layoutId="project-filter"
            label="Filter projects by technology"
          />
          <div className="relative w-full shrink-0 lg:w-64">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-ink3" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Power BI, DAX, HRIS…"
              aria-label="Search projects"
              className="input pl-9"
            />
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonGrid count={3} />
      ) : projects.length === 0 ? (
        <EmptyState icon="fa-solid fa-diagram-project" title="Projects coming soon" />
      ) : visible.length === 0 ? (
        <EmptyState icon="fa-solid fa-filter-circle-xmark" title="No matching projects" message="Try another technology or search term." />
      ) : (
        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((p) => {
              const status = STATUS[p.status] ?? STATUS.live
              return (
                <motion.article
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  whileHover={{ y: -6 }}
                  className="card card-hover group flex h-full flex-col overflow-hidden"
                >
                  <MediaFrame src={p.image_url} alt={p.title} fit="cover" icon={p.icon || 'fa-solid fa-chart-pie'}>
                    <span className={`absolute right-5 top-5 rounded-md border bg-page/80 px-2 py-0.5 font-mono text-[10px] backdrop-blur ${status.className}`}>
                      {status.label}
                    </span>
                  </MediaFrame>

                  <div className="flex flex-1 flex-col p-5 pt-2">
                    <h2 className="mb-2 text-base font-semibold leading-snug text-ink">{p.title}</h2>
                    <p className="mb-4 flex-grow text-sm leading-relaxed text-ink2">{p.description}</p>

                    {p.tech_stack?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {p.tech_stack.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTag(norm(t))}
                            className={`chip transition-colors hover:border-accent-ink/50 hover:text-accent-ink ${tag === norm(t) ? 'border-accent-ink/50 text-accent-ink' : ''}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}

                    {(p.live_url || p.repo_url) && (
                      <div className="mt-4 flex gap-2">
                        {p.live_url && (
                          <a href={p.live_url} target="_blank" rel="noopener noreferrer" className="btn-primary px-3 py-1.5 text-xs">
                            <i className="fa-solid fa-arrow-up-right-from-square" /> Live
                          </a>
                        )}
                        {p.repo_url && (
                          <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3 py-1.5 text-xs">
                            <i className="fa-brands fa-github" /> Code
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

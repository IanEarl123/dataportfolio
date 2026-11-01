import { motion } from 'framer-motion'
import { useCollection } from '../../hooks/useCollection'
import { usePageMeta } from '../../hooks/usePageMeta'
import { cardHover } from '../../lib/motion'
import SectionHeading from '../ui/SectionHeading'
import { Stagger, StaggerItem } from '../ui/Reveal'
import { EmptyState, SkeletonGrid } from '../ui/States'

const STATUS = {
  live: { label: 'Live', className: 'border-accent-ink/40 text-accent-ink' },
  in_progress: { label: 'In progress', className: 'border-amber-400/40 text-amber-600 dark:text-amber-300' },
  coming_soon: { label: 'Coming soon', className: 'border-line text-ink3' },
}

export default function Projects() {
  usePageMeta('Projects', 'Dashboards, data pipelines and automations built with Power BI, Excel, SQL, Python and Apps Script.')
  const { data: projects, loading } = useCollection('projects')

  return (
    <div className="page">
      <SectionHeading command="SELECT * FROM projects;" title="Featured Projects" subtitle="Dashboards, pipelines and automations I've built." manageTab="projects" />

      {loading ? (
        <SkeletonGrid count={3} />
      ) : projects.length === 0 ? (
        <EmptyState icon="fa-solid fa-diagram-project" title="Projects coming soon" />
      ) : (
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const status = STATUS[p.status] ?? STATUS.live
            return (
              <StaggerItem key={p.id} className="h-full">
                <motion.article {...cardHover} className="card card-hover group flex h-full flex-col overflow-hidden">
                  <div className="relative aspect-video overflow-hidden border-b border-line/70 bg-raised">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="grid-lines flex h-full items-center justify-center">
                        <i className={`${p.icon || 'fa-solid fa-chart-pie'} text-3xl text-accent-ink/70 transition-transform duration-500 group-hover:scale-110`} />
                      </div>
                    )}
                    <span className={`absolute right-3 top-3 rounded-md border bg-page/80 px-2 py-0.5 font-mono text-[10px] backdrop-blur ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="mb-2 text-base font-semibold leading-snug text-ink">{p.title}</h2>
                    <p className="mb-4 flex-grow text-sm leading-relaxed text-ink2">{p.description}</p>

                    {p.tech_stack?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {p.tech_stack.map((t) => (
                          <span key={t} className="chip">{t}</span>
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
              </StaggerItem>
            )
          })}
        </Stagger>
      )}
    </div>
  )
}

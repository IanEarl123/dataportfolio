import { motion } from 'framer-motion'
import { useCollection } from '../../hooks/useCollection'
import { cardHover } from '../../lib/motion'
import SectionHeading from '../ui/SectionHeading'
import { Stagger, StaggerItem } from '../ui/Reveal'
import { EmptyState, SkeletonGrid } from '../ui/States'

const STATUS = {
  live: { label: 'Live', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  in_progress: { label: 'In progress', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  coming_soon: { label: 'Coming soon', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
}

const TILE_TINTS = [
  'bg-blue-50 text-blue-300 dark:bg-blue-500/10',
  'bg-orange-50 text-orange-300 dark:bg-orange-500/10',
  'bg-indigo-50 text-indigo-300 dark:bg-indigo-500/10',
  'bg-emerald-50 text-emerald-300 dark:bg-emerald-500/10',
  'bg-purple-50 text-purple-300 dark:bg-purple-500/10',
  'bg-red-50 text-red-300 dark:bg-red-500/10',
]

export default function Projects() {
  const { data: projects, loading } = useCollection('projects')

  return (
    <section id="projects" className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="Featured Projects" subtitle="Dashboards, pipelines and automations I've built." manageTab="projects" />

        {loading ? (
          <SkeletonGrid count={3} />
        ) : projects.length === 0 ? (
          <EmptyState icon="fa-solid fa-diagram-project" title="Projects coming soon" />
        ) : (
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => {
              const status = STATUS[p.status] ?? STATUS.live
              return (
                <StaggerItem key={p.id} className="h-full">
                  <motion.article {...cardHover} className="card group flex h-full flex-col p-6 hover:border-indigo-200 hover:shadow-xl dark:hover:border-indigo-500/40">
                    <div className="mb-6 aspect-video overflow-hidden rounded-3xl">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className={`flex h-full items-center justify-center ${TILE_TINTS[i % TILE_TINTS.length]}`}>
                          <i className={`${p.icon || 'fa-solid fa-chart-pie'} text-4xl transition-transform duration-500 group-hover:scale-125`} />
                        </div>
                      )}
                    </div>

                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold">{p.title}</h3>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${status.className}`}>{status.label}</span>
                    </div>
                    <p className="mb-5 flex-grow text-sm text-slate-500 dark:text-slate-400">{p.description}</p>

                    {p.tech_stack?.length > 0 && (
                      <div className="mb-5 flex flex-wrap gap-1.5">
                        {p.tech_stack.map((t) => (
                          <span key={t} className="chip">{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex gap-2">
                      {p.live_url && (
                        <a href={p.live_url} target="_blank" rel="noopener noreferrer" className="btn-primary px-4 py-2 text-xs">
                          <i className="fa-solid fa-arrow-up-right-from-square" /> Live
                        </a>
                      )}
                      {p.repo_url && (
                        <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className="btn-ghost px-4 py-2 text-xs">
                          <i className="fa-brands fa-github" /> Code
                        </a>
                      )}
                    </div>
                  </motion.article>
                </StaggerItem>
              )
            })}
          </Stagger>
        )}
      </div>
    </section>
  )
}

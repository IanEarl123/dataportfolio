import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'
import { useCollection } from '../../hooks/useCollection'
import { usePageMeta } from '../../hooks/usePageMeta'
import { formatDate, formatRange } from '../../lib/format'
import SectionHeading from '../ui/SectionHeading'
import { Stagger, StaggerItem } from '../ui/Reveal'
import { EmptyState, SkeletonGrid } from '../ui/States'

export default function Experience() {
  usePageMeta('Experience', 'Work experience and achievements of Ian Earl Besañez in data analysis, operations and HR systems.')
  const { data: jobs, loading } = useCollection('experiences', { orderBy: 'start_date', ascending: false })
  const { data: achievements } = useCollection('achievements')

  return (
    <div className="page max-w-4xl">
      <SectionHeading command="git log --career" title="Experience" subtitle="Where I've worked and what I've delivered." manageTab="experiences" />

      {loading ? (
        <SkeletonGrid count={2} className="grid gap-5" itemClass="h-40" />
      ) : jobs.length === 0 ? (
        <EmptyState icon="fa-solid fa-briefcase" title="Experience timeline coming soon" />
      ) : (
        <Stagger className="relative space-y-5 border-l border-line pl-6 md:pl-8" gap={0.12}>
          {jobs.map((job) => (
            <StaggerItem key={job.id} className="relative">
              <span className="absolute -left-[29px] top-7 h-2.5 w-2.5 rounded-full bg-accent shadow-glow md:-left-[37px]" aria-hidden="true" />
              <motion.article whileHover={{ x: 3 }} className="card card-hover p-5 md:p-7">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <h2 className="text-lg font-semibold leading-snug text-ink">{job.role}</h2>
                  <span className="chip">{formatRange(job.start_date, job.end_date)}</span>
                </div>

                <div className="mt-3 flex items-start gap-3">
                  {job.logo_url && <img src={job.logo_url} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-lg object-contain" />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-accent-ink">{job.company}</p>
                    {job.location && (
                      <p className="mt-1 text-sm leading-relaxed text-ink3">{job.location}</p>
                    )}
                  </div>
                </div>

                {job.description && (
                  <div className="article prose-sm mt-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{job.description}</ReactMarkdown>
                  </div>
                )}
              </motion.article>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {achievements.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-5 flex items-center gap-3 text-xl font-semibold text-ink">
            <i className="fa-solid fa-trophy text-sm text-cyan-ink" /> Achievements
          </h2>
          <Stagger className="grid gap-4 sm:grid-cols-2">
            {achievements.map((a) => (
              <StaggerItem key={a.id}>
                <motion.div whileHover={{ y: -3 }} className="card card-hover flex h-full gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-raised text-accent-ink">
                    <i className={a.icon || 'fa-solid fa-trophy'} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">{a.title}</h3>
                    {a.achieved_on && <p className="font-mono text-[11px] text-ink3">{formatDate(a.achieved_on)}</p>}
                    {a.description && <p className="mt-1 text-sm leading-relaxed text-ink2">{a.description}</p>}
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}
    </div>
  )
}

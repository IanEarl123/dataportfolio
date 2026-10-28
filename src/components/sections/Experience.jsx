import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'
import { useCollection } from '../../hooks/useCollection'
import { formatDate, formatRange } from '../../lib/format'
import SectionHeading from '../ui/SectionHeading'
import { Stagger, StaggerItem } from '../ui/Reveal'
import { EmptyState, SkeletonGrid } from '../ui/States'

export default function Experience() {
  const { data: jobs, loading } = useCollection('experiences', { orderBy: 'start_date', ascending: false })
  const { data: achievements } = useCollection('achievements')

  return (
    <section id="experience" className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-4xl">
        <SectionHeading title="Experience" subtitle="Where I've worked and what I've delivered." manageTab="experiences" />

        {loading ? (
          <SkeletonGrid count={2} className="grid gap-6" itemClass="h-40" />
        ) : jobs.length === 0 ? (
          <EmptyState icon="fa-solid fa-briefcase" title="Experience timeline coming soon" />
        ) : (
          <Stagger className="relative space-y-8 border-l-2 border-indigo-100 pl-8 dark:border-indigo-500/20 md:pl-10" gap={0.12}>
            {jobs.map((job) => (
              <StaggerItem key={job.id} className="relative">
                <motion.span
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="absolute -left-[43px] top-6 flex h-5 w-5 items-center justify-center rounded-full border-4 border-slate-50 bg-indigo-600 dark:border-slate-950 md:-left-[51px]"
                />
                <motion.div whileHover={{ x: 6 }} className="card p-6 hover:shadow-lg md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-4">
                      {job.logo_url && <img src={job.logo_url} alt="" className="h-12 w-12 rounded-xl object-contain" />}
                      <div>
                        <h3 className="text-lg font-bold">{job.role}</h3>
                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                          {job.company}
                          {job.location && <span className="font-normal text-slate-400"> · {job.location}</span>}
                        </p>
                      </div>
                    </div>
                    <span className="chip">{formatRange(job.start_date, job.end_date)}</span>
                  </div>
                  {job.description && (
                    <div className="prose prose-sm prose-slate mt-4 max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{job.description}</ReactMarkdown>
                    </div>
                  )}
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {achievements.length > 0 && (
          <div className="mt-16">
            <h3 className="mb-6 flex items-center gap-3 text-xl font-bold">
              <i className="fa-solid fa-trophy text-amber-500" /> Achievements
            </h3>
            <Stagger className="grid gap-4 sm:grid-cols-2">
              {achievements.map((a) => (
                <StaggerItem key={a.id}>
                  <motion.div whileHover={{ y: -4 }} className="card flex h-full gap-4 rounded-3xl p-5 hover:shadow-lg">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
                      <i className={a.icon || 'fa-solid fa-trophy'} />
                    </div>
                    <div>
                      <h4 className="font-bold">{a.title}</h4>
                      {a.achieved_on && <p className="text-xs font-semibold text-slate-400">{formatDate(a.achieved_on)}</p>}
                      {a.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{a.description}</p>}
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        )}
      </div>
    </section>
  )
}

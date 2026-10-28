import { motion } from 'framer-motion'
import { useCollection } from '../../hooks/useCollection'
import { formatRange } from '../../lib/format'
import { cardHover } from '../../lib/motion'
import SectionHeading from '../ui/SectionHeading'
import { Stagger, StaggerItem } from '../ui/Reveal'
import { EmptyState, SkeletonGrid } from '../ui/States'

export default function Affiliation() {
  const { data: orgs, loading } = useCollection('affiliations')

  return (
    <section id="affiliation" className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="Affiliations" subtitle="Organizations and communities I'm part of." manageTab="affiliations" />

        {loading ? (
          <SkeletonGrid count={3} itemClass="h-44" />
        ) : orgs.length === 0 ? (
          <EmptyState icon="fa-solid fa-people-group" title="Affiliations coming soon" />
        ) : (
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => {
              const range = formatRange(org.start_date, org.end_date)
              const Wrapper = org.url ? motion.a : motion.div
              const linkProps = org.url ? { href: org.url, target: '_blank', rel: 'noopener noreferrer' } : {}
              return (
                <StaggerItem key={org.id} className="h-full">
                  <Wrapper {...cardHover} {...linkProps} className="card group flex h-full flex-col p-6 hover:border-indigo-200 hover:shadow-xl dark:hover:border-indigo-500/40">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
                        {org.logo_url ? (
                          <img src={org.logo_url} alt="" className="h-full w-full object-contain p-1" />
                        ) : (
                          <i className="fa-solid fa-people-group text-xl text-indigo-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold leading-snug transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {org.organization}
                          {org.url && <i className="fa-solid fa-arrow-up-right-from-square ml-2 text-[10px] text-slate-400" />}
                        </h3>
                        {org.role && <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{org.role}</p>}
                      </div>
                    </div>
                    {org.details && <p className="flex-grow text-sm text-slate-500 dark:text-slate-400">{org.details}</p>}
                    {range && <span className="chip mt-4 self-start">{range}</span>}
                  </Wrapper>
                </StaggerItem>
              )
            })}
          </Stagger>
        )}
      </div>
    </section>
  )
}

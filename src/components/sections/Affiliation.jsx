import { motion } from 'framer-motion'
import { useCollection } from '../../hooks/useCollection'
import { usePageMeta } from '../../hooks/usePageMeta'
import { formatRange } from '../../lib/format'
import { cardHover } from '../../lib/motion'
import SectionHeading from '../ui/SectionHeading'
import { Stagger, StaggerItem } from '../ui/Reveal'
import { EmptyState, SkeletonGrid } from '../ui/States'

export default function Affiliation() {
  usePageMeta('Affiliations', "Organizations and communities Ian Earl Besañez is part of.")
  const { data: orgs, loading } = useCollection('affiliations')

  return (
    <div className="page">
      <SectionHeading command="cat /etc/group" title="Affiliations" subtitle="Organizations and communities I'm part of." manageTab="affiliations" />

      {loading ? (
        <SkeletonGrid count={3} itemClass="h-44" />
      ) : orgs.length === 0 ? (
        <EmptyState icon="fa-solid fa-people-group" title="Affiliations coming soon" />
      ) : (
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => {
            const range = formatRange(org.start_date, org.end_date)
            const Wrapper = org.url ? motion.a : motion.div
            const linkProps = org.url ? { href: org.url, target: '_blank', rel: 'noopener noreferrer' } : {}
            return (
              <StaggerItem key={org.id} className="h-full">
                <Wrapper {...cardHover} {...linkProps} className="card card-hover group flex h-full flex-col p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-raised">
                      {org.logo_url ? (
                        <img src={org.logo_url} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
                      ) : (
                        <i className="fa-solid fa-people-group text-ink3" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-accent-ink">
                        {org.organization}
                        {org.url && <i className="fa-solid fa-arrow-up-right-from-square ml-2 text-[10px] text-ink3" />}
                      </h2>
                      {org.role && <p className="text-xs text-cyan-ink">{org.role}</p>}
                    </div>
                  </div>
                  {org.details && <p className="flex-grow text-sm leading-relaxed text-ink2">{org.details}</p>}
                  {range && <span className="chip mt-3 self-start">{range}</span>}
                </Wrapper>
              </StaggerItem>
            )
          })}
        </Stagger>
      )}
    </div>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCollection } from '../../hooks/useCollection'
import { usePageMeta } from '../../hooks/usePageMeta'
import { formatDate } from '../../lib/format'
import { cardHover } from '../../lib/motion'
import SectionHeading from '../ui/SectionHeading'
import { Stagger, StaggerItem } from '../ui/Reveal'
import { EmptyState, SkeletonGrid } from '../ui/States'
import Modal from '../ui/Modal'

export default function Certifications() {
  usePageMeta('Certifications', 'Professional certifications and courses in data science, spreadsheets and automation.')
  const { data: certs, loading } = useCollection('certificates')
  const [selected, setSelected] = useState(null)

  return (
    <div className="page">
      <SectionHeading command="ls ./certificates" title="Certifications" subtitle="Professional skills and achievements." manageTab="certificates" />

      {loading ? (
        <SkeletonGrid count={4} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" itemClass="h-64" />
      ) : certs.length === 0 ? (
        <EmptyState icon="fa-solid fa-award" title="Certifications coming soon" />
      ) : (
        <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {certs.map((cert) => (
            <StaggerItem key={cert.id} className="h-full">
              <motion.button {...cardHover} onClick={() => setSelected(cert)} className="card card-hover group flex h-full w-full flex-col overflow-hidden text-left">
                <div className="aspect-[4/3] w-full overflow-hidden bg-raised">
                  {cert.image_url ? (
                    <img src={cert.image_url} alt={cert.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <i className="fa-solid fa-award text-4xl text-ink3" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-mono text-[11px] text-cyan-ink">{cert.issuer}</p>
                  <h2 className="mt-1 text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-accent-ink">{cert.title}</h2>
                </div>
              </motion.button>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Certificate" size="lg">
        {selected && (
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            {selected.image_url && <img src={selected.image_url} alt={selected.title} className="w-full rounded-xl border border-line md:w-1/2" />}
            <div className="w-full md:w-1/2">
              <span className="font-mono text-xs text-cyan-ink">
                {selected.issuer}
                {selected.issue_date && ` • ${formatDate(selected.issue_date, { year: 'numeric' })}`}
              </span>
              <h3 className="mb-3 mt-2 text-2xl font-bold text-ink">{selected.title}</h3>
              {selected.description && <p className="mb-5 text-sm leading-relaxed text-ink2">{selected.description}</p>}
              {selected.credential_url && (
                <a href={selected.credential_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  <i className="fa-solid fa-certificate" /> Verify Credential
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

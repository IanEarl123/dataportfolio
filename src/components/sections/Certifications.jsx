import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCollection } from '../../hooks/useCollection'
import { usePageMeta } from '../../hooks/usePageMeta'
import { formatDate } from '../../lib/format'
import SectionHeading from '../ui/SectionHeading'
import FilterChips from '../ui/FilterChips'
import { EmptyState, SkeletonGrid } from '../ui/States'
import Modal from '../ui/Modal'
import MediaFrame from '../ui/MediaFrame'

const UNSORTED = 'other'

export default function Certifications() {
  usePageMeta('Certifications', 'Professional certifications and courses in data analysis, AI, engineering and more.')
  const { data: certs, loading } = useCollection('certificates')
  const { data: sections } = useCollection('cert_sections')
  const [section, setSection] = useState('all')
  const [selected, setSelected] = useState(null)

  // Only sections that have certificates get a chip; certificates without one go under "Other".
  const options = useMemo(() => {
    const count = (id) => certs.filter((c) => (c.section_id ?? UNSORTED) === id).length
    const list = sections.map((s) => ({ key: s.id, label: s.name, count: count(s.id) })).filter((o) => o.count > 0)
    const other = count(UNSORTED)
    if (list.length && other) list.push({ key: UNSORTED, label: 'Other', count: other })
    return list.length ? [{ key: 'all', label: 'All', count: certs.length }, ...list] : []
  }, [certs, sections])

  const sectionName = (id) => sections.find((s) => s.id === id)?.name
  const visible = section === 'all' ? certs : certs.filter((c) => (c.section_id ?? UNSORTED) === section)

  return (
    <div className="page">
      <SectionHeading command="ls ./certificates" title="Certifications" subtitle="Professional skills and achievements." manageTab="certificates" />

      {options.length > 0 && (
        <div className="mb-8">
          <FilterChips options={options} value={section} onChange={setSection} layoutId="cert-filter" label="Filter certificates by section" />
        </div>
      )}

      {loading ? (
        <SkeletonGrid count={5} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" itemClass="h-48" />
      ) : certs.length === 0 ? (
        <EmptyState icon="fa-solid fa-award" title="Certifications coming soon" />
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <AnimatePresence mode="popLayout">
            {visible.map((cert, i) => (
              <motion.button
                key={cert.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(i * 0.04, 0.3) } }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(cert)}
                className="card card-hover group flex h-full flex-col overflow-hidden text-left"
              >
                <MediaFrame src={cert.image_url} alt={cert.title} icon="fa-solid fa-award" />
                <div className="flex flex-1 flex-col p-3 pt-1">
                  <p className="truncate font-mono text-[10px] text-cyan-ink">{cert.issuer}</p>
                  <h2 className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-ink transition-colors group-hover:text-accent-ink">{cert.title}</h2>
                  {cert.section_id && sectionName(cert.section_id) && (
                    <span className="mt-auto pt-2 font-mono text-[10px] text-ink3">#{sectionName(cert.section_id)}</span>
                  )}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Certificate" size="lg">
        {selected && (
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            {selected.image_url && (
              <div className="media-panel w-full rounded-xl p-6 md:w-1/2">
                <img src={selected.image_url} alt={selected.title} className="media-img mx-auto max-h-[60vh] w-auto max-w-full object-contain" />
              </div>
            )}
            <div className="w-full md:w-1/2">
              <span className="font-mono text-xs text-cyan-ink">
                {selected.issuer}
                {selected.issue_date && ` • ${formatDate(selected.issue_date, { year: 'numeric' })}`}
                {selected.section_id && sectionName(selected.section_id) && ` • ${sectionName(selected.section_id)}`}
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

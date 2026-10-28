import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCollection } from '../../hooks/useCollection'
import { formatDate } from '../../lib/format'
import { cardHover } from '../../lib/motion'
import SectionHeading from '../ui/SectionHeading'
import { Stagger, StaggerItem } from '../ui/Reveal'
import { EmptyState, SkeletonGrid } from '../ui/States'
import Modal from '../ui/Modal'

export default function Certifications() {
  const { data: certs, loading } = useCollection('certificates')
  const [selected, setSelected] = useState(null)

  return (
    <section id="certifications" className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="Certifications" subtitle="Professional skills and achievements." manageTab="certificates" />

        {loading ? (
          <SkeletonGrid count={4} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" itemClass="h-64" />
        ) : certs.length === 0 ? (
          <EmptyState icon="fa-solid fa-award" title="Certifications coming soon" />
        ) : (
          <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {certs.map((cert) => (
              <StaggerItem key={cert.id}>
                <motion.button
                  {...cardHover}
                  onClick={() => setSelected(cert)}
                  className="card group w-full p-4 text-left hover:border-indigo-200 hover:shadow-xl dark:hover:border-indigo-500/40"
                >
                  <div className="mb-4 aspect-square overflow-hidden rounded-[1.5rem] bg-slate-100 dark:bg-slate-800">
                    {cert.image_url ? (
                      <img
                        src={cert.image_url}
                        alt={cert.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <i className="fa-solid fa-award text-5xl text-indigo-200 dark:text-indigo-500/40" />
                      </div>
                    )}
                  </div>
                  <p className="px-2 text-center text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {cert.issuer}
                  </p>
                  <h3 className="mt-1 px-2 text-center text-sm font-bold transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {cert.title}
                  </h3>
                </motion.button>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Certificate" size="lg">
        {selected && (
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            {selected.image_url && (
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={selected.image_url}
                alt={selected.title}
                className="w-full rounded-2xl border border-slate-100 shadow-lg dark:border-slate-800 md:w-1/2"
              />
            )}
            <div className="w-full md:w-1/2">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {selected.issuer}
                {selected.issue_date && ` • ${formatDate(selected.issue_date, { year: 'numeric' })}`}
              </span>
              <h3 className="mb-4 mt-2 text-2xl font-extrabold">{selected.title}</h3>
              {selected.description && <p className="mb-6 leading-relaxed text-slate-600 dark:text-slate-400">{selected.description}</p>}
              {selected.credential_url && (
                <a href={selected.credential_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  <i className="fa-solid fa-certificate" /> Verify Credential
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

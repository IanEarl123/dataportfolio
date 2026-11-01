import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Modal from '../ui/Modal'

/** Responsive photo grid for a blog post, with a click-to-enlarge viewer. */
export default function PostGallery({ images = [], title }) {
  const [index, setIndex] = useState(null)
  const open = index !== null
  const step = (delta) => setIndex((i) => (i + delta + images.length) % images.length)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (images.length === 0) return null

  return (
    <section className="mt-10" aria-label="Photos">
      <h2 className="mb-4 font-mono text-xs text-ink3">
        <span className="text-accent-ink">$</span> ls ./photos <span className="text-ink3">({images.length})</span>
      </h2>
      <div className={`grid gap-3 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {images.map((src, i) => (
          <motion.button
            key={src}
            whileHover={{ y: -2 }}
            onClick={() => setIndex(i)}
            aria-label={`Open photo ${i + 1} of ${images.length}`}
            className="group aspect-[4/3] overflow-hidden rounded-xl border border-line bg-raised"
          >
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </motion.button>
        ))}
      </div>

      <Modal open={open} onClose={() => setIndex(null)} title={open ? `Photo ${index + 1} of ${images.length}` : ''} size="lg">
        {open && (
          <div className="relative">
            <img src={images[index]} alt={`${title}, photo ${index + 1}`} className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg" />
            {images.length > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => step(-1)}>
                  <i className="fa-solid fa-arrow-left" /> Previous
                </button>
                <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => step(1)}>
                  Next <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  )
}

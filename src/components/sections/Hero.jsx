import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RESUME_FILENAME, RESUME_URL, SOCIALS, TYPED_STRINGS } from '../../lib/constants'
import { useTypewriter } from '../../hooks/useTypewriter'
import { useToast } from '../../context/ToastContext'
import { stagger, fadeUp } from '../../lib/motion'
import FollowingPortrait from './FollowingPortrait'

export default function Hero() {
  const typed = useTypewriter(TYPED_STRINGS)
  const toast = useToast()
  const [downloaded, setDownloaded] = useState(false)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = RESUME_URL
    link.download = RESUME_FILENAME
    document.body.appendChild(link)
    link.click()
    link.remove()
    setDownloaded(true)
    toast.success('Download started', 'Thanks for checking out my CV!')
    setTimeout(() => setDownloaded(false), 1800)
  }

  return (
    <section id="home" className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12 lg:min-h-screen">
      <div className="grid w-full max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="order-first flex justify-center md:order-last"
        >
          <FollowingPortrait src="/img/ian.jpg" alt="Ian Earl Besañez" />
        </motion.div>

        <motion.div initial="hidden" animate="show" variants={stagger(0.12, 0.1)} className="text-center md:text-left">
          <motion.span variants={fadeUp} className="mb-3 block text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Data Analytics Specialist
          </motion.span>
          <motion.h1 variants={fadeUp} className="text-4xl font-extrabold leading-[1.1] sm:text-5xl md:text-6xl">
            Hi, I&apos;m <br />
            <span className="text-indigo-600 dark:text-indigo-400">{typed}</span>
            <span className="ml-1 inline-block w-[3px] animate-pulse bg-indigo-600 align-middle dark:bg-indigo-400" style={{ height: '0.9em' }} />
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base md:mx-0">
            Converting raw data and field-level data into high-impact visual stories. Specialized in automated reporting
            pipelines and creating visual reports.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row md:justify-start">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className={`relative flex w-full min-w-[210px] items-center justify-center gap-3 overflow-hidden rounded-xl px-8 py-4 font-bold text-white shadow-xl transition-colors sm:w-auto ${
                downloaded ? 'bg-emerald-600' : 'bg-slate-900 dark:bg-indigo-600'
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {downloaded ? (
                  <motion.span key="done" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                    <i className="fa-solid fa-circle-check" /> Downloaded
                  </motion.span>
                ) : (
                  <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ x: 80, opacity: 0 }} className="flex items-center gap-3">
                    <i className="fa-solid fa-file-pdf text-red-400" /> Download CV
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <motion.a
                  key={s.label}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors dark:border-slate-700 dark:bg-slate-900 ${s.hover}`}
                >
                  <i className={`${s.icon} text-lg`} />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

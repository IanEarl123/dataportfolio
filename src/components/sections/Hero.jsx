import { useState } from 'react'
import { motion } from 'framer-motion'
import { CORE_STACK, GITHUB_URL, LINKEDIN_URL, RESUME_FILENAME, RESUME_URL, TYPED_STRINGS } from '../../lib/constants'
import { useTypewriter } from '../../hooks/useTypewriter'
import { useToast } from '../../context/ToastContext'
import { useSite } from '../../context/SiteContext'
import { stagger, fadeUp } from '../../lib/motion'
import FollowingPortrait from './FollowingPortrait'

export default function Hero() {
  const typed = useTypewriter(TYPED_STRINGS, { typeSpeed: 45, backSpeed: 22, pause: 1800 })
  const toast = useToast()
  const { profileImage } = useSite()
  const [downloaded, setDownloaded] = useState(false)

  const handleDownload = () => {
    setDownloaded(true)
    toast.success('Download started', 'Thanks for checking out my CV!')
    setTimeout(() => setDownloaded(false), 1800)
  }

  return (
    <section className="grid items-center gap-10 md:grid-cols-[1fr_auto] md:gap-14">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="order-first flex justify-center md:order-last"
      >
        <FollowingPortrait src={profileImage} alt="Ian Earl Besañez" />
      </motion.div>

      <motion.div initial="hidden" animate="show" variants={stagger(0.1, 0.05)} className="min-w-0 text-center md:text-left">
        <motion.p variants={fadeUp} className="mb-3 font-mono text-xs text-ink3">
          <span className="text-accent-ink">$</span> whoami
        </motion.p>
        <motion.p variants={fadeUp} className="font-display text-lg font-semibold text-ink2">
          Ian Earl Besañez
        </motion.p>
        <motion.h1 variants={fadeUp} className="mt-1 text-5xl font-bold leading-none sm:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-r from-accent-ink to-cyan-ink bg-clip-text text-transparent">Data Analyst</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-4 font-mono text-sm text-ink2 sm:text-base">
          {CORE_STACK.join(' • ')}
        </motion.p>
        <motion.p variants={fadeUp} className="mt-4 h-6 font-mono text-sm text-accent-ink" aria-label={TYPED_STRINGS[0]}>
          <span className="text-ink3">&gt; </span>
          <span className="caret">{typed}</span>
        </motion.p>
        <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-ink2 sm:text-base md:mx-0">
          I turn raw operational data into dashboards, automations and clear decisions, from Excel models and Power BI
          reports to SQL pipelines.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center justify-center gap-3 md:justify-start">
          <motion.a
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            href={RESUME_URL}
            download={RESUME_FILENAME}
            onClick={handleDownload}
            className="btn-primary px-6 py-3"
          >
            <i className={downloaded ? 'fa-solid fa-circle-check' : 'fa-solid fa-file-arrow-down'} />
            {downloaded ? 'Downloaded' : 'Download CV'}
          </motion.a>
          <motion.a whileHover={{ y: -2 }} href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost py-3">
            <i className="fa-brands fa-github" /> GitHub
          </motion.a>
          <motion.a whileHover={{ y: -2 }} href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost py-3">
            <i className="fa-brands fa-linkedin-in" /> LinkedIn
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  )
}

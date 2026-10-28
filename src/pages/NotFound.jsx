import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <motion.p
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-8xl font-extrabold text-transparent"
      >
        404
      </motion.p>
      <p className="mt-4 text-slate-500">This page doesn&apos;t exist (yet).</p>
      <Link to="/" className="btn-primary mt-8"><i className="fa-solid fa-house" /> Back home</Link>
    </section>
  )
}

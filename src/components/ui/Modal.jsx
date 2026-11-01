import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

const SIZES = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' }

export default function Modal({ open, onClose, title, size = 'md', children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-page/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={`relative flex max-h-[92vh] w-full ${SIZES[size]} flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-2xl sm:rounded-2xl`}
          >
            <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
              <h2 className="text-lg font-semibold text-ink">{title}</h2>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised text-ink2 transition-colors hover:bg-red-500 hover:text-white"
              >
                <i className="fa-solid fa-xmark" />
              </motion.button>
            </div>
            <div className="overflow-y-auto px-6 py-6">{children}</div>
            {footer && (
              <div className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

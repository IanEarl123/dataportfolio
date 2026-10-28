import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const ToastContext = createContext(null)

const STYLES = {
  success: { icon: 'fa-solid fa-circle-check', accent: 'text-emerald-500', bar: 'bg-emerald-500' },
  error: { icon: 'fa-solid fa-circle-exclamation', accent: 'text-red-500', bar: 'bg-red-500' },
  info: { icon: 'fa-solid fa-circle-info', accent: 'text-indigo-500', bar: 'bg-indigo-500' },
}

const DURATION = 4000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback(
    (type, title, description) => {
      const id = ++idRef.current
      setToasts((t) => [...t.slice(-3), { id, type, title, description }])
      setTimeout(() => dismiss(id), DURATION)
    },
    [dismiss],
  )

  const toast = useMemo(
    () => ({
      success: (title, description) => push('success', title, description),
      error: (title, description) => push('error', title, description),
      info: (title, description) => push('info', title, description),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ol
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 left-4 sm:left-auto z-[400] flex flex-col gap-3 sm:w-96"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const s = STYLES[t.type]
            return (
              <motion.li
                key={t.id}
                layout
                initial={{ opacity: 0, x: 60, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="pointer-events-auto relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 pr-10 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex gap-3">
                  <i className={`${s.icon} ${s.accent} mt-0.5 text-lg`} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</p>
                    {t.description && (
                      <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">{t.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
                <motion.span
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: DURATION / 1000, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 h-1 w-full origin-left ${s.bar}`}
                />
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ol>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

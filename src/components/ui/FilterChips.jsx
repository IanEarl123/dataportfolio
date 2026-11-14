import { motion } from 'framer-motion'

/** Row of filter buttons with a sliding highlight. options: [{ key, label, count? }] */
export default function FilterChips({ options, value, onChange, layoutId, label }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {options.map((o) => {
        const active = value === o.key
        return (
          <motion.button
            key={o.key}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(o.key)}
            aria-pressed={active}
            className={`relative rounded-lg px-3 py-1 font-mono text-xs transition-colors ${active ? 'text-accent-ink' : 'text-ink3 hover:text-ink'}`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-lg border border-accent-ink/40 bg-accent/10"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            )}
            {o.label}
            {o.count !== undefined && <span className="ml-1.5 text-ink3">{o.count}</span>}
          </motion.button>
        )
      })}
    </div>
  )
}

import { motion } from 'framer-motion'

/** Animated on/off switch. */
export default function Toggle({ checked, onChange, label, disabled = false, size = 'md' }) {
  const dims = size === 'sm' ? { track: 'h-6 w-11', knob: 'h-4 w-4', pad: 'p-1' } : { track: 'h-7 w-12', knob: 'h-5 w-5', pad: 'p-1' }

  return (
    <label className={`inline-flex items-center gap-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`flex ${dims.track} ${dims.pad} shrink-0 items-center rounded-full transition-colors ${
          checked ? 'justify-end bg-indigo-600' : 'justify-start bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 700, damping: 35 }}
          className={`${dims.knob} rounded-full bg-white shadow`}
        />
      </button>
      {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
    </label>
  )
}

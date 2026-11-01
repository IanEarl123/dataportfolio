import { useEffect, useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'

/**
 * Tracks the pointer anywhere on the page and returns spring-smoothed values
 * in the range -1..1, relative to the given element's center.
 */
function usePointerFollow(ref) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const spring = { stiffness: 140, damping: 18, mass: 0.6 }
  const sx = useSpring(x, spring)
  const sy = useSpring(y, spring)

  useEffect(() => {
    let idle
    const clamp = (v) => Math.max(-1, Math.min(1, v))

    const onMove = (e) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      // Normalise by half the viewport so the whole screen maps to -1..1.
      x.set(clamp((e.clientX - cx) / (window.innerWidth / 2)))
      y.set(clamp((e.clientY - cy) / (window.innerHeight / 2)))
      clearTimeout(idle)
      idle = setTimeout(() => {
        x.set(0)
        y.set(0)
      }, 4000)
    }
    const reset = () => {
      x.set(0)
      y.set(0)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', reset)
    window.addEventListener('blur', reset)
    return () => {
      clearTimeout(idle)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', reset)
      window.removeEventListener('blur', reset)
    }
  }, [ref, x, y])

  return { sx, sy }
}

/** Profile photo that turns in 3D to "face" the cursor, with a moving glare. */
export default function FollowingPortrait({ src, alt }) {
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()
  const { sx, sy } = usePointerFollow(ref)

  // Turn toward the cursor: cursor right -> rotate right, cursor up -> tilt up.
  const rotateY = useTransform(sx, [-1, 1], [-18, 18])
  const rotateX = useTransform(sy, [-1, 1], [14, -14])
  const shadowX = useTransform(sx, [-1, 1], [24, -24])
  const shadowY = useTransform(sy, [-1, 1], [24, -8])
  const boxShadow = useMotionTemplate`${shadowX}px ${shadowY}px 50px -12px rgb(var(--accent) / 0.35)`
  const glareX = useTransform(sx, [-1, 1], [80, 20])
  const glareY = useTransform(sy, [-1, 1], [80, 20])
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.22), transparent 55%)`

  return (
    <div ref={ref} style={{ perspective: 900 }}>
      <motion.div
        style={reduceMotion ? undefined : { rotateX, rotateY, boxShadow, transformStyle: 'preserve-3d' }}
        className="relative h-56 w-56 rounded-2xl sm:h-64 sm:w-64 lg:h-72 lg:w-72"
      >
        <div className="scanline relative h-full w-full overflow-hidden rounded-2xl border border-accent-ink/40 bg-surface">
          <img src={src} alt={alt} width="288" height="288" fetchpriority="high" className="h-full w-full object-cover" draggable={false} />
          {!reduceMotion && <motion.div style={{ background: glare }} className="pointer-events-none absolute inset-0" />}
        </div>
        {/* Corner brackets, like a targeting HUD */}
        <span className="absolute -left-1.5 -top-1.5 h-5 w-5 rounded-tl-md border-l-2 border-t-2 border-accent-ink" />
        <span className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-tr-md border-r-2 border-t-2 border-cyan-ink" />
        <span className="absolute -bottom-1.5 -left-1.5 h-5 w-5 rounded-bl-md border-b-2 border-l-2 border-cyan-ink" />
        <span className="absolute -bottom-1.5 -right-1.5 h-5 w-5 rounded-br-md border-b-2 border-r-2 border-accent-ink" />
      </motion.div>
    </div>
  )
}

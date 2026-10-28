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
  const rotateY = useTransform(sx, [-1, 1], [-24, 24])
  const rotateX = useTransform(sy, [-1, 1], [18, -18])
  // Shift the photo inside its frame for depth, and nudge the framing toward the cursor.
  const imgX = useTransform(sx, [-1, 1], ['-5%', '5%'])
  const imgY = useTransform(sy, [-1, 1], ['-4%', '4%'])
  const shadowX = useTransform(sx, [-1, 1], [30, -30])
  const shadowY = useTransform(sy, [-1, 1], [30, -10])
  const boxShadow = useMotionTemplate`${shadowX}px ${shadowY}px 60px -10px rgba(99, 102, 241, 0.45)`
  const glareX = useTransform(sx, [-1, 1], [80, 20])
  const glareY = useTransform(sy, [-1, 1], [80, 20])
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.35), transparent 55%)`

  return (
    <div ref={ref} style={{ perspective: 900 }}>
      <motion.div
        style={reduceMotion ? undefined : { rotateX, rotateY, boxShadow, transformStyle: 'preserve-3d' }}
        animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
        className="blob h-60 w-60 sm:h-72 sm:w-72 md:h-80 md:w-80"
      >
        <div className="relative h-full w-full overflow-hidden rounded-[inherit] bg-white">
          <motion.img
            src={src}
            alt={alt}
            // The photo is full-body: zoom in around the face (head-and-shoulders crop).
            style={{
              scale: 2.3,
              transformOrigin: '57% 40%',
              objectPosition: '57% 32%',
              ...(reduceMotion ? {} : { x: imgX, y: imgY }),
            }}
            className="h-full w-full object-cover"
            draggable={false}
          />
          {!reduceMotion && <motion.div style={{ background: glare }} className="pointer-events-none absolute inset-0" />}
        </div>
      </motion.div>
    </div>
  )
}

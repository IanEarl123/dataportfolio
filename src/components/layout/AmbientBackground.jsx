import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

const GLYPHS = '01SELECTFROMWHEREJOIN{}<>=*;'.split('')
const COLUMN_WIDTH = 34
const FRAME_MS = 110 // about 9 fps: slow and cheap

/**
 * Sparse "matrix" rain on a fixed canvas, kept very faint. Desktop and dark
 * theme only, skipped for reduced motion, and paused while the tab is hidden.
 */
function MatrixRain() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let raf
    let last = 0
    let drops = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      // Only about a quarter of the columns are active.
      drops = Array.from({ length: Math.ceil(canvas.width / COLUMN_WIDTH) }, () =>
        Math.random() < 0.25 ? Math.random() * -40 : null,
      )
      ctx.font = '13px "JetBrains Mono", monospace'
    }

    const draw = (now) => {
      raf = requestAnimationFrame(draw)
      if (document.hidden || now - last < FRAME_MS) return
      last = now

      ctx.fillStyle = 'rgba(7, 11, 18, 0.14)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(0, 255, 136, 0.55)'

      drops.forEach((row, i) => {
        if (row === null) return
        ctx.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], i * COLUMN_WIDTH, row * 18)
        drops[i] = row * 18 > canvas.height ? Math.random() * -30 : row + 1
      })
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="absolute inset-0 h-full w-full opacity-[0.16]" />
}

/** Fixed layer behind every page: drifting grid, soft glows and matrix rain. */
export default function AmbientBackground() {
  const { theme } = useTheme()
  const reduceMotion = useReducedMotion()
  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {theme === 'dark' && isDesktop && !reduceMotion && <MatrixRain />}
      <div className="grid-mask absolute inset-0 overflow-hidden">
        <div className="grid-lines grid-drift" />
      </div>
      <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-accent/10 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-cyan/10 blur-[120px]" />
    </div>
  )
}

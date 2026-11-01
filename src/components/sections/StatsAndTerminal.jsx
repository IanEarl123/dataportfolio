import { useEffect, useRef } from 'react'
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { useSiteStats } from '../../hooks/useSiteStats'
import { Stagger, StaggerItem } from '../ui/Reveal'

function CountUp({ value }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString())

  useEffect(() => {
    if (!inView) return
    const controls = animate(mv, value, { duration: 1.2, ease: 'easeOut' })
    return controls.stop
  }, [inView, value, mv])

  return <motion.span ref={ref}>{text}</motion.span>
}

/** Decorative bars inside a stat tile. Not data: it carries no values. */
function BarsDecoration({ heights }) {
  return (
    <div className="flex h-7 items-end gap-[3px]" aria-hidden="true">
      {heights.map((h, i) => (
        <motion.span
          key={i}
          initial={{ height: 0 }}
          whileInView={{ height: `${h}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.05 }}
          className="w-1 rounded-t-sm bg-accent-ink/30"
        />
      ))}
    </div>
  )
}

const ROWS = [
  ['role', 'Data Analyst'],
  ['based_in', 'Taguig City, PH'],
  ['stack', 'SQL, Power BI, Excel, PostgreSQL'],
  ['focus', 'Dashboards & automation'],
]

function TerminalCard() {
  return (
    <div className="card h-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-line/70 px-4 py-2.5">
        <div className="terminal-dots" aria-hidden="true">
          <span className="bg-red-500/80" />
          <span className="bg-amber-400/80" />
          <span className="bg-accent/80" />
        </div>
        <span className="font-mono text-[11px] text-ink3">ian@analyst: ~</span>
      </div>
      <div className="overflow-x-auto p-4 font-mono text-xs leading-6 sm:text-[13px]">
        <p className="whitespace-nowrap">
          <span className="text-accent-ink">$</span> <span className="text-cyan-ink">SELECT</span>
          <span className="text-ink"> * </span>
          <span className="text-cyan-ink">FROM</span>
          <span className="text-ink"> profile;</span>
        </p>
        <table className="mt-2 w-full text-left">
          <tbody>
            {ROWS.map(([key, value]) => (
              <tr key={key}>
                <th scope="row" className="whitespace-nowrap pr-4 font-normal text-ink3">{key}</th>
                <td className="text-ink2">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-ink3">({ROWS.length} rows)</p>
      </div>
    </div>
  )
}

export default function StatsAndTerminal() {
  const { projects, certificates, years, skills } = useSiteStats()

  const stats = [
    { label: 'Projects Completed', value: projects, icon: 'fa-solid fa-diagram-project', bars: [40, 65, 50, 85, 70, 100] },
    { label: 'Certificates Earned', value: certificates, icon: 'fa-solid fa-award', bars: [30, 45, 60, 55, 80, 90] },
    { label: 'Years of Learning', value: years, icon: 'fa-solid fa-graduation-cap', bars: [20, 35, 50, 65, 80, 100] },
    { label: 'Technologies Used', value: skills, icon: 'fa-solid fa-microchip', bars: [70, 50, 90, 60, 80, 65] },
  ]

  return (
    <section className="mt-14 grid gap-4 lg:grid-cols-5" aria-label="Statistics">
      <Stagger className="grid grid-cols-2 gap-4 lg:col-span-3">
        {stats.map((s) => (
          <StaggerItem key={s.label}>
            <motion.div whileHover={{ y: -3 }} className="card card-hover flex h-full flex-col justify-between gap-3 p-4">
              <div className="flex items-start justify-between">
                <p className="font-display text-3xl font-bold text-ink sm:text-4xl">
                  <CountUp value={s.value} />
                </p>
                <i className={`${s.icon} text-sm text-cyan-ink`} />
              </div>
              <div className="flex items-end justify-between gap-2">
                <p className="text-xs leading-snug text-ink2">{s.label}</p>
                <BarsDecoration heights={s.bars} />
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </Stagger>
      <div className="lg:col-span-2">
        <TerminalCard />
      </div>
    </section>
  )
}

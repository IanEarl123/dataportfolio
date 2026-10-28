import { useCallback, useEffect, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/format'
import { usePresence } from '../context/PresenceContext'
import { RESOURCES } from './resources'

function referrerHost(ref) {
  if (!ref) return 'Direct'
  try {
    return new URL(ref).hostname
  } catch {
    return ref
  }
}

/** Number that counts up smoothly whenever its value changes. */
function AnimatedNumber({ value }) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString())
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: 'easeOut' })
    return controls.stop
  }, [value, mv])
  return <motion.span>{text}</motion.span>
}

function StatTile({ label, value, icon, live, hint }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} whileHover={{ y: -4 }} className="card rounded-3xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
        {live ? (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        ) : (
          <i className={`${icon} text-slate-300 dark:text-slate-600`} />
        )}
      </div>
      <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
        <AnimatedNumber value={value ?? 0} />
      </p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </motion.div>
  )
}

/** Single-series bar chart of daily views with per-bar hover tooltips. */
function DailyChart({ daily }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...daily.map((d) => d.views))
  const total = daily.reduce((s, d) => s + d.views, 0)

  return (
    <div className="card rounded-3xl p-5 md:p-6">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h3 className="font-bold text-slate-900 dark:text-white">Views per day</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">Last 14 days · {total.toLocaleString()} total</span>
      </div>

      <div className="relative">
        {/* Gridlines: recessive, three steps */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[max, Math.round(max / 2), 0].map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-right text-[10px] tabular-nums text-slate-400">{v}</span>
              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>

        <div className="relative ml-8 flex h-48 items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
          {daily.map((d, i) => (
            <div
              key={d.day}
              className="group relative flex h-full flex-1 cursor-default items-end"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              tabIndex={0}
              aria-label={`${formatDate(d.day, { month: 'short', day: 'numeric' })}: ${d.views} views`}
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.views / max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                className={`w-full rounded-t-[4px] ${hover === i ? 'bg-indigo-700 dark:bg-indigo-300' : 'bg-indigo-500 dark:bg-indigo-400'}`}
                style={{ minHeight: d.views ? 2 : 0 }}
              />
              {hover === i && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-white dark:text-slate-900"
                >
                  <span className="font-bold tabular-nums">{d.views}</span> views
                  <span className="block text-[10px] opacity-70">{formatDate(d.day, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="ml-8 mt-2 flex justify-between text-[10px] text-slate-400">
        <span>{daily[0] && formatDate(daily[0].day, { month: 'short', day: 'numeric' })}</span>
        <span>Today</span>
      </div>
    </div>
  )
}

export default function AnalyticsPanel() {
  const { onlineCount, connected } = usePresence()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [counts, setCounts] = useState({})
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const [analytics, recentRes, ...countRes] = await Promise.all([
      supabase.rpc('get_analytics'),
      supabase.from('profile_views').select('id, path, referrer, created_at').order('created_at', { ascending: false }).limit(8),
      ...RESOURCES.map((r) => supabase.from(r.key).select('id', { count: 'exact', head: true })),
    ])
    if (analytics.error) setError(analytics.error.message)
    else setStats(analytics.data)
    setRecent(recentRes.data ?? [])
    setCounts(Object.fromEntries(RESOURCES.map((r, i) => [r.key, countRes[i].count ?? 0])))
  }, [])

  useEffect(() => {
    load()

    // New views stream in live through Supabase Realtime (RLS lets only the admin receive them).
    const channel = supabase
      .channel('admin-profile-views')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profile_views' }, ({ new: row }) => {
        setRecent((prev) => [row, ...prev].slice(0, 8))
        setStats((s) =>
          s && {
            ...s,
            total_views: s.total_views + 1,
            views_today: s.views_today + 1,
            views_7d: s.views_7d + 1,
            daily: s.daily.map((d, i) => (i === s.daily.length - 1 ? { ...d, views: d.views + 1 } : d)),
          },
        )
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Overview</h2>
          <p className="text-sm text-slate-500">Real-time traffic and content at a glance.</p>
        </div>
        <motion.button whileTap={{ rotate: 180 }} onClick={load} className="icon-btn" aria-label="Refresh">
          <i className="fa-solid fa-rotate" />
        </motion.button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          Analytics unavailable: {error}
        </p>
      )}

      <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }} className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile label="Viewing now" value={onlineCount} live hint={connected ? 'Active visitors (excl. you)' : 'Connecting…'} />
        <StatTile label="Total views" value={stats?.total_views} icon="fa-solid fa-eye" hint="All time" />
        <StatTile label="Unique visitors" value={stats?.unique_visitors} icon="fa-solid fa-user" hint="Distinct browsers" />
        <StatTile label="Today" value={stats?.views_today} icon="fa-solid fa-calendar-day" hint="Asia/Manila" />
        <StatTile label="Last 7 days" value={stats?.views_7d} icon="fa-solid fa-calendar-week" />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DailyChart daily={stats?.daily ?? []} />
        </div>

        <div className="card rounded-3xl p-5 md:p-6">
          <h3 className="mb-4 font-bold">Recent visits</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400">No visits recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((v) => (
                <motion.li key={v.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{v.path}</p>
                    <p className="truncate text-xs text-slate-400">{referrerHost(v.referrer)}</p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-slate-400">
                    {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card rounded-3xl p-5 md:p-6 lg:col-span-2">
          <h3 className="mb-4 font-bold">Content</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {RESOURCES.map((r) => (
              <div key={r.key} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <i className={`${r.icon} mb-2 text-indigo-500`} />
                <p className="text-xl font-extrabold tabular-nums">{counts[r.key] ?? '–'}</p>
                <p className="text-xs text-slate-500">{r.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card rounded-3xl p-5 md:p-6">
          <h3 className="mb-4 font-bold">Top pages</h3>
          {(stats?.top_paths ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.top_paths.map((p) => (
                <li key={p.path} className="flex items-center justify-between text-sm">
                  <span className="truncate font-semibold">{p.path}</span>
                  <span className="tabular-nums text-slate-500">{Number(p.views).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { REACTIONS, REACTION_BY_KIND, recordShare } from '../../lib/engagement'
import { useToast } from '../../context/ToastContext'

function useClickOutside(ref, onOutside, active) {
  useEffect(() => {
    if (!active) return
    const handle = (e) => !ref.current?.contains(e.target) && onOutside()
    const onKey = (e) => e.key === 'Escape' && onOutside()
    document.addEventListener('pointerdown', handle)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', handle)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, onOutside, active])
}

const Popover = ({ children, align = 'left' }) => (
  <motion.div
    initial={{ opacity: 0, y: 6, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 6, scale: 0.95 }}
    transition={{ duration: 0.15 }}
    className={`absolute bottom-full z-30 mb-2 rounded-xl border border-line bg-surface p-1.5 shadow-xl ${align === 'right' ? 'right-0' : 'left-0'}`}
  >
    {children}
  </motion.div>
)

function ReactionButton({ stats, onReact }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useClickOutside(ref, () => setOpen(false), open)
  const mine = stats.myReaction ? REACTION_BY_KIND[stats.myReaction] : null
  const top = Object.entries(stats.reactions)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([kind]) => REACTION_BY_KIND[kind]?.emoji)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={mine ? `Your reaction: ${mine.label}. Change reaction` : 'React to this post'}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-raised ${mine ? 'text-accent-ink' : 'text-ink3 hover:text-ink'}`}
      >
        {top.length ? <span className="tracking-tighter">{top.join('')}</span> : <i className="fa-regular fa-face-smile" />}
        <span className="font-mono">{stats.totalReactions}</span>
      </button>
      <AnimatePresence>
        {open && (
          <Popover>
            <div className="flex gap-0.5" role="group" aria-label="Reactions">
              {REACTIONS.map((r, i) => (
                <motion.button
                  key={r.kind}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                  whileHover={{ scale: 1.3, y: -3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    onReact(r.kind)
                    setOpen(false)
                  }}
                  aria-pressed={stats.myReaction === r.kind}
                  title={r.label}
                  aria-label={r.label}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${stats.myReaction === r.kind ? 'bg-accent/15 ring-1 ring-accent-ink/40' : ''}`}
                >
                  {r.emoji}
                </motion.button>
              ))}
            </div>
          </Popover>
        )}
      </AnimatePresence>
    </div>
  )
}

function ShareButton({ post, count, onShared }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useClickOutside(ref, () => setOpen(false), open)
  const url = `${window.location.origin}/blog/${post.slug}`
  const enc = encodeURIComponent(url)

  const done = (platform) => {
    recordShare(post.id, platform)
    onShared?.()
    setOpen(false)
  }

  const copy = async (message) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied', message)
    } catch {
      toast.info('Copy this link', url)
    }
  }

  const options = [
    { key: 'linkedin', label: 'LinkedIn', icon: 'fa-brands fa-linkedin-in', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}` },
    { key: 'facebook', label: 'Facebook', icon: 'fa-brands fa-facebook-f', href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
    {
      key: 'tiktok',
      label: 'TikTok',
      icon: 'fa-brands fa-tiktok',
      // TikTok has no web link-sharing page: use the phone's share sheet, or copy the link.
      action: async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title: post.title, url })
          } catch {
            return
          }
        } else {
          await copy('Paste it into your TikTok post, bio or message.')
        }
        done('tiktok')
      },
    },
    { key: 'copy', label: 'Copy link', icon: 'fa-solid fa-link', action: async () => (await copy(), done('copy')) },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Share this post"
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-ink3 transition-colors hover:bg-raised hover:text-ink"
      >
        <i className="fa-solid fa-share-nodes" />
        <span className="font-mono">{count}</span>
      </button>
      <AnimatePresence>
        {open && (
          <Popover align="right">
            <ul className="w-40">
              {options.map((o, i) => (
                <motion.li key={o.key} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0, transition: { delay: i * 0.03 } }}>
                  {o.href ? (
                    <a
                      href={o.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => done(o.key)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-ink2 hover:bg-raised hover:text-ink"
                    >
                      <i className={`${o.icon} w-4 text-center`} /> {o.label}
                    </a>
                  ) : (
                    <button type="button" onClick={o.action} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-ink2 hover:bg-raised hover:text-ink">
                      <i className={`${o.icon} w-4 text-center`} /> {o.label}
                    </button>
                  )}
                </motion.li>
              ))}
            </ul>
          </Popover>
        )}
      </AnimatePresence>
    </div>
  )
}

/** React · comment · share row, used on blog cards and at the top of each post. */
export default function EngagementBar({ post, stats, onReact, onShared, commentsHref }) {
  return (
    <div className="relative z-10 flex items-center justify-between gap-2 border-t border-line/70 pt-2">
      <ReactionButton stats={stats} onReact={(kind) => onReact(post.id, kind)} />
      <Link
        to={commentsHref}
        aria-label={`${stats.comments} comments`}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-ink3 transition-colors hover:bg-raised hover:text-ink"
      >
        <i className="fa-regular fa-comment" />
        <span className="font-mono">{stats.comments}</span>
      </Link>
      <ShareButton post={post} count={stats.shares} onShared={onShared} />
    </div>
  )
}

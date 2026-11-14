import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { EmptyState, SkeletonGrid } from '../components/ui/States'

const formatStamp = (value) =>
  new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

/** How many comments the admin hasn't seen yet (for the tab badge). */
export async function fetchUnseenCount() {
  const { data, error } = await supabase.rpc('admin_comments')
  if (error) return 0
  return data.filter((c) => !c.seen_by_admin && !c.is_admin).length
}

/** Every comment with the commenter's email, newest first: reply, heart or delete. */
export default function CommentsPanel({ onSeen }) {
  const toast = useToast()
  const [comments, setComments] = useState([])
  const [newIds, setNewIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [reply, setReply] = useState('')
  const [busyReply, setBusyReply] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase.rpc('admin_comments')
    if (err) {
      setError(err.message)
    } else {
      setComments(data ?? [])
      // Highlight what's new on this visit, then mark it seen.
      const unseen = (data ?? []).filter((c) => !c.seen_by_admin && !c.is_admin).map((c) => c.id)
      setNewIds(new Set(unseen))
      if (unseen.length) {
        await supabase.from('blog_comments').update({ seen_by_admin: true }).in('id', unseen)
        onSeen?.()
      }
    }
    setLoading(false)
  }, [onSeen])

  useEffect(() => {
    load()
  }, [load])

  const heart = async (c) => {
    const next = c.admin_reaction === 'love' ? null : 'love'
    setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, admin_reaction: next } : x)))
    const { error: err } = await supabase.from('blog_comments').update({ admin_reaction: next }).eq('id', c.id)
    if (err) {
      setComments((prev) => prev.map((x) => (x.id === c.id ? c : x)))
      toast.error("Couldn't update", err.message)
    }
  }

  const sendReply = async (e) => {
    e.preventDefault()
    setBusyReply(true)
    const { error: err } = await supabase.rpc('admin_reply', { p_parent_id: replyingTo.parent_id ?? replyingTo.id, p_body: reply })
    setBusyReply(false)
    if (err) return toast.error("Couldn't post reply", err.message)
    toast.success('Reply posted')
    setReplyingTo(null)
    setReply('')
    load()
  }

  const handleDelete = async () => {
    setBusy(true)
    const { error: err } = await supabase.from('blog_comments').delete().eq('id', deleting.id)
    setBusy(false)
    if (err) return toast.error('Delete failed', err.message)
    setComments((prev) => prev.filter((c) => c.id !== deleting.id && c.parent_id !== deleting.id))
    setDeleting(null)
    toast.success('Comment deleted')
  }

  const q = query.toLowerCase()
  const visible = comments.filter((c) =>
    !q ? true : `${c.author_name} ${c.author_email ?? ''} ${c.body} ${c.post_title}`.toLowerCase().includes(q),
  )

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Comments</h2>
          <p className="text-sm text-ink3">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            {newIds.size > 0 && <span className="ml-2 text-accent-ink">· {newIds.size} new</span>}
          </p>
        </div>
        <div className="relative sm:w-64">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-ink3" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, text…" aria-label="Search comments" className="input pl-9" />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
          {error}. Did you run <code>supabase/migrations/004_engagement.sql</code>?
        </p>
      )}

      {loading ? (
        <SkeletonGrid count={3} className="space-y-3" itemClass="h-24" />
      ) : visible.length === 0 ? (
        !error && <EmptyState icon="fa-solid fa-comments" title={query ? 'No matches' : 'No comments yet'} message={query ? 'Try another search.' : 'Comments from your blog posts appear here.'} />
      ) : (
        <motion.ul layout className="space-y-3">
          <AnimatePresence initial={false}>
            {visible.map((c) => (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className={`card p-4 ${newIds.has(c.id) ? 'border-accent-ink/60 shadow-glow' : ''} ${c.parent_id ? 'ml-6' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-ink">
                      {c.author_name}
                      {c.is_admin && <span className="rounded border border-accent-ink/50 px-1.5 font-mono text-[10px] font-normal text-accent-ink">You</span>}
                      {newIds.has(c.id) && <span className="rounded bg-accent px-1.5 font-mono text-[10px] font-semibold text-on-accent">New</span>}
                      {c.parent_id && <span className="font-mono text-[10px] font-normal text-ink3">reply</span>}
                    </p>
                    <p className="font-mono text-[11px] text-ink3">
                      {c.author_email && (
                        <a href={`mailto:${c.author_email}`} className="text-cyan-ink hover:underline">{c.author_email}</a>
                      )}
                      {c.author_email && ' · '}
                      {formatStamp(c.created_at)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink2">{c.body}</p>
                    <Link to={`/blog/${c.post_slug}#comments`} className="mt-2 inline-block font-mono text-[11px] text-ink3 hover:text-accent-ink">
                      on: {c.post_title}
                    </Link>

                    <AnimatePresence>
                      {replyingTo?.id === c.id && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          onSubmit={sendReply}
                          className="mt-3 space-y-2 overflow-hidden"
                        >
                          <textarea value={reply} onChange={(e) => setReply(e.target.value)} required maxLength={1000} rows={3} autoFocus className="input resize-y" placeholder={`Reply to ${c.author_name}…`} aria-label="Your reply" />
                          <div className="flex gap-2">
                            <button type="submit" className="btn-primary px-3 py-1.5 text-xs" disabled={busyReply || !reply.trim()}>
                              {busyReply ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-reply" />} Post reply
                            </button>
                            <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setReplyingTo(null)}>Cancel</button>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                    {!c.is_admin && (
                      <>
                        <button onClick={() => setReplyingTo(replyingTo?.id === c.id ? null : c)} className="icon-btn" aria-label={`Reply to ${c.author_name}`}>
                          <i className="fa-solid fa-reply" />
                        </button>
                        <button
                          onClick={() => heart(c)}
                          aria-pressed={c.admin_reaction === 'love'}
                          aria-label={c.admin_reaction === 'love' ? 'Remove your heart' : 'Heart this comment'}
                          className={`icon-btn ${c.admin_reaction === 'love' ? '!text-red-500' : ''}`}
                        >
                          <i className={c.admin_reaction === 'love' ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
                        </button>
                      </>
                    )}
                    <button onClick={() => setDeleting(c)} className="icon-btn hover:!text-red-500" aria-label={`Delete comment by ${c.author_name}`}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete comment?"
        message={deleting ? `The comment by "${deleting.author_name}" and any replies will be permanently removed. This can't be undone.` : ''}
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { getSessionId } from '../../lib/session'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import ConfirmDialog from '../ui/ConfirmDialog'

const MAX_BODY = 1000
const COLUMNS = 'id, post_id, author_name, body, created_at'

function formatStamp(value) {
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function CommentSection({ postId }) {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [website, setWebsite] = useState('') // honeypot: hidden from people, filled by bots
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [busyDelete, setBusyDelete] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('blog_comments')
      .select(COLUMNS)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setUnavailable(true)
        else setComments(data ?? [])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [postId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (website) return
    setSending(true)
    const { data, error } = await supabase.rpc('add_comment', {
      p_post_id: postId,
      p_author: name,
      p_body: body,
      p_session_id: getSessionId(),
    })
    setSending(false)

    if (error) {
      toast.error("Couldn't post your comment", error.message)
      return
    }
    setComments((prev) => [...prev, ...(data ?? [])])
    setBody('')
    toast.success('Comment posted', 'Thanks for joining the conversation.')
  }

  const handleDelete = async () => {
    setBusyDelete(true)
    const { error } = await supabase.from('blog_comments').delete().eq('id', deleting.id)
    setBusyDelete(false)
    if (error) {
      toast.error('Delete failed', error.message)
      return
    }
    setComments((prev) => prev.filter((c) => c.id !== deleting.id))
    setDeleting(null)
    toast.success('Comment deleted')
  }

  if (unavailable) return null

  return (
    <section className="mt-12 border-t border-line/70 pt-8" aria-label="Comments">
      <h2 className="mb-5 text-xl font-semibold text-ink">
        Comments <span className="font-mono text-sm font-normal text-ink3">({comments.length})</span>
      </h2>

      {!loading && comments.length === 0 && <p className="mb-5 text-sm text-ink3">No comments yet. Be the first to share a thought.</p>}

      <ul className="mb-6 space-y-3">
        <AnimatePresence initial={false}>
          {comments.map((c) => (
            <motion.li
              key={c.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{c.author_name}</p>
                  <time dateTime={c.created_at} className="font-mono text-[11px] text-ink3">{formatStamp(c.created_at)}</time>
                </div>
                {isAdmin && (
                  <button onClick={() => setDeleting(c)} aria-label={`Delete comment by ${c.author_name}`} className="icon-btn h-7 w-7 hover:!text-red-500">
                    <i className="fa-solid fa-trash text-xs" />
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink2">{c.body}</p>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <form onSubmit={handleSubmit} className="card space-y-4 p-5">
        <div>
          <label htmlFor="comment-name" className="label">Name</label>
          <input id="comment-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} autoComplete="name" className="input" placeholder="Your name" />
        </div>
        <div className="hidden" aria-hidden="true">
          <label htmlFor="comment-website">Website</label>
          <input id="comment-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <div>
          <label htmlFor="comment-body" className="label">Comment</label>
          <textarea id="comment-body" value={body} onChange={(e) => setBody(e.target.value)} required maxLength={MAX_BODY} rows={4} className="input resize-y" placeholder="Share your thoughts…" />
          <p className="mt-1 text-right font-mono text-[11px] text-ink3">{body.length}/{MAX_BODY}</p>
        </div>
        <button type="submit" className="btn-primary" disabled={sending || !name.trim() || !body.trim()}>
          {sending ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paper-plane text-xs" />}
          {sending ? 'Posting…' : 'Post comment'}
        </button>
      </form>

      <ConfirmDialog
        open={!!deleting}
        title="Delete comment?"
        message={deleting ? `The comment by "${deleting.author_name}" will be permanently removed.` : ''}
        busy={busyDelete}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </section>
  )
}

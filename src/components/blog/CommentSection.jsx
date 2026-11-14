import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { callApi, loadCommenter, saveCommenter } from '../../lib/engagement'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import ConfirmDialog from '../ui/ConfirmDialog'

const MAX_BODY = 1000
const COLUMNS = 'id, post_id, parent_id, author_name, author_email_masked, body, is_admin, admin_reaction, created_at'

const formatStamp = (value) =>
  new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

/** Name + email + comment, then (first time only) the 6-digit code from the email. */
function CommentForm({ postId, parentId = null, onPublished, onCancel, compact = false }) {
  const toast = useToast()
  const saved = useMemo(loadCommenter, [])
  const [name, setName] = useState(saved.name ?? '')
  const [email, setEmail] = useState(saved.email ?? '')
  const [body, setBody] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [pending, setPending] = useState(null) // { id, email } while waiting for the code
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const idBase = parentId ?? 'top'

  // Read the saved commenter fresh each time: an earlier comment may have just stored a token.
  const tokenFor = (cleanEmail) => {
    const current = loadCommenter()
    return current.email === cleanEmail ? current.token : null
  }

  const publish = (comment, token) => {
    const cleanEmail = email.trim().toLowerCase()
    saveCommenter({ name: name.trim(), email: cleanEmail, token: token ?? tokenFor(cleanEmail) ?? undefined })
    onPublished(comment)
    setBody('')
    setPending(null)
    setCode('')
    toast.success(parentId ? 'Reply posted' : 'Comment posted', 'Thanks for joining the conversation.')
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const cleanEmail = email.trim().toLowerCase()
      const result = await callApi('/api/comments', {
        post_id: postId,
        parent_id: parentId,
        name,
        email: cleanEmail,
        body,
        website,
        token: tokenFor(cleanEmail),
      })
      if (result.status === 'published') publish(result.comment)
      else setPending({ id: result.comment_id, email: cleanEmail })
    } catch (err) {
      toast.error("Couldn't post your comment", err.message)
    } finally {
      setBusy(false)
    }
  }

  const verify = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const result = await callApi('/api/comments/verify', { comment_id: pending.id, code })
      publish(result.comment, result.token)
    } catch (err) {
      toast.error('Not verified yet', err.message)
      if (/post your comment again/i.test(err.message)) setPending(null)
    } finally {
      setBusy(false)
    }
  }

  if (pending) {
    return (
      <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onSubmit={verify} className="card space-y-4 p-5">
        <div className="flex items-start gap-3">
          <i className="fa-solid fa-envelope-circle-check mt-0.5 text-lg text-accent-ink" />
          <p className="text-sm text-ink2">
            We sent a 6-digit code to <strong className="text-ink">{pending.email}</strong>. Enter it to publish your comment.
            You only need to do this once on this device.
          </p>
        </div>
        <div>
          <label htmlFor={`code-${idBase}`} className="label">Verification code</label>
          <input
            id={`code-${idBase}`}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            pattern="\d{6}"
            className="input max-w-[12rem] text-center font-mono text-lg tracking-[0.5em]"
            placeholder="000000"
          />
          <p className="mt-1.5 text-xs text-ink3">Can&apos;t find it? Check your spam folder. The code expires in 15 minutes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={busy || code.length !== 6}>
            {busy ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-check" />} Verify & publish
          </button>
          <button type="button" className="btn-ghost" onClick={() => setPending(null)} disabled={busy}>Change email</button>
        </div>
      </motion.form>
    )
  }

  return (
    <form onSubmit={submit} className={`card space-y-3 ${compact ? 'p-4' : 'p-5'}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`name-${idBase}`} className="label">Name</label>
          <input id={`name-${idBase}`} value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} autoComplete="name" className="input" placeholder="Your name" />
        </div>
        <div>
          <label htmlFor={`email-${idBase}`} className="label">Email</label>
          <input id={`email-${idBase}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} autoComplete="email" className="input" placeholder="you@gmail.com" />
        </div>
      </div>
      <div className="hidden" aria-hidden="true">
        <label htmlFor={`website-${idBase}`}>Website</label>
        <input id={`website-${idBase}`} tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <div>
        <label htmlFor={`body-${idBase}`} className="label">{parentId ? 'Reply' : 'Comment'}</label>
        <textarea id={`body-${idBase}`} value={body} onChange={(e) => setBody(e.target.value)} required maxLength={MAX_BODY} rows={compact ? 3 : 4} className="input resize-y" placeholder="Share your thoughts…" />
        <div className="mt-1 flex justify-between gap-3 text-[11px] text-ink3">
          <span>Your email is verified once and never shown publicly.</span>
          <span className="font-mono">{body.length}/{MAX_BODY}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={busy || !name.trim() || !email.trim() || !body.trim()}>
          {busy ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paper-plane text-xs" />}
          {busy ? 'Sending…' : parentId ? 'Post reply' : 'Post comment'}
        </button>
        {onCancel && <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}

function AdminReplyForm({ parentId, onPosted, onCancel }) {
  const toast = useToast()
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const { data, error } = await supabase.rpc('admin_reply', { p_parent_id: parentId, p_body: body })
    setBusy(false)
    if (error) return toast.error("Couldn't post reply", error.message)
    onPosted(data)
    toast.success('Reply posted')
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <textarea value={body} onChange={(e) => setBody(e.target.value)} required maxLength={MAX_BODY} rows={3} autoFocus className="input resize-y" placeholder="Reply as the author…" aria-label="Your reply" />
      <div className="flex gap-2">
        <button type="submit" className="btn-primary px-3 py-1.5 text-xs" disabled={busy || !body.trim()}>
          {busy ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-reply" />} Reply
        </button>
        <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

function Comment({ comment, replies, isAdmin, onReply, onHeart, onDelete, replyingTo, setReplyingTo, postId }) {
  const isReplying = replyingTo === comment.id

  return (
    <motion.li layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className={`card p-4 ${comment.is_admin ? 'border-accent-ink/40' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-ink">
              <span className="truncate">{comment.author_name}</span>
              {comment.is_admin && <span className="rounded border border-accent-ink/50 px-1.5 font-mono text-[10px] font-normal text-accent-ink">Author</span>}
              {comment.author_email_masked && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-normal text-ink3" title="Email verified">
                  <i className="fa-solid fa-circle-check text-cyan-ink" /> {comment.author_email_masked}
                </span>
              )}
            </p>
            <time dateTime={comment.created_at} className="font-mono text-[11px] text-ink3">{formatStamp(comment.created_at)}</time>
          </div>
          {isAdmin && (
            <div className="flex shrink-0">
              {!comment.is_admin && (
                <button
                  onClick={() => onHeart(comment)}
                  aria-pressed={comment.admin_reaction === 'love'}
                  aria-label={comment.admin_reaction === 'love' ? 'Remove your heart' : 'Heart this comment'}
                  className={`icon-btn h-7 w-7 text-xs ${comment.admin_reaction === 'love' ? '!text-red-500' : ''}`}
                >
                  <i className={comment.admin_reaction === 'love' ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
                </button>
              )}
              <button onClick={() => onDelete(comment)} aria-label={`Delete comment by ${comment.author_name}`} className="icon-btn h-7 w-7 text-xs hover:!text-red-500">
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          )}
        </div>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink2">{comment.body}</p>
        <div className="mt-2 flex items-center gap-3">
          {comment.admin_reaction === 'love' && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-500">
              <i className="fa-solid fa-heart" /> by the author
            </motion.span>
          )}
          {comment.parent_id === null && (
            <button onClick={() => setReplyingTo(isReplying ? null : comment.id)} className="font-mono text-[11px] text-ink3 hover:text-accent-ink">
              <i className="fa-solid fa-reply mr-1" />reply
            </button>
          )}
        </div>

        <AnimatePresence>
          {isReplying && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              {isAdmin ? (
                <AdminReplyForm parentId={comment.id} onPosted={(c) => (onReply(c), setReplyingTo(null))} onCancel={() => setReplyingTo(null)} />
              ) : (
                <div className="mt-3">
                  <CommentForm postId={postId} parentId={comment.id} compact onPublished={(c) => (onReply(c), setReplyingTo(null))} onCancel={() => setReplyingTo(null)} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {replies.length > 0 && (
        <ul className="ml-4 mt-2 space-y-2 border-l border-line pl-4 sm:ml-6">
          <AnimatePresence initial={false}>
            {replies.map((r) => (
              <Comment key={r.id} comment={r} replies={[]} isAdmin={isAdmin} onReply={onReply} onHeart={onHeart} onDelete={onDelete} replyingTo={replyingTo} setReplyingTo={setReplyingTo} postId={postId} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </motion.li>
  )
}

export default function CommentSection({ postId, onCountChange }) {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const { hash } = useLocation()
  const sectionRef = useRef(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
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

  // Arriving from a card's comment count: jump here once loaded.
  useEffect(() => {
    if (!loading && hash === '#comments') sectionRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
  }, [loading, hash])

  const addComment = (c) => {
    setComments((prev) => [...prev, c])
    onCountChange?.(1)
  }

  const heart = async (c) => {
    const next = c.admin_reaction === 'love' ? null : 'love'
    setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, admin_reaction: next } : x)))
    const { error } = await supabase.from('blog_comments').update({ admin_reaction: next, seen_by_admin: true }).eq('id', c.id)
    if (error) {
      setComments((prev) => prev.map((x) => (x.id === c.id ? c : x)))
      toast.error("Couldn't update", error.message)
    }
  }

  const handleDelete = async () => {
    setBusyDelete(true)
    const { error } = await supabase.from('blog_comments').delete().eq('id', deleting.id)
    setBusyDelete(false)
    if (error) return toast.error('Delete failed', error.message)
    const removed = 1 + comments.filter((c) => c.parent_id === deleting.id).length
    setComments((prev) => prev.filter((c) => c.id !== deleting.id && c.parent_id !== deleting.id))
    onCountChange?.(-removed)
    setDeleting(null)
    toast.success('Comment deleted')
  }

  if (unavailable) return null

  const roots = comments.filter((c) => !c.parent_id)
  const repliesOf = (id) => comments.filter((c) => c.parent_id === id)

  return (
    <section id="comments" ref={sectionRef} className="mt-12 scroll-mt-20 border-t border-line/70 pt-8" aria-label="Comments">
      <h2 className="mb-5 text-xl font-semibold text-ink">
        Comments <span className="font-mono text-sm font-normal text-ink3">({comments.length})</span>
      </h2>

      {!loading && comments.length === 0 && <p className="mb-5 text-sm text-ink3">No comments yet. Be the first to share a thought.</p>}

      <ul className="mb-6 space-y-3">
        <AnimatePresence initial={false}>
          {roots.map((c) => (
            <Comment
              key={c.id}
              comment={c}
              replies={repliesOf(c.id)}
              isAdmin={isAdmin}
              onReply={addComment}
              onHeart={heart}
              onDelete={setDeleting}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              postId={postId}
            />
          ))}
        </AnimatePresence>
      </ul>

      {isAdmin ? (
        <p className="rounded-xl border border-line bg-surface/60 p-4 text-sm text-ink3">
          You&apos;re signed in as the author. Use <span className="font-mono text-accent-ink">reply</span> on any comment to answer it.
        </p>
      ) : (
        <CommentForm postId={postId} onPublished={addComment} />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete comment?"
        message={deleting ? `The comment by "${deleting.author_name}" and its replies will be permanently removed.` : ''}
        busy={busyDelete}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </section>
  )
}

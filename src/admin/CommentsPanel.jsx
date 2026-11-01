import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { EmptyState, SkeletonGrid } from '../components/ui/States'

const formatStamp = (value) =>
  new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

/** Every blog comment, newest first, with delete. */
export default function CommentsPanel() {
  const toast = useToast()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('blog_comments')
      .select('id, author_name, body, created_at, blog_posts(title, slug)')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setComments(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async () => {
    setBusy(true)
    const { error: err } = await supabase.from('blog_comments').delete().eq('id', deleting.id)
    setBusy(false)
    if (err) return toast.error('Delete failed', err.message)
    setComments((prev) => prev.filter((c) => c.id !== deleting.id))
    setDeleting(null)
    toast.success('Comment deleted')
  }

  const q = query.toLowerCase()
  const visible = comments.filter((c) =>
    !q ? true : `${c.author_name} ${c.body} ${c.blog_posts?.title ?? ''}`.toLowerCase().includes(q),
  )

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Comments</h2>
          <p className="text-sm text-ink3">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</p>
        </div>
        <div className="relative sm:w-64">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-ink3" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" aria-label="Search comments" className="input pl-9" />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
          {error}. Did you run <code>supabase/migrations/003_redesign.sql</code>?
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
              <motion.li key={c.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} className="card flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {c.author_name}
                    <span className="ml-2 font-mono text-[11px] font-normal text-ink3">{formatStamp(c.created_at)}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink2">{c.body}</p>
                  {c.blog_posts && (
                    <Link to={`/blog/${c.blog_posts.slug}`} className="mt-2 inline-block font-mono text-[11px] text-cyan-ink hover:underline">
                      on: {c.blog_posts.title}
                    </Link>
                  )}
                </div>
                <button onClick={() => setDeleting(c)} className="icon-btn hover:!text-red-500" aria-label={`Delete comment by ${c.author_name}`}>
                  <i className="fa-solid fa-trash" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete comment?"
        message={deleting ? `The comment by "${deleting.author_name}" will be permanently removed. This can't be undone.` : ''}
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

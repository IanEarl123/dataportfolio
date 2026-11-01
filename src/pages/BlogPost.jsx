import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '../lib/supabase'
import { formatDate, readingTime } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { EmptyState, Spinner } from '../components/ui/States'
import PostGallery from '../components/blog/PostGallery'
import CommentSection from '../components/blog/CommentSection'

const markdownComponents = {
  img: ({ node, ...props }) => <img {...props} alt={props.alt ?? ''} loading="lazy" />,
}

export default function BlogPost() {
  const { slug } = useParams()
  const { isAdmin } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  usePageMeta(post?.title ?? 'Blog', post?.excerpt || undefined)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase) return setLoading(false)
      setLoading(true)
      const { data } = await supabase.from('blog_posts').select('*').eq('slug', slug).maybeSingle()
      if (!cancelled) {
        setPost(data)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) return <div className="page"><Spinner label="loading post…" /></div>

  if (!post) {
    return (
      <div className="page">
        <EmptyState icon="fa-solid fa-file-circle-question" title="Post not found" message="It may have been moved or unpublished." />
        <div className="mt-6 text-center">
          <Link to="/blog" className="btn-ghost"><i className="fa-solid fa-arrow-left" /> Back to blog</Link>
        </div>
      </div>
    )
  }

  return (
    <article className="page max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/blog" className="font-mono text-xs text-ink3 transition-colors hover:text-accent-ink">
          <i className="fa-solid fa-arrow-left mr-2" />cd ../blog
        </Link>
        {isAdmin && (
          <Link to="/admin?tab=blog_posts" className="font-mono text-xs text-accent-ink">
            <i className="fa-solid fa-pen-to-square mr-1.5" />edit
          </Link>
        )}
      </div>

      {!post.published && (
        <p className="mb-5 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-700 dark:text-amber-200">
          Draft: only you can see this.
        </p>
      )}

      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="mb-3 font-mono text-xs text-cyan-ink">
          {formatDate(post.published_at || post.created_at, { month: 'long', day: 'numeric', year: 'numeric' })} · {readingTime(post.content)} min read
        </p>
        <h1 className="text-3xl font-bold leading-tight text-ink md:text-4xl">{post.title}</h1>
        {post.excerpt && <p className="mt-3 text-base leading-relaxed text-ink2">{post.excerpt}</p>}
        {post.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.map((t) => <span key={t} className="chip">#{t}</span>)}
          </div>
        )}
      </motion.header>

      {/* Short banner: the article stays above the fold */}
      {post.cover_url && (
        <img src={post.cover_url} alt="" className="mt-6 h-40 w-full rounded-xl border border-line object-cover sm:h-48" />
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="article mt-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{post.content}</ReactMarkdown>
      </motion.div>

      <PostGallery images={post.gallery ?? []} title={post.title} />

      {post.published && <CommentSection postId={post.id} />}
    </article>
  )
}

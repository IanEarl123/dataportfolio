import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '../lib/supabase'
import { formatDate, readingTime } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { EmptyState, Spinner } from '../components/ui/States'

export default function BlogPost() {
  const { slug } = useParams()
  const { isAdmin } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase) return setLoading(false)
      setLoading(true)
      const { data } = await supabase.from('blog_posts').select('*').eq('slug', slug).maybeSingle()
      if (!cancelled) {
        setPost(data)
        setLoading(false)
        if (data) document.title = `${data.title} | Ian.Analyst`
      }
    }
    load()
    return () => {
      cancelled = true
      document.title = 'Ian Earl | Data Analyst Portfolio'
    }
  }, [slug])

  if (loading) return <div className="pt-12"><Spinner label="Loading post…" /></div>

  if (!post) {
    return (
      <div className="px-6 pt-24">
        <EmptyState icon="fa-solid fa-file-circle-question" title="Post not found" message="It may have been moved or unpublished." />
        <div className="mt-8 text-center">
          <Link to="/blog" className="btn-ghost"><i className="fa-solid fa-arrow-left" /> Back to blog</Link>
        </div>
      </div>
    )
  }

  return (
    <article className="px-6 pb-24 pt-12 md:pt-16">
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-8 flex items-center justify-between">
          <Link to="/blog" className="text-sm font-semibold text-slate-500 hover:text-indigo-600">
            <i className="fa-solid fa-arrow-left mr-2" /> All posts
          </Link>
          {isAdmin && (
            <Link to="/admin?tab=blog_posts" className="text-sm font-semibold text-indigo-600">
              <i className="fa-solid fa-pen-to-square mr-1.5" /> Edit
            </Link>
          )}
        </motion.div>

        {!post.published && (
          <p className="mb-6 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            Draft — only you can see this.
          </p>
        )}

        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <p className="mb-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {formatDate(post.published_at || post.created_at, { month: 'long', day: 'numeric', year: 'numeric' })} · {readingTime(post.content)} min read
          </p>
          <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">{post.excerpt}</p>}
          {post.tags?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.map((t) => <span key={t} className="chip">#{t}</span>)}
            </div>
          )}
        </motion.header>

        {post.cover_url && (
          <motion.img
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            src={post.cover_url}
            alt=""
            className="my-10 w-full rounded-4xl shadow-xl"
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="prose prose-slate mt-10 max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-indigo-600 prose-img:rounded-2xl"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </motion.div>
      </div>
    </article>
  )
}

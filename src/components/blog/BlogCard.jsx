import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatDate, readingTime } from '../../lib/format'
import { cardHover } from '../../lib/motion'

export default function BlogCard({ post }) {
  return (
    <motion.div {...cardHover} className="h-full">
      <Link
        to={`/blog/${post.slug}`}
        className="card group flex h-full flex-col overflow-hidden hover:border-indigo-200 hover:shadow-xl dark:hover:border-indigo-500/40"
      >
        <div className="aspect-[16/9] overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/10 dark:to-purple-500/10">
          {post.cover_url ? (
            <img src={post.cover_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <i className="fa-solid fa-pen-nib text-4xl text-indigo-300 dark:text-indigo-500/50" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-6">
          <p className="mb-2 text-xs font-semibold text-slate-400">
            {formatDate(post.published_at || post.created_at, { month: 'short', day: 'numeric', year: 'numeric' })} · {readingTime(post.content)} min read
          </p>
          <h3 className="mb-2 text-lg font-bold leading-snug transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
            {post.title}
          </h3>
          {post.excerpt && <p className="mb-4 line-clamp-3 text-sm text-slate-500 dark:text-slate-400">{post.excerpt}</p>}
          {post.tags?.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <span key={t} className="chip">#{t}</span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

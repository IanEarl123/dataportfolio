import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatDate, readingTime } from '../../lib/format'
import { cardHover } from '../../lib/motion'

export default function BlogCard({ post }) {
  return (
    <motion.div {...cardHover} className="h-full">
      <Link to={`/blog/${post.slug}`} className="card card-hover group flex h-full flex-col overflow-hidden">
        {/* Slim banner so the title and excerpt lead the card */}
        <div className="h-28 overflow-hidden border-b border-line/70 bg-raised">
          {post.cover_url ? (
            <img src={post.cover_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="grid-lines flex h-full items-center justify-center">
              <i className="fa-solid fa-terminal text-2xl text-accent-ink/60" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="mb-2 font-mono text-[11px] text-ink3">
            {formatDate(post.published_at || post.created_at, { month: 'short', day: 'numeric', year: 'numeric' })} · {readingTime(post.content)} min read
          </p>
          <h2 className="mb-2 text-base font-semibold leading-snug text-ink transition-colors group-hover:text-accent-ink">{post.title}</h2>
          {post.excerpt && <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-ink2">{post.excerpt}</p>}
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

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatDate, readingTime } from '../../lib/format'
import { cardHover } from '../../lib/motion'
import EngagementBar from './EngagementBar'
import MediaFrame from '../ui/MediaFrame'

/**
 * The title link stretches over the whole card (after:inset-0), so the card is
 * clickable while the reaction and share buttons stay separate controls.
 */
export default function BlogCard({ post, stats, onReact, onShared, layout = 'grid' }) {
  const list = layout === 'list'
  return (
    <motion.article {...cardHover} className={`card card-hover group relative flex h-full ${list ? 'flex-col sm:flex-row' : 'flex-col'}`}>
      <MediaFrame src={post.cover_url} icon="fa-solid fa-terminal" className={list ? 'sm:w-56 sm:shrink-0 sm:pr-0' : ''} />
      <div className={`flex flex-1 flex-col p-5 pb-3 ${list ? 'sm:pl-4 sm:pt-4' : 'pt-2'}`}>
        <p className="mb-2 font-mono text-[11px] text-ink3">
          {formatDate(post.published_at || post.created_at, { month: 'short', day: 'numeric', year: 'numeric' })} · {readingTime(post.content)} min read
        </p>
        <h2 className="mb-2 text-base font-semibold leading-snug text-ink transition-colors group-hover:text-accent-ink">
          <Link to={`/blog/${post.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {post.title}
          </Link>
        </h2>
        {post.excerpt && <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-ink2">{post.excerpt}</p>}
        {post.tags?.length > 0 && (
          <div className="mb-3 mt-auto flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <span key={t} className="chip">#{t}</span>
            ))}
          </div>
        )}
        {stats && (
          <div className={post.tags?.length ? '' : 'mt-auto'}>
            <EngagementBar post={post} stats={stats} onReact={onReact} onShared={onShared} commentsHref={`/blog/${post.slug}#comments`} />
          </div>
        )}
      </div>
    </motion.article>
  )
}

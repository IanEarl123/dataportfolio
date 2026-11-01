import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCollection } from '../hooks/useCollection'
import { usePageMeta } from '../hooks/usePageMeta'
import SectionHeading from '../components/ui/SectionHeading'
import { EmptyState, SkeletonGrid } from '../components/ui/States'
import BlogCard from '../components/blog/BlogCard'

export default function BlogIndex() {
  usePageMeta('Blog', 'Notes on analytics, dashboards, automation and what I learn along the way.')
  const { data: posts, loading } = useCollection('blog_posts', {
    orderBy: 'published_at',
    ascending: false,
    match: { published: true },
  })
  const [tag, setTag] = useState('all')
  const [query, setQuery] = useState('')

  const tags = useMemo(() => ['all', ...new Set(posts.flatMap((p) => p.tags ?? []))], [posts])
  const visible = posts.filter(
    (p) =>
      (tag === 'all' || p.tags?.includes(tag)) &&
      (!query || `${p.title} ${p.excerpt ?? ''}`.toLowerCase().includes(query.toLowerCase())),
  )

  return (
    <div className="page">
      <SectionHeading command="tail -f ./blog" title="Notes & Write-ups" subtitle="Analytics, dashboards, automation, and what I learn along the way." manageTab="blog_posts" />

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              aria-pressed={tag === t}
              className={`relative rounded-lg px-3 py-1 font-mono text-xs transition-colors ${tag === t ? 'text-accent-ink' : 'text-ink3 hover:text-ink'}`}
            >
              {tag === t && <motion.span layoutId="tag-pill" className="absolute inset-0 -z-10 rounded-lg border border-accent-ink/40 bg-accent/10" />}
              {t === 'all' ? 'all' : `#${t}`}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-ink3" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search posts…" aria-label="Search posts" className="input pl-9" />
        </div>
      </div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : visible.length === 0 ? (
        <EmptyState icon="fa-solid fa-pen-nib" title="No posts found" message={posts.length ? 'Try a different tag or search.' : 'The first post is on its way.'} />
      ) : (
        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <BlogCard post={post} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

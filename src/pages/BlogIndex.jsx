import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCollection } from '../hooks/useCollection'
import SectionHeading from '../components/ui/SectionHeading'
import { EmptyState, SkeletonGrid } from '../components/ui/States'
import BlogCard from '../components/blog/BlogCard'

export default function BlogIndex() {
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
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Blog" title="Notes & Write-ups" subtitle="Analytics, dashboards, automation — and what I learn along the way." manageTab="blog_posts" />

        <div className="mb-10 flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex flex-wrap justify-center gap-2">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setTag(t)}
                className={`relative rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  tag === t ? 'text-white' : 'text-slate-600 hover:text-indigo-600 dark:text-slate-400'
                }`}
              >
                {tag === t && <motion.span layoutId="tag-pill" className="absolute inset-0 -z-10 rounded-full bg-indigo-600" />}
                {t === 'all' ? 'All' : `#${t}`}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search posts…" className="input pl-10" />
          </div>
        </div>

        {loading ? (
          <SkeletonGrid count={6} />
        ) : visible.length === 0 ? (
          <EmptyState icon="fa-solid fa-pen-nib" title="No posts found" message={posts.length ? 'Try a different tag or search.' : 'The first post is on its way.'} />
        ) : (
          <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visible.map((post) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className="h-full"
                >
                  <BlogCard post={post} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  )
}

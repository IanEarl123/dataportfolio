import { motion } from 'framer-motion'
import { useCollection } from '../../hooks/useCollection'
import { usePageMeta } from '../../hooks/usePageMeta'
import { formatPrice } from '../../lib/format'
import SectionHeading from '../ui/SectionHeading'
import { EmptyState, SkeletonGrid } from '../ui/States'
import MediaFrame from '../ui/MediaFrame'

const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'

export default function Shop() {
  usePageMeta('Shop', 'Templates, dashboards and tools to speed up your reporting.')
  const { data: products, loading } = useCollection('products', { match: { is_active: true } })

  return (
    <div className="page">
      <SectionHeading command="ls ./shop" title="Shop" subtitle="Templates, dashboards and tools to speed up your own reporting." manageTab="products" />

      {loading ? (
        <SkeletonGrid count={5} className={GRID} itemClass="h-56" />
      ) : products.length === 0 ? (
        <EmptyState icon="fa-solid fa-bag-shopping" title="The shop opens soon" message="Excel & Power BI templates are on the way." />
      ) : (
        <div className={GRID}>
          {products.map((product, i) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }}
              whileHover={{ y: -5 }}
              className="card card-hover group flex h-full flex-col overflow-hidden"
            >
              <MediaFrame src={product.image_url} alt={product.name} icon="fa-solid fa-bag-shopping" />
              <div className="flex flex-1 flex-col p-3 pt-1">
                <h2 className="line-clamp-2 text-xs font-semibold leading-snug text-ink">{product.name}</h2>
                {product.description && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink2">{product.description}</p>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <span className="font-mono text-sm font-semibold text-accent-ink">{formatPrice(product.price, product.currency)}</span>
                  {product.buy_url && (
                    <motion.a
                      whileTap={{ scale: 0.95 }}
                      href={product.buy_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary px-2.5 py-1 text-[11px]"
                    >
                      Buy <i className="fa-solid fa-arrow-up-right-from-square text-[9px]" />
                    </motion.a>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  )
}

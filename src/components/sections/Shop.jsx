import { motion } from 'framer-motion'
import { useCollection } from '../../hooks/useCollection'
import { usePageMeta } from '../../hooks/usePageMeta'
import { formatPrice } from '../../lib/format'
import { cardHover } from '../../lib/motion'
import SectionHeading from '../ui/SectionHeading'
import { Stagger, StaggerItem } from '../ui/Reveal'
import { EmptyState, SkeletonGrid } from '../ui/States'

export default function Shop() {
  usePageMeta('Shop', 'Templates, dashboards and tools to speed up your reporting.')
  const { data: products, loading } = useCollection('products', { match: { is_active: true } })

  return (
    <div className="page">
      <SectionHeading command="ls ./shop" title="Shop" subtitle="Templates, dashboards and tools to speed up your own reporting." manageTab="products" />

      {loading ? (
        <SkeletonGrid count={4} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" itemClass="h-80" />
      ) : products.length === 0 ? (
        <EmptyState icon="fa-solid fa-bag-shopping" title="The shop opens soon" message="Excel & Power BI templates are on the way." />
      ) : (
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <StaggerItem key={product.id} className="h-full">
              <motion.article {...cardHover} className="card card-hover group flex h-full flex-col overflow-hidden">
                <div className="aspect-square overflow-hidden bg-raised">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <i className="fa-solid fa-bag-shopping text-4xl text-ink3" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="text-sm font-semibold text-ink">{product.name}</h2>
                  {product.description && <p className="mt-1 line-clamp-3 text-sm text-ink2">{product.description}</p>}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <span className="font-mono text-sm font-semibold text-accent-ink">{formatPrice(product.price, product.currency)}</span>
                    {product.buy_url && (
                      <a href={product.buy_url} target="_blank" rel="noopener noreferrer" className="btn-primary px-3 py-1.5 text-xs">
                        Buy <i className="fa-solid fa-arrow-up-right-from-square" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.article>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}

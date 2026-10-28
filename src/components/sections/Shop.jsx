import { motion } from 'framer-motion'
import { useCollection } from '../../hooks/useCollection'
import { formatPrice } from '../../lib/format'
import { cardHover } from '../../lib/motion'
import SectionHeading from '../ui/SectionHeading'
import { Stagger, StaggerItem } from '../ui/Reveal'
import { EmptyState, SkeletonGrid } from '../ui/States'

export default function Shop() {
  const { data: products, loading } = useCollection('products', { match: { is_active: true } })

  return (
    <section id="shop" className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="Shop" subtitle="Templates, dashboards and tools to speed up your own reporting." manageTab="products" />

        {loading ? (
          <SkeletonGrid count={4} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" itemClass="h-80" />
        ) : products.length === 0 ? (
          <EmptyState icon="fa-solid fa-bag-shopping" title="The shop opens soon" message="Excel & Power BI templates are on the way." />
        ) : (
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <StaggerItem key={product.id} className="h-full">
                <motion.article {...cardHover} className="card group flex h-full flex-col overflow-hidden hover:shadow-xl">
                  <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <i className="fa-solid fa-bag-shopping text-5xl text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-bold">{product.name}</h3>
                    {product.description && <p className="mt-1 line-clamp-3 text-sm text-slate-500 dark:text-slate-400">{product.description}</p>}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{formatPrice(product.price, product.currency)}</span>
                      {product.buy_url && (
                        <motion.a
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.94 }}
                          href={product.buy_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary px-4 py-2 text-xs"
                        >
                          Buy <i className="fa-solid fa-arrow-up-right-from-square" />
                        </motion.a>
                      )}
                    </div>
                  </div>
                </motion.article>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  )
}

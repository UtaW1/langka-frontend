import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/Button'

export function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pageNumber, setPageNumber] = useState(0)
  const pageSize = 16

  const { data: catData } = useCategories()
  const categories = catData?.data ?? []

  const { data: productData, isLoading } = useProducts({
    categoryId: activeCategory ?? undefined,
    search: search || undefined,
    page_number: pageNumber,
    page_size: pageSize,
  })
  const products = productData?.data ?? []
  const totalProducts = productData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize))
  const canGoPrev = pageNumber > 0
  const canGoNext = pageNumber + 1 < totalPages

  useEffect(() => {
    setPageNumber(0)
  }, [activeCategory, search])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-coffee-600">
          Our offerings
        </p>
        <h1 className="font-serif text-3xl font-semibold text-stone-800 md:text-4xl">
          The Menu
        </h1>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drinks…"
            className="w-full rounded-xl border border-stone-200 py-2.5 pl-10 pr-4 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-coffee-400 focus:ring-2 focus:ring-coffee-100"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory(null)}
          className={[
            'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            activeCategory === null
              ? 'bg-coffee-700 text-white'
              : 'bg-white border border-stone-200 text-stone-600 hover:border-coffee-400',
          ].join(' ')}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={[
              'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              activeCategory === cat.id
                ? 'bg-coffee-700 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:border-coffee-400',
            ].join(' ')}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-24 text-center text-stone-400">
          <span className="mb-3 block text-4xl">☕</span>
          <p className="text-sm">No drinks found. Try a different filter.</p>
        </div>
      ) : (
        /* Group by category if showing all */
        activeCategory === null && !search ? (
          <div className="space-y-12">
            {categories.map((cat) => {
              const catProducts = products.filter((p) => p.categoryId === cat.id)
              if (catProducts.length === 0) return null
              return (
                <div key={cat.id}>
                  <h2 className="mb-5 font-serif text-xl font-semibold text-stone-800">
                    {cat.name}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {catProducts.map((product) => (
                      <ProductCard key={product.id} product={product} canAdd={false} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} canAdd={false} />
            ))}
          </div>
        )
      )}

      {!isLoading && products.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3">
          <p className="text-xs text-stone-500">
            Page {pageNumber + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!canGoPrev}
              onClick={() => setPageNumber((prev) => Math.max(0, prev - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!canGoNext}
              onClick={() => setPageNumber((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

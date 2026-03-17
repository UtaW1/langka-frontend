import { Plus } from 'lucide-react'
import type { Product } from '@/types'
import { formatPrice } from '@/utils'
import { useCartStore } from '@/store/cartStore'
import { usePublicBucketAsset } from '../hooks/usePublicBucketAsset'

interface ProductCardProps {
  product: Product
  canAdd?: boolean
  onAdd?: (product: Product) => void
}

export function ProductCard({ product, canAdd = true, onAdd }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const { data: resolvedImageUrl } = usePublicBucketAsset(product.imageUrl, 'product-images', {
    width: 640,
    height: 320,
    quality: 75,
  })
  const imageSrc = resolvedImageUrl ?? product.imageUrl

  function handleAdd() {
    addItem(product)
    onAdd?.(product)
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-cream-100">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl">☕</span>
          </div>
        )}
        {!product.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-medium text-stone-500">
              Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 break-words font-medium leading-snug text-stone-800">{product.name}</h3>
        <p className="text-xs text-stone-400 line-clamp-2 flex-1">{product.description}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-coffee-700">
            {formatPrice(product.price)}
          </span>
          {canAdd ? (
            <button
              onClick={handleAdd}
              disabled={!product.available}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-coffee-700 text-white transition-colors hover:bg-coffee-800 disabled:opacity-40"
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus className="h-4 w-4" />
            </button>
          ) : (
            <span className="text-xs font-medium text-stone-400">View only</span>
          )}
        </div>
      </div>
    </div>
  )
}

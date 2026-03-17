import { Minus, Plus, Trash2 } from 'lucide-react'
import { ALLOWED_ICE_LEVELS, ALLOWED_SUGAR_LEVELS, type CartItem, type IceLevel, type SugarLevel } from '@/types'
import { formatPrice } from '@/utils'
import { useCartStore } from '@/store/cartStore'
import { usePublicBucketAsset } from '../hooks/usePublicBucketAsset'

interface OrderItemProps {
  item: CartItem
}

export function OrderItem({ item }: OrderItemProps) {
  const { updateQuantity, updateItemOptions } = useCartStore()
  const { data: resolvedImageUrl } = usePublicBucketAsset(item.product.imageUrl, 'product-images', {
    width: 96,
    height: 96,
    quality: 70,
  })
  const imageSrc = resolvedImageUrl ?? item.product.imageUrl

  return (
    <div className="space-y-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {/* Thumbnail */}
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-cream-100">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={item.product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-lg">☕</div>
          )}
        </div>

        {/* Name + Price */}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-words text-sm font-medium text-stone-800">{item.product.name}</p>
          <p className="text-xs text-stone-400">{formatPrice(item.product.price)} each</p>
        </div>

        {/* Quantity controls */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:border-coffee-400 hover:text-coffee-700"
            aria-label="Decrease quantity"
          >
            {item.quantity === 1 ? <Trash2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          </button>
          <span className="w-5 text-center text-sm font-medium text-stone-800">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:border-coffee-400 hover:text-coffee-700"
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Line total */}
        <span className="w-16 flex-shrink-0 text-right text-sm font-semibold text-stone-800">
          {formatPrice(item.product.price * item.quantity)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-stone-500">
          Sugar Level
          <select
            value={item.sugarLevel}
            onChange={(e) =>
              updateItemOptions(item.product.id, { sugarLevel: Number(e.target.value) as SugarLevel })
            }
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 outline-none focus:border-coffee-400"
          >
            {ALLOWED_SUGAR_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}%
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-stone-500">
          Ice Level
          <select
            value={item.iceLevel}
            onChange={(e) =>
              updateItemOptions(item.product.id, { iceLevel: e.target.value as IceLevel })
            }
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 outline-none focus:border-coffee-400"
          >
            {ALLOWED_ICE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
      </div>

      <textarea
        value={item.orderNote}
        onChange={(e) => updateItemOptions(item.product.id, { orderNote: e.target.value })}
        placeholder="Order note (optional)"
        rows={2}
        className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 outline-none placeholder:text-stone-400 focus:border-coffee-400 focus:ring-2 focus:ring-coffee-100"
      />
    </div>
  )
}

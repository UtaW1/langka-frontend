import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useInfiniteProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { Table, type Column } from '@/components/Table'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { FilterSelect } from '@/components/FilterSelect'
import { formatDate, formatPrice } from '@/utils'
import { toIsoRange } from '@/utils/dateRange'
import type { Product, CreateProductRequest } from '@/types'
import { usePublicBucketAsset } from '../../hooks/usePublicBucketAsset'
import toast from 'react-hot-toast'

type RemovedFilterValue = 'all' | 'active' | 'removed'

function ProductThumb({ product }: { product: Product }) {
  const { data: resolvedImageUrl } = usePublicBucketAsset(product.imageUrl, 'product-images', {
    width: 72,
    height: 72,
    quality: 70,
  })
  const imageSrc = resolvedImageUrl ?? product.imageUrl

  return imageSrc ? (
    <img src={imageSrc} alt={product.name} className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full items-center justify-center text-base">☕</div>
  )
}

interface ProductFormState {
  code: string
  name: string
  description: string
  price: string
  categoryId: string
  available: boolean
  productImage: File | null
}

const EMPTY_FORM: ProductFormState = {
  code: '',
  name: '',
  description: '',
  price: '',
  categoryId: '',
  available: true,
  productImage: null,
}

export function ProductsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [removedFilter, setRemovedFilter] = useState<RemovedFilterValue>('all')
  const [startDatetime, setStartDatetime] = useState('')
  const [endDatetime, setEndDatetime] = useState('')

  const isRemovedFilter =
    removedFilter === 'active' ? 'no' : removedFilter === 'removed' ? 'yes' : null

  const listingRange = toIsoRange(startDatetime, endDatetime)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteProducts({ isRemoved: isRemovedFilter, ...listingRange })
  const { data: catData } = useCategories()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const categories = catData?.data ?? []
  const products = data?.pages.flatMap((p) => p.data) ?? []
  const total = data?.pages[0]?.total ?? 0

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(product: Product) {
    setEditTarget(product)
    setForm({
      code: product.code ?? '',
      name: product.name,
      description: product.description,
      price: String(product.price),
      categoryId: product.categoryId,
      available: product.available,
      productImage: null,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.categoryId) {
      toast.error('Please select a category.')
      return
    }

    const parsedPrice = Number(form.price)
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0.1) {
      toast.error('Price must be at least 0.10 USD.')
      return
    }

    if (editTarget) {
      await updateProduct.mutateAsync({
        id: editTarget.id,
        data: {
          code: form.code || undefined,
          name: form.name,
          description: form.description,
          price: parsedPrice,
          categoryId: form.categoryId,
          available: form.available,
          product_image: form.productImage ?? undefined,
        },
      })
    } else {
      const payload: CreateProductRequest = {
        name: form.name,
        code: form.code || undefined,
        product_category_id: Number(form.categoryId),
        price_as_usd: parsedPrice,
        product_image: form.productImage ?? undefined,
      }
      await createProduct.mutateAsync(payload)
    }
    setModalOpen(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteProduct.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-cream-100">
            <ProductThumb product={p} />
          </div>
          <div>
            <p className="font-medium text-stone-800">{p.name}</p>
            <p className="text-xs text-stone-400 line-clamp-1">{p.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (p) => (
        <span className="text-stone-600">{p.category?.name ?? '—'}</span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (p) => <span className="font-medium">{formatPrice(p.price)}</span>,
    },
    {
      key: 'available',
      header: 'Status',
      render: (p) =>
        p.available ? (
          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
            Available
          </span>
        ) : (
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-500">
            Unavailable
          </span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Added',
      render: (p) => <span className="text-stone-500">{p.createdAt ? formatDate(p.createdAt) : '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openEdit(p)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(p)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-stone-800">Products</h1>
          <p className="mt-0.5 text-sm text-stone-400">{total} items on the menu</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add product
        </Button>
      </div>

      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-stone-800">Listing Filters</h2>
          <p className="text-xs text-stone-500">These filters apply to the product table only.</p>
        </div>

        <div className="space-y-3">
          <div className="max-w-md">
            <FilterSelect
              id="product-removed-filter"
              label="Filter by Visibility"
              value={removedFilter}
              onChange={(next) => setRemovedFilter(next as RemovedFilterValue)}
              options={[
                { value: 'all', label: 'All products' },
                { value: 'active', label: 'Available only' },
                { value: 'removed', label: 'Removed only' },
              ]}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              value={startDatetime}
              onChange={(e) => setStartDatetime(e.target.value)}
            />

            <Input
              label="End Date & Time"
              type="datetime-local"
              value={endDatetime}
              onChange={(e) => setEndDatetime(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={products}
        loading={isLoading}
        keyExtractor={(p) => p.id}
        emptyMessage="No products yet. Add your first item."
      />
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit product' : 'Add product'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Code"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="Optional"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-stone-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-coffee-400 focus:ring-2 focus:ring-coffee-100"
            />
          </div>
          <Input
            label="Price (USD)"
            type="number"
            step="0.01"
            min="0.1"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-stone-700">
              {editTarget ? 'Replace Product Image' : 'Product Image'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  productImage: e.target.files && e.target.files.length > 0 ? e.target.files[0] : null,
                }))
              }
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:text-stone-700"
            />
            {editTarget && (
              <p className="text-xs text-stone-400">
                Leave empty to keep the current image.
              </p>
            )}
          </div>
          <FilterSelect
            label="Category"
            value={form.categoryId}
            onChange={(next) => setForm((f) => ({ ...f, categoryId: next }))}
            options={[
              { value: '', label: 'Select category' },
              ...categories.map((cat) => ({
                value: cat.id,
                label: cat.name,
              })),
            ]}
          />
          {editTarget && (
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))}
                className="rounded"
              />
              Available
            </label>
          )}
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createProduct.isPending || updateProduct.isPending}
            >
              {editTarget ? 'Save changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove product"
        maxWidth="sm"
      >
        <p className="mb-5 text-sm text-stone-600">
          Remove <span className="font-semibold">{deleteTarget?.name}</span>? This performs a soft
          delete by setting <code>removed_datetime</code>, and you can show it again from the removed
          products filter.
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteProduct.isPending}
            onClick={handleDelete}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { Plus, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, History, X } from 'lucide-react'
import {
  useCreateInventory,
  useCreateInventoryMovement,
  useDeleteInventory,
  useInventories,
  useInventoryMovements,
  useUpdateInventory,
} from '@/hooks/useInventories'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { Table, type Column } from '@/components/Table'
import { formatDate } from '@/utils'
import { usePublicBucketAsset } from '@/hooks/usePublicBucketAsset'
import type { CreateInventoryRequest, Inventory, MovementType } from '@/types'
import toast from 'react-hot-toast'

// ─── Small helpers ────────────────────────────────────────────────────────────

function InventoryThumb({ imageUrl, name }: { imageUrl?: string; name: string }) {
  const { data: resolved } = usePublicBucketAsset(imageUrl, 'inventory-images', {
    width: 72,
    height: 72,
    quality: 70,
  })
  const src = resolved ?? imageUrl
  return src ? (
    <img src={src} alt={name} className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full items-center justify-center text-base">📦</div>
  )
}

// ─── Movement sub-panel ───────────────────────────────────────────────────────

function MovementsPanel({
  inventory,
  onClose,
}: {
  inventory: Inventory
  onClose: () => void
}) {
  const inventoryId = inventory.id
  const [movementType, setMovementType] = useState<MovementType>('in')
  const [quantity, setQuantity] = useState('1')
  const [filterType, setFilterType] = useState<MovementType | ''>('')

  const { data, isLoading } = useInventoryMovements(inventoryId, {
    page_size: 30,
    movement_type: (filterType as MovementType) || undefined,
  })
  const createMovement = useCreateInventoryMovement(inventoryId)

  async function handleAddMovement(e: React.FormEvent) {
    e.preventDefault()
    const qty = parseInt(quantity, 10)
    if (!Number.isInteger(qty) || qty < 1) {
      toast.error('Quantity must be at least 1.')
      return
    }
    await createMovement.mutateAsync({ movement_type: movementType, quantity: qty })
    setQuantity('1')
  }

  const movements = data?.movements ?? []
  const actualQty = data?.actualQuantity ?? 0

  return (
    <div className="mt-6 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Stock Movement Center</p>
          <h2 className="mt-1 font-serif text-xl font-semibold text-stone-800">{inventory.name}</h2>
          <p className="mt-1 text-xs text-stone-500">{inventory.note || 'No supplier/location note'}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
          aria-label="Close stock movement center"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-5 flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3">
        <span className="text-sm text-stone-500">Current stock</span>
        <span
          className={[
            'text-lg font-semibold',
            actualQty > 0 ? 'text-green-700' : actualQty < 0 ? 'text-red-600' : 'text-stone-500',
          ].join(' ')}
        >
          {actualQty}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Stock adjust entity */}
        <form
          onSubmit={handleAddMovement}
          className="rounded-xl border border-stone-100 bg-stone-50/60 p-4"
        >
          <p className="mb-3 text-sm font-semibold text-stone-700">Adjust Stock</p>

          <div className="grid grid-cols-2 gap-2">
            {(['in', 'out'] as MovementType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMovementType(t)}
                className={[
                  'flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  movementType === t
                    ? t === 'in'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-500 text-white'
                    : 'border border-stone-200 bg-white text-stone-600 hover:border-coffee-300',
                ].join(' ')}
              >
                {t === 'in' ? <ArrowDownCircle className="h-3.5 w-3.5" /> : <ArrowUpCircle className="h-3.5 w-3.5" />}
                {t === 'in' ? 'Stock In' : 'Stock Out'}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              label="Quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />

            <Button
              type="submit"
              loading={createMovement.isPending}
              className="sm:self-end"
            >
              Record
            </Button>
          </div>

          <p className="mt-2 text-xs text-stone-500">
            Use Stock In when receiving items and Stock Out when consuming or discarding items.
          </p>
        </form>

        {/* History entity */}
        <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-700">Movement History</p>
            <div className="flex flex-wrap justify-end gap-1">
            {(['', 'in', 'out'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterType(f)}
                className={[
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  filterType === f
                    ? 'bg-coffee-700 text-white'
                    : 'border border-stone-200 text-stone-500 hover:border-coffee-300',
                ].join(' ')}
              >
                {f === '' ? 'All' : f === 'in' ? 'In' : 'Out'}
              </button>
            ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-stone-100" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-400">No movements recorded yet.</p>
          ) : (
            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {movements.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-stone-100 bg-white px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={[
                        'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                        m.movementType === 'in'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600',
                      ].join(' ')}
                    >
                      {m.movementType === 'in' ? '↓' : '↑'}
                    </span>
                    <span
                      className={[
                        'text-sm font-semibold',
                        m.movementType === 'in' ? 'text-green-700' : 'text-red-600',
                      ].join(' ')}
                    >
                      {m.movementType === 'in' ? '+' : '-'}
                      {m.quantity}
                    </span>
                  </div>
                  <span className="text-xs text-stone-400">{formatDate(m.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface FormState {
  name: string
  note: string
  inventoryImage: File | null
}

const EMPTY_FORM: FormState = { name: '', note: '', inventoryImage: null }

export function InventoryPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Inventory | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<Inventory | null>(null)
  const [movementsTarget, setMovementsTarget] = useState<Inventory | null>(null)

  const { data, isLoading } = useInventories()
  const createInventory = useCreateInventory()
  const updateInventory = useUpdateInventory()
  const deleteInventory = useDeleteInventory()

  const items = data?.data ?? []

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(item: Inventory) {
    setEditTarget(item)
    setForm({ name: item.name, note: item.note ?? '', inventoryImage: null })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const payload: CreateInventoryRequest = {
      name: form.name,
      note: form.note.trim() || null,
      inventory_image: form.inventoryImage ?? undefined,
    }

    if (editTarget) {
      await updateInventory.mutateAsync({ id: editTarget.id, data: payload })
    } else {
      await createInventory.mutateAsync(payload)
    }

    setModalOpen(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteInventory.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  const columns: Column<Inventory>[] = [
    {
      key: 'name',
      header: 'Item',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-cream-100">
            <InventoryThumb imageUrl={item.imageUrl} name={item.name} />
          </div>
          <div>
            <p className="font-medium text-stone-800">{item.name}</p>
            {item.note && (
              <p className="text-xs text-stone-400 line-clamp-1">{item.note}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'actualQuantity',
      header: 'Stock',
      render: (item) => (
        <span
          className={[
            'font-semibold',
            item.actualQuantity > 0
              ? 'text-green-700'
              : item.actualQuantity < 0
              ? 'text-red-600'
              : 'text-stone-400',
          ].join(' ')}
        >
          {item.actualQuantity}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Added',
      render: (item) => <span className="text-stone-500">{formatDate(item.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setMovementsTarget(item)}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 hover:border-coffee-300 hover:text-coffee-700"
          >
            <History className="h-3.5 w-3.5" />
            Manage Stock
          </button>
          <button
            onClick={() => openEdit(item)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-stone-800">Inventory</h1>
          <p className="mt-0.5 text-sm text-stone-400">{items.length} items tracked</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add item
        </Button>
      </div>

      <Table
        columns={columns}
        data={items}
        loading={isLoading}
        keyExtractor={(item) => item.id}
        emptyMessage="No inventory items yet."
      />

      {movementsTarget ? (
        <MovementsPanel
          inventory={movementsTarget}
          onClose={() => setMovementsTarget(null)}
        />
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-stone-200 bg-white p-6 text-center text-sm text-stone-400">
          Select <span className="font-medium text-stone-600">Manage Stock</span> on any item to record stock in/out and view movement history.
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit inventory item' : 'Add inventory item'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Location / Supplier"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="e.g. Central market, +855 12 345 678"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-stone-700">
              {editTarget ? 'Replace Image' : 'Image'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  inventoryImage: e.target.files?.[0] ?? null,
                }))
              }
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:text-stone-700"
            />
            {editTarget && (
              <p className="text-xs text-stone-400">Leave empty to keep the current image.</p>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createInventory.isPending || updateInventory.isPending}
            >
              {editTarget ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove inventory item"
        maxWidth="sm"
      >
        <p className="mb-5 text-sm text-stone-600">
          Remove <span className="font-semibold">{deleteTarget?.name}</span>? The item and its
          movement history will be soft-deleted.
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleteInventory.isPending} onClick={handleDelete}>
            Remove
          </Button>
        </div>
      </Modal>

    </div>
  )
}

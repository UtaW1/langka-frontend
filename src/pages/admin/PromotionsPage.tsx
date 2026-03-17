import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  useCreatePromotion,
  usePromotions,
  useRemovePromotion,
  useUpdatePromotion,
} from '@/hooks/usePromotions'
import { Table, type Column } from '@/components/Table'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import type { CreatePromotionRequest, Promotion } from '@/types'

const EMPTY_FORM: CreatePromotionRequest = {
  transaction_count_to_get_discount: 5,
  discount_as_percent: 10,
  status: 'active',
}

export function PromotionsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Promotion | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Promotion | null>(null)
  const [form, setForm] = useState<CreatePromotionRequest>(EMPTY_FORM)

  const { data, isLoading } = usePromotions()
  const createPromotion = useCreatePromotion()
  const updatePromotion = useUpdatePromotion()
  const removePromotion = useRemovePromotion()

  const promotions = data?.data ?? []

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(promotion: Promotion) {
    setEditTarget(promotion)
    setForm({
      transaction_count_to_get_discount: promotion.transactionCountToGetDiscount,
      discount_as_percent: promotion.discountAsPercent,
      status: promotion.status,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editTarget) {
      await updatePromotion.mutateAsync({ id: editTarget.id, data: form })
    } else {
      await createPromotion.mutateAsync(form)
    }
    setModalOpen(false)
  }

  async function handleRemove() {
    if (!removeTarget) return
    await removePromotion.mutateAsync(removeTarget.id)
    setRemoveTarget(null)
  }

  const columns: Column<Promotion>[] = [
    {
      key: 'id',
      header: 'Promotion ID',
      render: (p) => <span className="font-mono text-xs text-stone-500">#{p.id}</span>,
    },
    {
      key: 'rule',
      header: 'Rule',
      render: (p) => (
        <span className="text-stone-700">
          Every {p.transactionCountToGetDiscount} transactions
        </span>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (p) => <span className="font-semibold text-stone-800">{p.discountAsPercent}%</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <span
          className={[
            'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
            p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-600',
          ].join(' ')}
        >
          {p.status}
        </span>
      ),
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
            onClick={() => setRemoveTarget(p)}
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
          <h1 className="font-serif text-2xl font-semibold text-stone-800">Promotions</h1>
          <p className="mt-0.5 text-sm text-stone-400">{data?.total ?? 0} total promotions</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add promotion
        </Button>
      </div>

      <Table
        columns={columns}
        data={promotions}
        loading={isLoading}
        keyExtractor={(p) => p.id}
        emptyMessage="No promotions found."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit promotion' : 'Add promotion'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Transactions Needed"
            type="number"
            min="1"
            value={form.transaction_count_to_get_discount}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                transaction_count_to_get_discount: parseInt(e.target.value, 10) || 1,
              }))
            }
            required
          />
          <Input
            label="Discount (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.discount_as_percent}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                discount_as_percent: parseFloat(e.target.value) || 0,
              }))
            }
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-stone-700">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as 'active' | 'inactive',
                }))
              }
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-coffee-400"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createPromotion.isPending || updatePromotion.isPending}>
              {editTarget ? 'Save changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove promotion"
        maxWidth="sm"
      >
        <p className="mb-5 text-sm text-stone-600">
          Remove this promotion from active listings? This performs a soft delete and can be retained
          in history.
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={removePromotion.isPending} onClick={handleRemove}>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  )
}

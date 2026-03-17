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
import { FilterSelect } from '@/components/FilterSelect'
import { Modal } from '@/components/Modal'
import { formatDate } from '@/utils'
import { toIsoRange } from '@/utils/dateRange'
import type { CreatePromotionRequest, Promotion } from '@/types'
import toast from 'react-hot-toast'

interface PromotionFormState {
  transactionCountToGetDiscount: string
  discountAsPercent: string
  status: 'active' | 'inactive'
}

const EMPTY_FORM: PromotionFormState = {
  transactionCountToGetDiscount: '',
  discountAsPercent: '',
  status: 'active',
}

export function PromotionsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Promotion | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Promotion | null>(null)
  const [form, setForm] = useState<PromotionFormState>(EMPTY_FORM)
  const [startDatetime, setStartDatetime] = useState('')
  const [endDatetime, setEndDatetime] = useState('')

  const { data, isLoading } = usePromotions(toIsoRange(startDatetime, endDatetime))
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
      transactionCountToGetDiscount: String(promotion.transactionCountToGetDiscount),
      discountAsPercent: String(promotion.discountAsPercent),
      status: promotion.status,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const transactionCount = Number(form.transactionCountToGetDiscount)
    const discountPercent = Number(form.discountAsPercent)

    if (!Number.isFinite(transactionCount) || transactionCount < 1) {
      toast.error('Transactions needed must be at least 1.')
      return
    }

    if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      toast.error('Discount must be between 0 and 100.')
      return
    }

    const payload: CreatePromotionRequest = {
      transaction_count_to_get_discount: Math.trunc(transactionCount),
      discount_as_percent: discountPercent,
      status: form.status,
    }

    if (editTarget) {
      await updatePromotion.mutateAsync({ id: editTarget.id, data: payload })
    } else {
      await createPromotion.mutateAsync(payload)
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

      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-stone-800">Listing Filters</h2>
          <p className="text-xs text-stone-500">Filter promotions by inserted date range.</p>
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
            step="1"
            value={form.transactionCountToGetDiscount}
            onChange={(e) => setForm((prev) => ({ ...prev, transactionCountToGetDiscount: e.target.value }))}
            placeholder="e.g. 5"
            required
          />
          <Input
            label="Discount (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.discountAsPercent}
            onChange={(e) => setForm((prev) => ({ ...prev, discountAsPercent: e.target.value }))}
            placeholder="e.g. 10"
            required
          />
          <FilterSelect
            label="Status"
            value={form.status}
            onChange={(next) => setForm((prev) => ({ ...prev, status: next as 'active' | 'inactive' }))}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
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

import { useState } from 'react'
import { Plus, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReinstateCategory,
} from '@/hooks/useCategories'
import { Table, type Column } from '@/components/Table'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { FilterSelect } from '@/components/FilterSelect'
import { formatDate } from '@/utils'
import { toIsoRange } from '@/utils/dateRange'
import type { Category, CreateCategoryRequest } from '@/types'

const EMPTY_FORM: CreateCategoryRequest = { name: '', description: ''}
type RemovedFilterValue = 'all' | 'active' | 'removed'

export function CategoriesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [form, setForm] = useState<CreateCategoryRequest>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [removedFilter, setRemovedFilter] = useState<RemovedFilterValue>('all')
  const [startDatetime, setStartDatetime] = useState('')
  const [endDatetime, setEndDatetime] = useState('')

  const isRemovedFilter =
    removedFilter === 'active' ? 'no' : removedFilter === 'removed' ? 'yes' : null

  const { data, isLoading } = useCategories({
    ...toIsoRange(startDatetime, endDatetime),
    isRemoved: isRemovedFilter,
  })
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()
  const reinstateCategory = useReinstateCategory()

  const categories = data?.data ?? []

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(cat: Category) {
    setEditTarget(cat)
    setForm({ name: cat.name, description: cat.description ?? ''})
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editTarget) {
      await updateCategory.mutateAsync({ id: editTarget.id, data: form })
    } else {
      await createCategory.mutateAsync(form)
    }
    setModalOpen(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteCategory.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  async function handleReinstate(category: Category) {
    await reinstateCategory.mutateAsync(category.id)
  }

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => <span className="font-medium text-stone-800">{c.name}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (c) => <span className="text-stone-600">{c.description || '—'}</span>,
    },
    {
      key: 'productCount',
      header: 'Products',
      render: (c) => <span className="text-stone-700">{c.productCount ?? 0}</span>,
    },
    {
      key: 'createdAt',
      header: 'Added',
      render: (c) => <span className="text-stone-500">{c.createdAt ? formatDate(c.createdAt) : '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <div className="flex items-center justify-end gap-2">
          {c.removedDatetime ? (
            <button
              onClick={() => handleReinstate(c)}
              className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-stone-500 hover:bg-green-50 hover:text-green-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reinstate
            </button>
          ) : (
            <>
              <button
                onClick={() => openEdit(c)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDeleteTarget(c)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-stone-800">Categories</h1>
          <p className="mt-0.5 text-sm text-stone-400">{categories.length} categories</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add category
        </Button>
      </div>

      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-stone-800">Listing Filters</h2>
          <p className="text-xs text-stone-500">Filter categories by visibility and inserted date range.</p>
        </div>
        <div className="space-y-3">
          <div className="max-w-md">
            <FilterSelect
              id="category-removed-filter"
              label="Filter by Visibility"
              value={removedFilter}
              onChange={(next) => setRemovedFilter(next as RemovedFilterValue)}
              options={[
                { value: 'all', label: 'All categories' },
                { value: 'active', label: 'Active only' },
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
        data={categories}
        loading={isLoading}
        keyExtractor={(c) => c.id}
        emptyMessage="No categories yet."
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit category' : 'Add category'}
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
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createCategory.isPending || updateCategory.isPending}
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
        title="Remove category"
        maxWidth="sm"
      >
        <p className="mb-5 text-sm text-stone-600">
          Remove <span className="font-semibold">{deleteTarget?.name}</span>? This performs a
          soft delete by setting <code>removed_datetime</code>, and hidden records will no longer
          appear in list endpoints.
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteCategory.isPending}
            onClick={handleDelete}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  )
}

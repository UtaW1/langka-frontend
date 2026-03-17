import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  useCreateEmployee,
  useDeleteEmployee,
  useEmployees,
  useUpdateEmployee,
} from '@/hooks/useEmployees'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { Table, type Column } from '@/components/Table'
import { formatDate, formatPhone, initials } from '@/utils'
import { toIsoRange } from '@/utils/dateRange'
import type { CreateEmployeeRequest, Employee } from '@/types'

const EMPTY_FORM: CreateEmployeeRequest = {
  name: '',
  phone: '',
}

export function EmployeesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [form, setForm] = useState<CreateEmployeeRequest>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [startDatetime, setStartDatetime] = useState('')
  const [endDatetime, setEndDatetime] = useState('')

  const { data, isLoading } = useEmployees(toIsoRange(startDatetime, endDatetime))
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const deleteEmployee = useDeleteEmployee()

  const employees = data?.data ?? []

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(employee: Employee) {
    setEditTarget(employee)
    setForm({ name: employee.name, phone: employee.phone })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (editTarget) {
      await updateEmployee.mutateAsync({ id: editTarget.id, data: form })
    } else {
      await createEmployee.mutateAsync(form)
    }

    setModalOpen(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteEmployee.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      render: (employee) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-coffee-100 text-xs font-semibold text-coffee-700">
            {employee.name ? initials(employee.name) : '?'}
          </div>
          <div>
            <p className="font-medium text-stone-800">{employee.name || '—'}</p>
            <p className="text-xs text-stone-400">{formatPhone(employee.phone)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Added',
      render: (employee) => <span className="text-stone-500">{formatDate(employee.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (employee) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openEdit(employee)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(employee)}
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
          <h1 className="font-serif text-2xl font-semibold text-stone-800">Employees</h1>
          <p className="mt-0.5 text-sm text-stone-400">{employees.length} employees</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add employee
        </Button>
      </div>

      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-stone-800">Listing Filters</h2>
          <p className="text-xs text-stone-500">Filter employees by inserted date range.</p>
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
        data={employees}
        loading={isLoading}
        keyExtractor={(employee) => employee.id}
        emptyMessage="No employees yet."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit employee' : 'Add employee'}
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
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            required
          />
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createEmployee.isPending || updateEmployee.isPending}
            >
              {editTarget ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove employee"
        maxWidth="sm"
      >
        <p className="mb-5 text-sm text-stone-600">
          Remove <span className="font-semibold">{deleteTarget?.name}</span>?
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteEmployee.isPending}
            onClick={handleDelete}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  )
}

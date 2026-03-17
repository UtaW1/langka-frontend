import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useUsers, useDeleteUser, useExportUsersReport } from '@/hooks/useUsers'
import { Table, type Column } from '@/components/Table'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { Input } from '@/components/Input'
import { formatDate, formatPhone, formatPrice, initials } from '@/utils'
import { toIsoRange } from '@/utils/dateRange'
import type { User } from '@/types'
import toast from 'react-hot-toast'

function toDatetimeLocalValue(date: Date): string {
  const tzOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

export function UsersPage() {
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [listingStartDatetime, setListingStartDatetime] = useState('')
  const [listingEndDatetime, setListingEndDatetime] = useState('')

  const { data, isLoading } = useUsers(toIsoRange(listingStartDatetime, listingEndDatetime))
  const deleteUser = useDeleteUser()
  const exportReport = useExportUsersReport()

  const now = useMemo(() => new Date(), [])
  const defaultStart = useMemo(() => {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    d.setHours(0, 0, 0, 0)
    return toDatetimeLocalValue(d)
  }, [now])
  const defaultEnd = useMemo(() => toDatetimeLocalValue(now), [now])
  const [startDatetime, setStartDatetime] = useState(defaultStart)
  const [endDatetime, setEndDatetime] = useState(defaultEnd)

  const users = data?.data ?? []

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteUser.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  async function handleExportReport() {
    if (!startDatetime || !endDatetime) {
      toast.error('Please select both start and end date/time.')
      return
    }

    const start = new Date(startDatetime)
    const end = new Date(endDatetime)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error('Invalid date/time range.')
      return
    }

    if (start >= end) {
      toast.error('Start date/time must be earlier than end date/time.')
      return
    }

    try {
      const url = await exportReport.mutateAsync({
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
      })

      window.open(url, '_blank', 'noopener,noreferrer')
      toast.success('User report download link generated.')
    } catch {
      toast.error('Failed to export user report.')
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-coffee-100 text-xs font-semibold text-coffee-700">
            {u.name ? initials(u.name) : '?'}
          </div>
          <div>
            <p className="font-medium text-stone-800">{u.name ?? '—'}</p>
            <p className="text-xs text-stone-400">{formatPhone(u.phone_number)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'totalCompletedTransactions',
      header: 'Completed Tx',
      render: (u) => (
        <span className="font-medium text-stone-700">
          {(u.totalCompletedTransactions ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'totalRevenueGenerated',
      header: 'Revenue Generated',
      render: (u) => (
        <span className="font-medium text-stone-700">
          {formatPrice(u.totalRevenueGenerated ?? 0)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (u) => <span className="text-stone-500">{formatDate(u.createdAt)}</span>,
    },
  ]

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-stone-800">Users</h1>
        <p className="mt-0.5 text-sm text-stone-400">{data?.total ?? 0} registered users</p>
      </div>

      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-stone-800">Export Report</h2>
            <p className="text-xs text-stone-500">Generate an Excel user report for a selected time span.</p>
          </div>
          <Button
            type="button"
            onClick={handleExportReport}
            loading={exportReport.isPending}
            className="whitespace-nowrap"
          >
            <Download className="h-4 w-4" /> Download Excel
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Start Date & Time"
            type="datetime-local"
            value={startDatetime}
            onChange={(e) => setStartDatetime(e.target.value)}
            required
          />
          <Input
            label="End Date & Time"
            type="datetime-local"
            value={endDatetime}
            onChange={(e) => setEndDatetime(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-stone-800">Listing Filters</h2>
          <p className="text-xs text-stone-500">Filter users by inserted date range.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Start Date & Time"
            type="datetime-local"
            value={listingStartDatetime}
            onChange={(e) => setListingStartDatetime(e.target.value)}
          />
          <Input
            label="End Date & Time"
            type="datetime-local"
            value={listingEndDatetime}
            onChange={(e) => setListingEndDatetime(e.target.value)}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={users}
        loading={isLoading}
        keyExtractor={(u) => u.id}
        emptyMessage="No users yet."
      />

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove user"
        maxWidth="sm"
      >
        <p className="mb-5 text-sm text-stone-600">
          Remove{' '}
          <span className="font-semibold">{deleteTarget?.name ?? deleteTarget?.phone_number}</span>?
          This will permanently delete their account.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteUser.isPending}
            onClick={handleDelete}
          >
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  )
}

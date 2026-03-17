import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useExportTransactionsReport, useTransaction, useTransactions } from '@/hooks/useTransactions'
import { useEmployees } from '@/hooks/useEmployees'
import { Table, type Column } from '@/components/Table'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { FilterSelect } from '@/components/FilterSelect'
import { formatPrice, formatDate, formatPhone } from '@/utils'
import { toIsoRange } from '@/utils/dateRange'
import type { Transaction } from '@/types'
import toast from 'react-hot-toast'

function toDatetimeLocalValue(date: Date): string {
  const tzOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

export function TransactionsPage() {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'cancelled' | ''>('')
  const [employeeIdFilter, setEmployeeIdFilter] = useState('')
  const [listingStartDatetime, setListingStartDatetime] = useState('')
  const [listingEndDatetime, setListingEndDatetime] = useState('')
  const [pageNumber, setPageNumber] = useState(0)
  const pageSize = 16

  const { data: employeesData } = useEmployees()
  const listingRange = toIsoRange(listingStartDatetime, listingEndDatetime)
  const { data, isLoading } = useTransactions({
    status: statusFilter || undefined,
    employee_id: employeeIdFilter || undefined,
    page_number: pageNumber,
    page_size: pageSize,
    ...listingRange,
  })
  const exportReport = useExportTransactionsReport()
  const transactions = data?.data ?? []
  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort((a, b) => {
        const left = new Date(a.createdAt).getTime()
        const right = new Date(b.createdAt).getTime()
        return right - left
      }),
    [transactions],
  )
  const employees = employeesData?.data ?? []
  const totalTransactions = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalTransactions / pageSize))
  const canGoPrev = pageNumber > 0
  const canGoNext = pageNumber + 1 < totalPages
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const {
    data: selectedTransaction,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useTransaction(selectedTransactionId ?? undefined)

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

  useEffect(() => {
    setPageNumber(0)
  }, [statusFilter, employeeIdFilter, listingStartDatetime, listingEndDatetime])

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
      toast.success('Report download link generated.')
    } catch {
      toast.error('Failed to export transactions report.')
    }
  }

  const columns: Column<Transaction>[] = [
    {
      key: 'id',
      header: 'Transaction ID',
      render: (tx) => (
        <span className="font-mono text-xs text-stone-500">#{tx.id.slice(-8).toUpperCase()}</span>
      ),
    },
    {
      key: 'tableNumber',
      header: 'Table',
      render: (tx) => (
        <span className="font-medium text-stone-700">{tx.tableNumber || '—'}</span>
      ),
    },
    {
      key: 'employee',
      header: 'Employee',
      render: (tx) => (
        <span className="text-stone-700">{tx.employee || '—'}</span>
      ),
    },
    {
      key: 'billPriceUsd',
      header: 'Amount',
      render: (tx) => {
        const finalAmount = tx.billPriceAfterDiscountUsd ?? tx.billPriceUsd
        const hasDiscount = (tx.discountAmountUsd ?? 0) > 0

        return (
          <div className="space-y-0.5">
            <p className="font-semibold text-stone-800">{formatPrice(finalAmount)}</p>
            {hasDiscount && (
              <p className="text-xs text-emerald-700">
                Saved {formatPrice(tx.discountAmountUsd ?? 0)}
                {tx.promotionDiscountAsPercent != null
                  ? ` (${tx.promotionDiscountAsPercent}% off)`
                  : ''}
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (tx) => {
        const colors: Record<string, string> = {
          pending: 'bg-amber-50 text-amber-700',
          paid: 'bg-green-50 text-green-700',
          cancelled: 'bg-red-50 text-red-600',
          refunded: 'bg-amber-50 text-amber-700',
          failed: 'bg-red-50 text-red-600',
        }
        return (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
              colors[tx.status] ?? 'bg-stone-100 text-stone-600'
            }`}
          >
            {tx.status}
          </span>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (tx) => (
        <span className="text-stone-500">{formatDate(tx.createdAt)}</span>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (tx) => {
        return (
          <button
            type="button"
            onClick={() =>
              setSelectedTransactionId((prev) => (prev === tx.id ? null : tx.id))
            }
            className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 hover:border-coffee-300 hover:text-coffee-700"
          >
            {selectedTransactionId === tx.id ? 'Hide' : 'View'}
          </button>
        )
      },
    },
  ]

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-stone-800">Transactions</h1>
        <p className="mt-0.5 text-sm text-stone-400">{totalTransactions} total transactions</p>
      </div>

      <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-stone-800">Export Report</h2>
            <p className="text-xs text-stone-500">Generate an Excel report for a selected time span.</p>
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
          <p className="text-xs text-stone-500">These filters apply to the transaction table only.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <FilterSelect
            label="Filter by Status"
            value={statusFilter}
            onChange={(next) => setStatusFilter(next as 'pending' | 'completed' | 'cancelled' | '')}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />

          <FilterSelect
            label="Filter by Employee"
            value={employeeIdFilter}
            onChange={setEmployeeIdFilter}
            options={[
              { value: '', label: 'All employees' },
              ...employees.map((employee) => ({
                value: employee.id,
                label: employee.name,
              })),
            ]}
          />

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
        data={sortedTransactions}
        loading={isLoading}
        keyExtractor={(tx) => tx.id}
        emptyMessage="No transactions yet."
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3">
        <p className="text-xs text-stone-500">
          Page {pageNumber + 1} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!canGoPrev || isLoading}
            onClick={() => setPageNumber((prev) => Math.max(0, prev - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!canGoNext || isLoading}
            onClick={() => setPageNumber((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {selectedTransactionId && (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-stone-800">Transaction Details</h2>
            <span className="font-mono text-xs text-stone-400">#{selectedTransactionId}</span>
          </div>

          {isDetailLoading ? (
            <p className="text-sm text-stone-500">Loading transaction details…</p>
          ) : isDetailError || !selectedTransaction ? (
            <p className="text-sm text-red-500">Failed to load transaction details.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-stone-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-stone-500">User</p>
                  <p className="mt-1 text-sm font-medium text-stone-700">{selectedTransaction.userName || '—'}</p>
                </div>
                <div className="rounded-xl bg-stone-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-stone-500">Phone</p>
                  <p className="mt-1 text-sm text-stone-700">
                    {selectedTransaction.userPhone ? formatPhone(selectedTransaction.userPhone) : '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-stone-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-stone-500">Table</p>
                  <p className="mt-1 text-sm font-medium text-stone-700">{selectedTransaction.tableNumber || '—'}</p>
                </div>
                <div className="rounded-xl bg-stone-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-stone-500">Total</p>
                  {selectedTransaction.billPriceBeforeDiscountUsd != null &&
                    (selectedTransaction.discountAmountUsd ?? 0) > 0 && (
                      <p className="mt-1 text-xs text-stone-500 line-through">
                        {formatPrice(selectedTransaction.billPriceBeforeDiscountUsd)}
                      </p>
                    )}
                  <p className="mt-1 text-sm font-semibold text-stone-800">
                    {formatPrice(selectedTransaction.billPriceAfterDiscountUsd ?? selectedTransaction.billPriceUsd)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-stone-100 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-stone-700">Billing Summary</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-stone-50 px-3 py-2.5">
                    <p className="text-xs uppercase tracking-wide text-stone-500">Subtotal</p>
                    <p className="mt-1 text-sm font-medium text-stone-700">
                      {formatPrice(selectedTransaction.billPriceBeforeDiscountUsd ?? selectedTransaction.billPriceUsd)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-stone-50 px-3 py-2.5">
                    <p className="text-xs uppercase tracking-wide text-stone-500">Discount</p>
                    <p className="mt-1 text-sm font-medium text-emerald-700">
                      -{formatPrice(selectedTransaction.discountAmountUsd ?? 0)}
                      {selectedTransaction.promotionDiscountAsPercent != null
                        ? ` (${selectedTransaction.promotionDiscountAsPercent}% off)`
                        : ''}
                    </p>
                  </div>
                  <div className="rounded-lg bg-stone-50 px-3 py-2.5">
                    <p className="text-xs uppercase tracking-wide text-stone-500">Final Total</p>
                    <p className="mt-1 text-sm font-semibold text-stone-800">
                      {formatPrice(selectedTransaction.billPriceAfterDiscountUsd ?? selectedTransaction.billPriceUsd)}
                    </p>
                  </div>
                </div>

                {selectedTransaction.promotionApplyId && (
                  <p className="mt-3 text-xs text-stone-500">
                    Promotion applied ID: <span className="font-mono">{selectedTransaction.promotionApplyId}</span>
                  </p>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-stone-700">Ordered Items</h3>
                {selectedTransaction.productsOrders && selectedTransaction.productsOrders.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTransaction.productsOrders.map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-stone-800">{item.name || `Product ${item.productId}`}</p>
                          <span className="text-xs font-semibold text-stone-600">x{item.quantity}</span>
                        </div>
                        <div className="mt-2 grid gap-1 text-xs text-stone-600 md:grid-cols-3">
                          <p>Sugar: {item.sugarLevel ?? '—'}{item.sugarLevel != null ? '%' : ''}</p>
                          <p>Ice: {item.iceLevel ?? '—'}</p>
                          <p>Note: {item.orderNote?.trim() ? item.orderNote : '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-stone-500">No item details returned.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

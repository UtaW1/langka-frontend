import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  useCreateSeatingTable,
  useDeleteSeatingTable,
  useSeatingTableTransactions,
  useSeatingTables,
  useUpdateSeatingTable,
} from '@/hooks/useSeatingTables'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { Table, type Column } from '@/components/Table'
import { formatDate, formatPrice } from '@/utils'
import { toIsoRange } from '@/utils/dateRange'
import type { CreateSeatingTableRequest, SeatingTable, SeatingTableTransactions } from '@/types'
import toast from 'react-hot-toast'

const EMPTY_FORM: CreateSeatingTableRequest = {
  table_number: '',
  seating_count: 1,
}

export function SeatingTablesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SeatingTable | null>(null)
  const [form, setForm] = useState<CreateSeatingTableRequest>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<SeatingTable | null>(null)
  const [transactionsTarget, setTransactionsTarget] = useState<SeatingTableTransactions | null>(null)
  const [qrTarget, setQrTarget] = useState<SeatingTable | null>(null)
  const [startDatetime, setStartDatetime] = useState('')
  const [endDatetime, setEndDatetime] = useState('')

  const listingRange = toIsoRange(startDatetime, endDatetime)
  const { data, isLoading } = useSeatingTables(listingRange)
  const { data: txData } = useSeatingTableTransactions(listingRange)
  const createSeatingTable = useCreateSeatingTable()
  const updateSeatingTable = useUpdateSeatingTable()
  const deleteSeatingTable = useDeleteSeatingTable()

  const seatingTables = data?.data ?? []
  const tablesWithTransactions = txData?.data ?? []
  const tableTransactionsMap = new Map(
    tablesWithTransactions.map((table) => [table.id, table.transactions]),
  )

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(table: SeatingTable) {
    setEditTarget(table)
    setForm({ table_number: table.tableNumber, seating_count: table.seatingCount })
    setModalOpen(true)
  }

  function buildOrderUrl(tableId: string) {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/order?seating_table_id=${tableId}`
  }

  function buildQrImageUrl(payload: string) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(payload)}`
  }

  async function handleCopyOrderUrl(table: SeatingTable) {
    const url = buildOrderUrl(table.id)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Order URL copied.')
    } catch {
      toast.error('Failed to copy URL.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const seatingCount = Number(form.seating_count)

    if (!Number.isFinite(seatingCount) || seatingCount < 1) {
      toast.error('Seating count must be at least 1.')
      return
    }

    if (editTarget) {
      await updateSeatingTable.mutateAsync({
        id: editTarget.id,
        data: { table_number: form.table_number, seating_count: seatingCount },
      })
    } else {
      await createSeatingTable.mutateAsync({
        table_number: form.table_number,
        seating_count: seatingCount,
      })
    }

    setModalOpen(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteSeatingTable.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  const columns: Column<SeatingTable>[] = [
    {
      key: 'tableNumber',
      header: 'Table Number',
      render: (table) => <span className="font-medium text-stone-800">{table.tableNumber}</span>,
    },
    {
      key: 'seatingCount',
      header: 'Seats',
      render: (table) => <span className="text-stone-700">{table.seatingCount}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (table) => <span className="text-stone-600">{formatDate(table.createdAt)}</span>,
    },
    {
      key: 'transactions',
      header: 'Transactions',
      render: (table) => (
        <span className="text-stone-700">{tableTransactionsMap.get(table.id)?.length ?? 0}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (table) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setQrTarget(table)}
            className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 hover:border-coffee-300 hover:text-coffee-700"
          >
            QR
          </button>
          <button
            onClick={() => {
              const matched = tablesWithTransactions.find((t) => t.id === table.id)
              setTransactionsTarget(
                matched ?? {
                  ...table,
                  transactions: [],
                },
              )
            }}
            className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 hover:border-coffee-300 hover:text-coffee-700"
          >
            View Transactions
          </button>
          <button
            onClick={() => openEdit(table)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(table)}
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
          <h1 className="font-serif text-2xl font-semibold text-stone-800">Seating Tables</h1>
          <p className="mt-0.5 text-sm text-stone-400">{seatingTables.length} tables configured</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add table
        </Button>
      </div>

      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-stone-800">Listing Filters</h2>
          <p className="text-xs text-stone-500">Filter seating tables by inserted date range.</p>
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
        data={seatingTables}
        loading={isLoading}
        keyExtractor={(table) => table.id}
        emptyMessage="No seating tables yet."
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit seating table' : 'Add seating table'}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Table Number"
            value={form.table_number}
            onChange={(e) => setForm((f) => ({ ...f, table_number: e.target.value }))}
            placeholder="e.g. A1"
            required
          />
          <Input
            label="Seating Count"
            type="number"
            min="1"
            step="1"
            value={String(form.seating_count ?? 1)}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                seating_count: Number(e.target.value),
              }))
            }
            required
          />
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createSeatingTable.isPending || updateSeatingTable.isPending}
            >
              {editTarget ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove seating table"
        maxWidth="sm"
      >
        <p className="mb-5 text-sm text-stone-600">
          Remove table <span className="font-semibold">{deleteTarget?.tableNumber}</span>?
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteSeatingTable.isPending}
            onClick={handleDelete}
          >
            Remove
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!transactionsTarget}
        onClose={() => setTransactionsTarget(null)}
        title={`Transactions · ${transactionsTarget?.tableNumber ?? ''}`}
      >
        {transactionsTarget?.transactions?.length ? (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {transactionsTarget.transactions.map((tx) => (
              <div key={tx.id} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs text-stone-500">#{tx.id.slice(-8).toUpperCase()}</p>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium capitalize text-stone-600">
                    {tx.status}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-xs text-stone-600">
                  <p>Invoice: <span className="font-mono">{tx.invoiceId || '—'}</span></p>
                  <p>Total: <span className="font-semibold text-stone-800">{formatPrice(tx.billPriceUsd)}</span></p>
                  <p>Date: {formatDate(tx.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-500">No transactions returned for this table on this page.</p>
        )}
      </Modal>

      <Modal
        open={!!qrTarget}
        onClose={() => setQrTarget(null)}
        title={`QR · ${qrTarget?.tableNumber ?? ''}`}
        maxWidth="sm"
      >
        {qrTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
              <p className="text-xs text-stone-500">Order URL</p>
              <p className="mt-1 break-all text-xs text-stone-700">{buildOrderUrl(qrTarget.id)}</p>
            </div>

            <div className="flex justify-center">
              <img
                src={buildQrImageUrl(buildOrderUrl(qrTarget.id))}
                alt={`QR for ${qrTarget.tableNumber}`}
                className="h-64 w-64 rounded-xl border border-stone-200 bg-white p-2"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleCopyOrderUrl(qrTarget)}
              >
                Copy URL
              </Button>
              <a
                href={buildQrImageUrl(buildOrderUrl(qrTarget.id))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-coffee-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-coffee-800"
              >
                Open / Download QR
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

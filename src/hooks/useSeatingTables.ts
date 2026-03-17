import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { seatingTablesApi } from '@/api/seatingTables'
import type { CreateSeatingTableRequest, UpdateSeatingTableRequest } from '@/types'

export const SEATING_TABLES_KEY = 'seating_tables'
export const SEATING_TABLE_TRANSACTIONS_KEY = 'seating_table_transactions'

export function useSeatingTables() {
  return useQuery({
    queryKey: [SEATING_TABLES_KEY],
    queryFn: () => seatingTablesApi.list(),
  })
}

export function useSeatingTableTransactions() {
  return useQuery({
    queryKey: [SEATING_TABLE_TRANSACTIONS_KEY],
    queryFn: () => seatingTablesApi.listTableTransactions(),
  })
}

export function useCreateSeatingTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSeatingTableRequest) => seatingTablesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SEATING_TABLES_KEY] })
      toast.success('Seating table created.')
    },
    onError: () => toast.error('Failed to create seating table.'),
  })
}

export function useUpdateSeatingTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSeatingTableRequest }) =>
      seatingTablesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SEATING_TABLES_KEY] })
      toast.success('Seating table updated.')
    },
    onError: () => toast.error('Failed to update seating table.'),
  })
}

export function useDeleteSeatingTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => seatingTablesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SEATING_TABLES_KEY] })
      toast.success('Seating table removed.')
    },
    onError: () => toast.error('Failed to remove seating table.'),
  })
}

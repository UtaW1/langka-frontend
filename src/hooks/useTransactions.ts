import { useMutation, useQuery } from '@tanstack/react-query'
import { transactionsApi } from '@/api/transactions'
import type { ExportTransactionsReportRequest, TransactionListParams } from '@/types'

export const TRANSACTIONS_KEY = 'transactions'

export function useTransactions(params?: TransactionListParams) {
  return useQuery({
    queryKey: [TRANSACTIONS_KEY, params],
    queryFn: () => transactionsApi.list(params),
  })
}

export function useTransaction(id?: string) {
  return useQuery({
    queryKey: [TRANSACTIONS_KEY, 'detail', id],
    queryFn: () => transactionsApi.get(id || ''),
    enabled: !!id,
  })
}

export function useExportTransactionsReport() {
  return useMutation({
    mutationFn: (payload: ExportTransactionsReportRequest) =>
      transactionsApi.exportReport(payload),
  })
}

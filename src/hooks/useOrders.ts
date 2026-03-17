import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { transactionsApi } from '@/api/transactions'
import type { CreatePendingTransactionRequest, PaginationParams } from '@/types'

export const ORDERS_KEY = 'orders'

export function useOrders(params?: PaginationParams) {
  return useQuery({
    queryKey: [ORDERS_KEY, params],
    queryFn: () => transactionsApi.list(params),
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: [ORDERS_KEY, id],
    queryFn: () => transactionsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePendingTransactionRequest) => transactionsApi.createPending(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: () => toast.error('Failed to create pending transaction. Please try again.'),
  })
}

export function useUpdateOrderStatus() {
  return useMutation({
    mutationFn: async () => {
      throw new Error('Status updates are managed in transactions API.')
    },
    onError: () => toast.error('Status updates are not available in this flow.'),
  })
}

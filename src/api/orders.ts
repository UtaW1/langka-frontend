import apiClient from './client'
import { BASE_URL } from './client'
import type {
  CreatePendingTransactionRequest,
  PaginatedResponse,
  PaginationParams,
  Transaction,
} from '@/types'
import { useAuthStore } from '@/store/authStore'

function normalizeTransaction(raw: any): Transaction {
  return {
    id: String(raw.id),
    status: raw.status,
    invoiceId: String(raw.invoice_id ?? raw.invoiceId ?? ''),
    billPriceUsd: parseFloat(raw.bill_price_as_usd ?? raw.billPriceUsd ?? '0'),
    userId: raw.user_id == null ? undefined : String(raw.user_id),
    tableNumber: raw.table_number ?? raw.tableNumber ?? '',
    createdAt: raw.inserted_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  }
}

export const ordersApi = {
  list: (params?: PaginationParams) =>
    apiClient
      .get<any>('/transactions', { params })
      .then((r) => {
        const arr = Array.isArray(r.data) ? r.data : (r.data.data ?? [])
        return {
          data: arr.map(normalizeTransaction),
          total: parseInt(r.headers['x-paging-total-count'] ?? r.data.total ?? arr.length, 10),
          page: params?.page_number || r.data.page || 1,
          limit: params?.page_size || r.data.limit || arr.length,
          totalPages: r.data.totalPages ?? 1,
        } as PaginatedResponse<Transaction>
      }),

  get: (id: string) =>
    apiClient.get<any>(`/transactions/${id}`).then((r) => normalizeTransaction(r.data)),

  create: (data: CreatePendingTransactionRequest) =>
    apiClient.post<any>('/transactions/pending', data).then((r) => normalizeTransaction(r.data)),

  updateStatus: (_id: string, _status: string) =>
    Promise.reject(new Error('Status updates are handled by backend transaction workflow.')),
}

/** Opens an SSE connection to stream order status events */
export function createOrderEventSource(orderId: string): EventSource {
  const token = useAuthStore.getState().token
  const qs = new URLSearchParams({ transaction_id: orderId })
  if (token) qs.set('token', token)
  const url = `${BASE_URL}/transaction/stream?${qs.toString()}`
  return new EventSource(url)
}

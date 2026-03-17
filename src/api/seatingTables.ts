import apiClient from './client'
import { withPage } from './helper'
import type {
  CreateSeatingTableRequest,
  PaginatedResponse,
  PaginationParams,
  SeatingTable,
  SeatingTableTransactions,
  Transaction,
  UpdateSeatingTableRequest,
} from '@/types'

function normalize(raw: any): SeatingTable {
  return {
    id: String(raw.id),
    tableNumber: String(raw.table_number ?? raw.tableNumber ?? ''),
    seatingCount: Number(raw.seating_count ?? raw.seatingCount ?? 0),
    createdAt: raw.inserted_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  }
}

function normalizeTransaction(raw: any): Transaction {
  return {
    id: String(raw.id),
    status: raw.status ?? 'completed',
    invoiceId: String(raw.invoice_id ?? raw.invoiceId ?? ''),
    billPriceUsd: parseFloat(raw.bill_price_as_usd ?? raw.billPriceUsd ?? '0'),
    userId: raw.user_id == null ? undefined : String(raw.user_id),
    tableNumber: raw.table_number ?? raw.tableNumber,
    promotionApplyId:
      raw.promotion_apply_id == null
        ? raw.promotion_id == null
          ? undefined
          : String(raw.promotion_id)
        : String(raw.promotion_apply_id),
    productsOrders: Array.isArray(raw.products_orders)
      ? raw.products_orders.map((po: any) => ({
          id: po.id == null ? undefined : Number(po.id),
          productId: Number(po.product_id ?? 0),
          quantity: Number(po.quantity ?? 0),
          name: String(po.name ?? ''),
          sugarLevel: po.sugar_level,
          iceLevel: po.ice_level,
          orderNote: po.order_note ?? '',
        }))
      : undefined,
    createdAt: raw.inserted_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  }
}

function normalizeTableWithTransactions(raw: any): SeatingTableTransactions {
  return {
    ...normalize(raw),
    transactions: Array.isArray(raw.transactions)
      ? raw.transactions.map(normalizeTransaction)
      : [],
  }
}

export const seatingTablesApi = {
  list: (params?: PaginationParams) =>
    apiClient
      .get<any>('/admin/seating_tables', { params: withPage(params) })
      .then((r) => {
        const arr = Array.isArray(r.data) ? r.data : (r.data.data ?? [])
        return {
          data: arr.map(normalize),
          total: parseInt(r.headers['x-paging-total-count'] ?? r.data.total ?? arr.length, 10),
          page: params?.page_number || r.data.page || 1,
          limit: params?.page_size || r.data.limit || arr.length,
          totalPages: r.data.totalPages ?? 1,
        } as PaginatedResponse<SeatingTable>
      }),

  get: (id: string) =>
    apiClient.get<any>(`/admin/seating_tables/${id}`).then((r) => normalize(r.data)),

  create: (data: CreateSeatingTableRequest) =>
    apiClient.post<any>('/admin/seating_tables', data).then((r) => normalize(r.data)),

  update: (id: string, data: UpdateSeatingTableRequest) =>
    apiClient.patch<any>(`/admin/seating_tables/${id}`, data).then((r) => normalize(r.data)),

  delete: (id: string) =>
    apiClient.delete(`/admin/seating_tables/${id}`).then((r) => r.data),

  listTableTransactions: async (params?: PaginationParams) => {
    const endpoints = ['/admin/list_table_transaction', '/list_table_transaction']

    for (const endpoint of endpoints) {
      try {
        const r = await apiClient.get<any>(endpoint, { params: withPage(params) })
        const arr = Array.isArray(r.data) ? r.data : (r.data.data ?? [])
        return {
          data: arr.map(normalizeTableWithTransactions),
          total: parseInt(r.headers['x-paging-total-count'] ?? r.data.total ?? arr.length, 10),
          page: params?.page_number || r.data.page || 1,
          limit: params?.page_size || r.data.limit || arr.length,
          totalPages: r.data.totalPages ?? 1,
        } as PaginatedResponse<SeatingTableTransactions>
      } catch (error: any) {
        const status = error?.response?.status
        if (status === 404) continue
        throw error
      }
    }

    throw new Error('List table transaction endpoint not found.')
  },
}

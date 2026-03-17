import apiClient from './client'
import { withPage } from './helper'
import type {
  CreatePendingTransactionRequest,
  ExportTransactionsReportRequest,
  PaginatedResponse,
  Transaction,
  TransactionListParams,
} from '@/types'

function extractDownloadUrl(payload: any): string | undefined {
  if (typeof payload === 'string') return payload
  if (typeof payload?.download_url === 'string') return payload.download_url
  if (typeof payload?.url === 'string') return payload.url
  if (typeof payload?.data?.download_url === 'string') return payload.data.download_url
  if (typeof payload?.data?.url === 'string') return payload.data.url
  return undefined
}

function normalizeTransaction(raw: any): Transaction {
  const beforeDiscount =
    raw.bill_price_before_discount_as_usd ?? raw.billPriceBeforeDiscountUsd
  const afterDiscount =
    raw.bill_price_after_discount_as_usd ?? raw.billPriceAfterDiscountUsd
  const discountAmount = raw.discount_amount_as_usd ?? raw.discountAmountUsd
  const promotionDiscountAsPercent =
    raw.promotion_discount_as_percent ?? raw.promotionDiscountAsPercent

  return {
    id: String(raw.id),
    status: raw.status ?? 'completed',
    invoiceId: String(raw.invoice_id ?? raw.invoiceId ?? ''),
    billPriceUsd: parseFloat(raw.bill_price_as_usd ?? raw.billPriceUsd ?? '0'),
    billPriceBeforeDiscountUsd:
      beforeDiscount == null ? undefined : parseFloat(String(beforeDiscount)),
    billPriceAfterDiscountUsd:
      afterDiscount == null ? undefined : parseFloat(String(afterDiscount)),
    discountAmountUsd:
      discountAmount == null ? undefined : parseFloat(String(discountAmount)),
    promotionDiscountAsPercent:
      promotionDiscountAsPercent == null
        ? undefined
        : parseFloat(String(promotionDiscountAsPercent)),
    employee: raw.employee ?? undefined,
    userId: raw.user_id == null ? undefined : String(raw.user_id),
    userName: raw.user_name ?? raw.userName ?? undefined,
    userPhone: raw.user_phone ?? raw.userPhone ?? undefined,
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

export const transactionsApi = {
  list: (params?: TransactionListParams) =>
    apiClient
      .get<any>('/admin/list_transaction', {
        params: withPage({
          ...params,
          status: params?.status,
          employee_id: params?.employee_id,
        }),
      })
      .then((r) => {
        const arr = Array.isArray(r.data) ? r.data : (r.data.data ?? [])
        return {
          data: arr.map(normalizeTransaction),
          total: parseInt(r.headers['x-paging-total-count'] ?? r.data.total ?? arr.length, 10),
          page: params?.page_number ?? r.data.page ?? 1,
          limit: params?.page_size ?? r.data.limit ?? arr.length,
          totalPages: r.data.totalPages ?? 1,
        } as PaginatedResponse<Transaction>
      }),

  get: (id: string) =>
    apiClient.get<any>(`/admin/transaction/${id}`).then((r) => normalizeTransaction(r.data)),

  createPending: (data: CreatePendingTransactionRequest) =>
    apiClient.post<any>('/order', data).then((r) => normalizeTransaction(r.data)),

  exportReport: async (data: ExportTransactionsReportRequest) => {
    const endpoints = ['/admin/export_transaction', '/export_transaction']

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.get<any>(endpoint, { params: data })
        const downloadUrl = extractDownloadUrl(response.data)
        if (downloadUrl) return downloadUrl
        throw new Error('Export succeeded but no download_url was returned.')
      } catch (error: any) {
        const status = error?.response?.status
        if (status === 404) continue
        throw error
      }
    }

    throw new Error('Transactions export endpoint not found.')
  },
}

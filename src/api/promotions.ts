import apiClient from './client'
import { withPage } from './helper'
import type {
  CreatePromotionRequest,
  PaginatedResponse,
  PaginationParams,
  PromotionDetail,
  Promotion,
  PromotionPreview,
  Transaction,
  UpdatePromotionRequest,
} from '@/types'

function normalizePromotion(raw: any): Promotion {
  return {
    id: String(raw.id),
    transactionCountToGetDiscount: Number(
      raw.transaction_count_to_get_discount ?? raw.transactionCountToGetDiscount ?? 0,
    ),
    discountAsPercent: Number(raw.discount_as_percent ?? raw.discountAsPercent ?? 0),
    status: raw.status ?? 'inactive',
    removedDatetime: raw.removed_datetime ?? raw.removedDatetime,
    createdAt: raw.inserted_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  }
}

function normalizePromotionPreview(raw: any): PromotionPreview {
  const promotion = raw?.promotion
  return {
    willHaveDiscountOnNextOrder: Boolean(
      raw?.will_have_discount_on_next_order ?? raw?.willHaveDiscountOnNextOrder,
    ),
    currentProgressCount: Number(raw?.current_progress_count ?? raw?.currentProgressCount ?? 0),
    requiredTransactionCount:
      raw?.required_transaction_count == null
        ? raw?.requiredTransactionCount == null
          ? undefined
          : Number(raw.requiredTransactionCount)
        : Number(raw.required_transaction_count),
    remainingOrdersBeforeDiscount:
      raw?.remaining_orders_before_discount == null
        ? raw?.remainingOrdersBeforeDiscount == null
          ? undefined
          : Number(raw.remainingOrdersBeforeDiscount)
        : Number(raw.remaining_orders_before_discount),
    promotion:
      promotion == null
        ? null
        : {
            id: String(promotion.id),
            transactionCountToGetDiscount: Number(
              promotion.transaction_count_to_get_discount ??
                promotion.transactionCountToGetDiscount ??
                0,
            ),
            discountAsPercent: Number(
              promotion.discount_as_percent ?? promotion.discountAsPercent ?? 0,
            ),
            status: promotion.status ?? 'inactive',
          },
  }
}

function normalizePromotionTransaction(raw: any): Transaction {
  return {
    id: String(raw.id),
    status: raw.status ?? 'completed',
    invoiceId: String(raw.invoice_id ?? raw.invoiceId ?? ''),
    billPriceUsd: parseFloat(raw.bill_price_as_usd ?? raw.billPriceUsd ?? '0'),
    billPriceBeforeDiscountUsd:
      raw.bill_price_before_discount_as_usd == null
        ? undefined
        : parseFloat(String(raw.bill_price_before_discount_as_usd)),
    billPriceAfterDiscountUsd:
      raw.bill_price_after_discount_as_usd == null
        ? undefined
        : parseFloat(String(raw.bill_price_after_discount_as_usd)),
    discountAmountUsd:
      raw.discount_amount_as_usd == null
        ? undefined
        : parseFloat(String(raw.discount_amount_as_usd)),
    promotionDiscountAsPercent:
      raw.discount_as_percent_applied == null
        ? undefined
        : parseFloat(String(raw.discount_as_percent_applied)),
    employee: raw.employee_name ?? raw.employee ?? undefined,
    userId: raw.user_id == null ? undefined : String(raw.user_id),
    userName: raw.user_name ?? raw.userName ?? undefined,
    tableNumber: raw.table_number ?? raw.tableNumber,
    productsOrders: Array.isArray(raw.products_orders)
      ? raw.products_orders.map((po: any) => ({
          productId: Number(po.product_id ?? 0),
          quantity: Number(po.quantity ?? 0),
          name: String(po.product_name ?? po.name ?? ''),
          sugarLevel: po.sugar_level,
          iceLevel: po.ice_level,
          orderNote: po.order_note ?? '',
        }))
      : undefined,
    createdAt: raw.inserted_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  }
}

function normalizePromotionDetail(raw: any): PromotionDetail {
  return {
    id: String(raw.id),
    transactionCountToGetDiscount: Number(
      raw.transaction_count_to_get_discount ?? raw.transactionCountToGetDiscount ?? 0,
    ),
    discountAsPercent: Number(raw.discount_as_percent ?? raw.discountAsPercent ?? 0),
    status: String(raw.status ?? 'inactive'),
    transactions: Array.isArray(raw.transactions)
      ? raw.transactions.map(normalizePromotionTransaction)
      : [],
  }
}

export const promotionsApi = {
  list: (params?: PaginationParams) =>
    apiClient
      .get<any>('/admin/promotions', { params: withPage(params) })
      .then((r) => {
        const arr = Array.isArray(r.data) ? r.data : (r.data.data ?? [])
        return {
          data: arr.map(normalizePromotion),
          total: parseInt(r.headers['x-paging-total-count'] ?? r.data.total ?? arr.length, 10),
          page: params?.page_number || r.data.page || 1,
          limit: params?.page_size || r.data.limit || arr.length,
          totalPages: r.data.totalPages ?? 1,
        } as PaginatedResponse<Promotion>
      }),

  create: (data: CreatePromotionRequest) =>
    apiClient.post<any>('/admin/promotions', data).then((r) => normalizePromotion(r.data)),

  update: (id: string, data: UpdatePromotionRequest) =>
    apiClient.patch<any>(`/admin/promotions/${id}`, data).then((r) => normalizePromotion(r.data)),

  get: async (id: string) => {
    const endpoints = [`/admin/promotions/${id}`, `/promotions/${id}`]

    for (const endpoint of endpoints) {
      try {
        const r = await apiClient.get<any>(endpoint)
        const payload = r.data?.data ?? r.data
        const normalized = normalizePromotionDetail(payload?.promotion ?? payload)
        return {
          ...normalized,
          transactions: Array.isArray(payload?.transactions)
            ? payload.transactions.map(normalizePromotionTransaction)
            : normalized.transactions,
        } as PromotionDetail
      } catch (error: any) {
        const status = error?.response?.status
        if (status === 404) continue
        throw error
      }
    }

    throw new Error('Promotion detail endpoint not found.')
  },

  // backend performs soft delete by setting removed_datetime
  remove: (id: string) =>
    apiClient.delete(`/admin/promotions/${id}`).then((r) => r.data),

  preview: (phoneNumber?: string | null) =>
    apiClient
      .get<any>('/promotion/preview', {
        params: {
          phone_number: phoneNumber?.trim() ? phoneNumber.trim() : undefined,
        },
      })
      .then((r) => normalizePromotionPreview(r.data)),
}

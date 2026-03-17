import apiClient from './client'
import { withPage } from './helper'
import type {
  CreatePromotionRequest,
  PaginatedResponse,
  PaginationParams,
  Promotion,
  PromotionPreview,
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

import apiClient from './client'
import type { Category, CreateCategoryRequest, PaginatedResponse, PaginationParams } from '@/types'
import { withPage } from './helper'

type CategoryListParams = PaginationParams & {
  isRemoved?: 'yes' | 'no' | null
  is_removed?: 'yes' | 'no' | null
}

function normalize(raw: any): Category {
  const nestedProducts = Array.isArray(raw.products) ? raw.products.length : undefined
  const fallbackCount = Number(
    raw.product_count ??
      raw.products_count ??
      raw.total_products ??
      raw.total_product_count ??
      0,
  )

  return {
    id: String(raw.id),
    name: raw.name,
    description: raw.description ?? '',
    imageUrl: raw.image_url || undefined,
    // Prefer nested products length when present because *_count fields can be stale.
    productCount: nestedProducts ?? fallbackCount,
    removedDatetime: raw.removed_datetime || raw.removedDatetime || undefined,
    createdAt: raw.inserted_at || undefined,
  }
}

export const categoriesApi = {
  list: (params?: CategoryListParams) =>
    apiClient
      .get<any>('/categories', {
        params: withPage({
          ...params,
          is_removed: params
            ? (Object.prototype.hasOwnProperty.call(params, 'is_removed')
                ? params.is_removed
                : params.isRemoved)
            : undefined,
        }),
      })
      .then(
        r => {
          const arr = Array.isArray(r.data) ? r.data : r.data.data ?? []
          return {
            data: arr.map(normalize),
            total: parseInt(r.headers['x-paging-total-count'] ?? arr.length, 10),
            page: params?.page_number || 1,
            limit: params?.page_size || arr.length,
            totalPages: r.data.totalPages ?? 1,
          } as PaginatedResponse<Category>
        }
      ),

  get: (id: string) =>
    apiClient.get<Category>(`/categories/${id}`).then((r) => r.data),

  create: (data: CreateCategoryRequest) =>
    apiClient.post<Category>('/admin/categories', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateCategoryRequest>) =>
    apiClient.patch<Category>(`/admin/categories/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/admin/categories/${id}`).then((r) => r.data),

  reinstate: (id: string) =>
    apiClient.patch(`/admin/categories/${id}/reinstate`).then((r) => r.data),
}

import apiClient from './client'
import { withPage } from './helper';
import type {
  CreateProductRequest,
  PaginatedResponse,
  PaginationParams,
  Product,
  UpdateProductRequest,
} from '@/types'

type ProductListParams = PaginationParams & {
  categoryId?: string
  category_id?: string
  product_category_id?: string
  isRemoved?: 'yes' | 'no' | null
  is_removed?: 'yes' | 'no' | null
}

// convert raw backend payload into UI-friendly Product
function normalize(raw: any): Product {
  const removedDatetime = raw.removed_datetime ?? raw.removedDatetime ?? undefined

  return {
    id: String(raw.id),
    name: raw.name,
    description: raw.description ?? '',
    price: parseFloat(raw.latest_price?.price_as_usd ?? '0'),
    imageUrl: raw.image_url || raw.imageUrl || undefined,
    categoryId: String(raw.categories?.id ?? raw.categoryId ?? ''),
    category: raw.categories
      ? {
          id: String(raw.categories.id),
          name: raw.categories.name,
          imageUrl: raw.categories.image_url || raw.categories.imageUrl || undefined,
          createdAt: raw.categories.inserted_at || raw.categories.createdAt,
          description: raw.categories.description ?? '',
        }
      : undefined,
    available: raw.available ?? !removedDatetime,
    removedDatetime,
    createdAt: raw.inserted_at || raw.createdAt,
  }
}


export const productsApi = {
  list: (params?: ProductListParams) =>
    apiClient
      .get<any>('/products', {
        params: withPage({
          ...params,
          category_id: params?.category_id ?? params?.categoryId,
          product_category_id: params?.product_category_id ?? params?.categoryId,
          is_removed: params ? (Object.prototype.hasOwnProperty.call(params, 'is_removed') ? params.is_removed : params.isRemoved) : undefined,
        }),
      })
      .then(r => { 
        // r.data might be an array (no pagination wrapper) or an object
        // with a `data` field; using <any> avoids "never" type errors.
        const arr = Array.isArray(r.data) ? r.data : r.data.data ?? []
        return {
          data: arr.map(normalize),
          total: parseInt(r.headers['x-paging-total-count'] ?? arr.length, 10),
          page: params?.page_number ?? r.data.page ?? 1,
          limit: params?.page_size ?? r.data.limit ?? arr.length,
          // totalPages is part of the PaginatedResponse type; not all
          // backends return it. if you don't have it you can compute it
          // (total/limit) or just leave it at 1 – nothing in the UI currently
          // reads this field unless you build a pager component.
          totalPages: r.data.totalPages ?? 1,
        } as PaginatedResponse<Product>
      }),

  get: (id: string) =>
    apiClient.get<any>(`/admin/products/${id}`).then((r) => normalize(r.data)),

  create: (data: CreateProductRequest) => {
    const formData = new FormData()
    formData.append('name', data.name)
    if (data.code) formData.append('code', data.code)
    formData.append('product_category_id', String(data.product_category_id))
    formData.append('price_as_usd', String(data.price_as_usd))
    if (data.product_image instanceof File && data.product_image.size > 0) {
      formData.append('product_image', data.product_image)
    }

    return apiClient
      .post<any>('/admin/products', formData)
      .then((r) => normalize(r.data))
  },

  update: (id: string, data: UpdateProductRequest) =>
    (() => {
      const payload: Record<string, string | number | boolean> = {}
      if (data.code !== undefined) payload.code = data.code
      if (data.name !== undefined) payload.name = data.name
      if (data.description !== undefined) payload.description = data.description
      if (data.price !== undefined) payload.price_as_usd = data.price
      if (data.categoryId !== undefined) payload.product_category_id = Number(data.categoryId)
      if (data.available !== undefined) payload.available = data.available

      if (data.product_image instanceof File && data.product_image.size > 0) {
        const formData = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
          formData.append(key, String(value))
        })
        formData.append('product_image', data.product_image)

        return apiClient
          .patch<any>(`/admin/products/${id}`, formData)
          .then((r) => normalize(r.data))
      }

      return apiClient
        .patch<any>(`/admin/products/${id}`, payload)
        .then((r) => normalize(r.data))
    })(),

  delete: (id: string) =>
    apiClient.delete(`/admin/products/${id}`).then((r) => r.data),
}

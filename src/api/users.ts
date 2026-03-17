import apiClient from './client'
import type {
  ExportUsersReportRequest,
  PaginatedResponse,
  PaginationParams,
  User,
} from '@/types'
import { withPage } from './helper'

function extractDownloadUrl(payload: any): string | undefined {
  if (typeof payload === 'string') return payload
  if (typeof payload?.download_url === 'string') return payload.download_url
  if (typeof payload?.url === 'string') return payload.url
  if (typeof payload?.data?.download_url === 'string') return payload.data.download_url
  if (typeof payload?.data?.url === 'string') return payload.data.url
  return undefined
}

function normalize(raw: any): User {
  return {
    id: String(raw.id),
    phone_number: raw.phone_number || raw.phone,
    name: raw.username,
    createdAt: raw.inserted_at || raw.createdAt,
    totalCompletedTransactions: Number(raw.total_completed_transactions ?? 0),
    totalRevenueGenerated: Number(raw.total_revenue_generated ?? 0),
  }
}

export const usersApi = {
  list: (params?: PaginationParams) =>
    apiClient
    .get<any>('/admin/list_user', { params: withPage(params) })
    .then(r => {
      const arr = Array.isArray(r.data) ? r.data : r.data.data ?? []
      return {
        data: arr.map(normalize),
        total: parseInt(r.headers['x-paging-total-count'] ?? arr.length, 10),
        page: params?.page_number || 1,
        limit: params?.page_size || arr.length,
        totalPages: r.data.totalPages ?? 1,
      } as PaginatedResponse<User>
    }),

  get: (id: string) =>
    apiClient.get<User>(`/admin/get_user/${id}`).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/admin/delete_user/${id}`).then((r) => r.data),

  exportReport: async (data: ExportUsersReportRequest) => {
    const endpoints = ['/admin/export_user', '/export_user']

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

    throw new Error('Users export endpoint not found.')
  },
}

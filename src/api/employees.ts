import apiClient from './client'
import { withPage } from './helper'
import type {
  CreateEmployeeRequest,
  Employee,
  PaginatedResponse,
  PaginationParams,
  UpdateEmployeeRequest,
} from '@/types'

function normalize(raw: any): Employee {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    phone: String(raw.phone ?? ''),
    removedDatetime: raw.removed_datetime ?? undefined,
    createdAt: raw.inserted_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  }
}

export const employeesApi = {
  list: (params?: PaginationParams) =>
    apiClient
      .get<any>('admin/employees', { params: withPage(params) })
      .then((r) => {
        const arr = Array.isArray(r.data) ? r.data : (r.data.data ?? [])
        return {
          data: arr.map(normalize),
          total: parseInt(r.headers['x-paging-total-count'] ?? r.data.total ?? arr.length, 10),
          page: params?.page_number || r.data.page || 1,
          limit: params?.page_size || r.data.limit || arr.length,
          totalPages: r.data.totalPages ?? 1,
        } as PaginatedResponse<Employee>
      }),

  get: (id: string) =>
    apiClient.get<any>(`admin/employees/${id}`).then((r) => normalize(r.data)),

  create: (data: CreateEmployeeRequest) =>
    apiClient.post<any>('admin/employees', data).then((r) => normalize(r.data)),

  update: (id: string, data: UpdateEmployeeRequest) =>
    apiClient.patch<any>(`admin/employees/${id}`, data).then((r) => normalize(r.data)),

  delete: (id: string) =>
    apiClient.delete(`admin/employees/${id}`).then((r) => r.data),
}

import apiClient from './client'
import { withPage } from './helper'
import type {
  CreateInventoryMovementRequest,
  CreateInventoryRequest,
  Inventory,
  InventoryMovement,
  InventoryMovementListParams,
  InventoryMovementsResponse,
  PaginatedResponse,
  PaginationParams,
  UpdateInventoryRequest,
} from '@/types'

function normalize(raw: any): Inventory {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    note: raw.note ?? undefined,
    imageUrl: raw.image_url ?? undefined,
    actualQuantity: Number(raw.actual_quantity ?? 0),
    removedDatetime: raw.removed_datetime ?? undefined,
    createdAt: raw.inserted_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  }
}

function normalizeMovement(raw: any): InventoryMovement {
  return {
    id: String(raw.id),
    inventoryId: String(raw.inventory_id),
    movementType: raw.movement_type as 'in' | 'out',
    quantity: Number(raw.quantity ?? 0),
    createdAt: raw.inserted_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  }
}

function buildInventoryFormData(data: CreateInventoryRequest | UpdateInventoryRequest): FormData | Record<string, any> {
  if (data.inventory_image instanceof File && data.inventory_image.size > 0) {
    const fd = new FormData()
    if (data.name) fd.append('name', data.name)
    if (data.note !== undefined) fd.append('note', data.note ?? '')
    fd.append('inventory_image', data.inventory_image)
    return fd
  }
  const payload: Record<string, any> = {}
  if ('name' in data && data.name !== undefined) payload.name = data.name
  if ('note' in data) payload.note = data.note ?? null
  return payload
}

export const inventoriesApi = {
  list: (params?: PaginationParams) =>
    apiClient
      .get<any>('admin/inventories', { params: withPage(params) })
      .then((r) => {
        const arr = Array.isArray(r.data) ? r.data : (r.data.data ?? [])
        return {
          data: arr.map(normalize),
          total: parseInt(r.headers['x-paging-total-count'] ?? r.data.total ?? arr.length, 10),
          page: params?.page_number ?? r.data.page ?? 1,
          limit: params?.page_size ?? r.data.limit ?? arr.length,
          totalPages: r.data.totalPages ?? 1,
        } as PaginatedResponse<Inventory>
      }),

  get: (id: string) =>
    apiClient.get<any>(`admin/inventories/${id}`).then((r) => normalize(r.data)),

  create: (data: CreateInventoryRequest) =>
    apiClient
      .post<any>('admin/inventories', buildInventoryFormData(data))
      .then((r) => normalize(r.data)),

  update: (id: string, data: UpdateInventoryRequest) =>
    apiClient
      .patch<any>(`admin/inventories/${id}`, buildInventoryFormData(data))
      .then((r) => normalize(r.data)),

  delete: (id: string) =>
    apiClient.delete(`admin/inventories/${id}`).then((r) => r.data),

  listMovements: (params: InventoryMovementListParams) => {
    const pageParams = withPage({
      page_size: params.page_size,
      page_number: params.page_number,
    })

    return apiClient
      .get<any>(`admin/inventories/${params.inventory_id}/movements`, {
        params: {
          page_size: pageParams.page_size,
          page_number: pageParams.page_number,
          cursor_id: params.cursor_id,
          movement_type: params.movement_type ?? undefined,
        },
      })
      .then((r): InventoryMovementsResponse => ({
        actualQuantity: Number(r.data.actual_quantity ?? 0),
        movements: Array.isArray(r.data.movements)
          ? r.data.movements.map(normalizeMovement)
          : [],
      }))
  },

  createMovement: (inventoryId: string, data: Omit<CreateInventoryMovementRequest, 'inventory_id'>) =>
    apiClient
      .post<any>(`admin/inventories/${inventoryId}/movements`, {
        inventory_id: Number(inventoryId),
        movement_type: data.movement_type,
        quantity: data.quantity,
      })
      .then((r) => ({
        movement: normalizeMovement(r.data),
        actualQuantity: Number(r.data.actual_quantity ?? 0),
      })),
}

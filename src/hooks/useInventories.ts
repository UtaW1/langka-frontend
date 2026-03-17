import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { inventoriesApi } from '@/api/inventories'
import type {
  CreateInventoryRequest,
  InventoryMovementListParams,
  MovementType,
  UpdateInventoryRequest,
} from '@/types'

export const INVENTORIES_KEY = 'inventories'
export const INVENTORY_MOVEMENTS_KEY = 'inventory_movements'

export function useInventories() {
  return useQuery({
    queryKey: [INVENTORIES_KEY],
    queryFn: () => inventoriesApi.list(),
  })
}

export function useInventoryMovements(
  inventoryId: string | null,
  params?: Partial<Omit<InventoryMovementListParams, 'inventory_id'>>,
) {
  return useQuery({
    queryKey: [INVENTORY_MOVEMENTS_KEY, inventoryId, params],
    queryFn: () =>
      inventoriesApi.listMovements({
        inventory_id: Number(inventoryId),
        page_size: params?.page_size ?? 20,
        page_number: params?.page_number,
        cursor_id: params?.cursor_id,
        movement_type: params?.movement_type as MovementType | undefined,
      }),
    enabled: !!inventoryId,
  })
}

export function useCreateInventory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateInventoryRequest) => inventoriesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INVENTORIES_KEY] })
      toast.success('Inventory item created.')
    },
    onError: () => toast.error('Failed to create inventory item.'),
  })
}

export function useUpdateInventory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryRequest }) =>
      inventoriesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INVENTORIES_KEY] })
      toast.success('Inventory item updated.')
    },
    onError: () => toast.error('Failed to update inventory item.'),
  })
}

export function useDeleteInventory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => inventoriesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INVENTORIES_KEY] })
      toast.success('Inventory item removed.')
    },
    onError: () => toast.error('Failed to remove inventory item.'),
  })
}

export function useCreateInventoryMovement(inventoryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { movement_type: MovementType; quantity: number }) =>
      inventoriesApi.createMovement(inventoryId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INVENTORIES_KEY] })
      qc.invalidateQueries({ queryKey: [INVENTORY_MOVEMENTS_KEY, inventoryId] })
      toast.success('Movement recorded.')
    },
    onError: () => toast.error('Failed to record movement.'),
  })
}

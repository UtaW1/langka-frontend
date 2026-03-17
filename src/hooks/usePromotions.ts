import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { promotionsApi } from '@/api/promotions'
import type { CreatePromotionRequest, PaginationParams, UpdatePromotionRequest } from '@/types'

export const PROMOTIONS_KEY = 'promotions'

export function usePromotions(params?: PaginationParams) {
  return useQuery({
    queryKey: [PROMOTIONS_KEY, params],
    queryFn: () => promotionsApi.list(params),
  })
}

export function usePromotion(id?: string) {
  return useQuery({
    queryKey: [PROMOTIONS_KEY, 'detail', id],
    queryFn: () => promotionsApi.get(id || ''),
    enabled: !!id,
  })
}

export function useCreatePromotion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePromotionRequest) => promotionsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PROMOTIONS_KEY] })
      toast.success('Promotion created.')
    },
    onError: () => toast.error('Failed to create promotion.'),
  })
}

export function useUpdatePromotion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePromotionRequest }) =>
      promotionsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PROMOTIONS_KEY] })
      toast.success('Promotion updated.')
    },
    onError: () => toast.error('Failed to update promotion.'),
  })
}

export function useRemovePromotion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => promotionsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PROMOTIONS_KEY] })
      toast.success('Promotion removed.')
    },
    onError: () => toast.error('Failed to remove promotion.'),
  })
}

export function usePromotionPreview() {
  return useMutation({
    mutationFn: (phoneNumber?: string | null) => promotionsApi.preview(phoneNumber),
    onError: () => toast.error('Failed to preview promotion eligibility.'),
  })
}

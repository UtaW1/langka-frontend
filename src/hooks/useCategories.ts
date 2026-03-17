import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { categoriesApi } from '@/api/categories'
import type { CreateCategoryRequest, PaginationParams } from '@/types'

export const CATEGORIES_KEY = 'categories'

export function useCategories(params?: PaginationParams) {
  return useQuery({
    queryKey: [CATEGORIES_KEY, params],
    queryFn: () => categoriesApi.list(params),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoriesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CATEGORIES_KEY] })
      toast.success('Category created.')
    },
    onError: () => toast.error('Failed to create category.'),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryRequest> }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CATEGORIES_KEY] })
      toast.success('Category updated.')
    },
    onError: () => toast.error('Failed to update category.'),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CATEGORIES_KEY] })
      toast.success('Category removed.')
    },
    onError: () => toast.error('Failed to remove category.'),
  })
}

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { productsApi } from '@/api/products'
import type { CreateProductRequest, PaginationParams, UpdateProductRequest } from '@/types'

export const PRODUCTS_KEY = 'products'

export function useProducts(params?: PaginationParams & { categoryId?: string }) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, params],
    queryFn: () => productsApi.list(params),
  })
}

const INFINITE_PAGE_SIZE = 20

export function useInfiniteProducts(params?: Omit<PaginationParams, 'page_number' | 'page_size'> & { categoryId?: string }) {
  return useInfiniteQuery({
    queryKey: [PRODUCTS_KEY, 'infinite', params],
    queryFn: ({ pageParam }) =>
      productsApi.list({ ...params, page_number: pageParam as number, page_size: INFINITE_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.data.length, 0)
      return loaded < lastPage.total ? allPages.length : undefined
    },
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, id],
    queryFn: () => productsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProductRequest) => productsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      toast.success('Product created.')
    },
    onError: () => toast.error('Failed to create product.'),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      toast.success('Product updated.')
    },
    onError: () => toast.error('Failed to update product.'),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      toast.success('Product removed.')
    },
    onError: () => toast.error('Failed to remove product.'),
  })
}

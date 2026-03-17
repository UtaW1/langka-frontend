import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { usersApi } from '@/api/users'
import type { ExportUsersReportRequest, PaginationParams } from '@/types'

export const USERS_KEY = 'users'

export function useUsers(params?: PaginationParams) {
  return useQuery({
    queryKey: [USERS_KEY, params],
    queryFn: () => usersApi.list(params),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] })
      toast.success('User removed.')
    },
    onError: () => toast.error('Failed to remove user.'),
  })
}

export function useExportUsersReport() {
  return useMutation({
    mutationFn: (payload: ExportUsersReportRequest) => usersApi.exportReport(payload),
  })
}

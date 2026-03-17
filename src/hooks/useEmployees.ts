import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { employeesApi } from '@/api/employees'
import type { CreateEmployeeRequest, UpdateEmployeeRequest } from '@/types'

export const EMPLOYEES_KEY = 'employees'

export function useEmployees() {
  return useQuery({
    queryKey: [EMPLOYEES_KEY],
    queryFn: () => employeesApi.list(),
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEmployeeRequest) => employeesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EMPLOYEES_KEY] })
      toast.success('Employee created.')
    },
    onError: () => toast.error('Failed to create employee.'),
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeRequest }) =>
      employeesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EMPLOYEES_KEY] })
      toast.success('Employee updated.')
    },
    onError: () => toast.error('Failed to update employee.'),
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EMPLOYEES_KEY] })
      toast.success('Employee removed.')
    },
    onError: () => toast.error('Failed to remove employee.'),
  })
}

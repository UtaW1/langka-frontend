import { useQuery } from '@tanstack/react-query'
import { metricsApi } from '@/api/metrics'
import type { PaginationParams } from '@/types'

export const PRODUCT_MONTHLY_METRICS_KEY = 'product_monthly_metrics'
export const TABLE_MONTHLY_METRICS_KEY = 'table_monthly_metrics'
export const EMPLOYEE_MONTHLY_METRICS_KEY = 'employee_monthly_metrics'
export const PROMOTION_USAGE_METRICS_KEY = 'promotion_usage_metrics'
export const PROMOTION_PROGRESSION_METRICS_KEY = 'promotion_progression_metrics'

type MetricsRangeParams = Pick<PaginationParams, 'start_datetime' | 'end_datetime'>

export function useProductMonthlyMetrics(params?: MetricsRangeParams) {
  return useQuery({
    queryKey: [PRODUCT_MONTHLY_METRICS_KEY, params],
    queryFn: () => metricsApi.listProductMonthly(params),
  })
}

export function useTableMonthlyMetrics(params?: MetricsRangeParams) {
  return useQuery({
    queryKey: [TABLE_MONTHLY_METRICS_KEY, params],
    queryFn: () => metricsApi.listTableMonthly(params),
  })
}

export function useEmployeeMonthlyMetrics(params?: MetricsRangeParams) {
  return useQuery({
    queryKey: [EMPLOYEE_MONTHLY_METRICS_KEY, params],
    queryFn: () => metricsApi.listEmployeeMonthly(params),
  })
}

export function usePromotionUsageMetrics(params?: MetricsRangeParams) {
  return useQuery({
    queryKey: [PROMOTION_USAGE_METRICS_KEY, params],
    queryFn: () => metricsApi.listPromotionUsage(params),
  })
}

export function usePromotionProgressionMetrics(params?: MetricsRangeParams) {
  return useQuery({
    queryKey: [PROMOTION_PROGRESSION_METRICS_KEY, params],
    queryFn: () => metricsApi.listPromotionProgression(params),
  })
}

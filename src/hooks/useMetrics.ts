import { useQuery } from '@tanstack/react-query'
import { metricsApi } from '@/api/metrics'

export const PRODUCT_MONTHLY_METRICS_KEY = 'product_monthly_metrics'
export const TABLE_MONTHLY_METRICS_KEY = 'table_monthly_metrics'
export const EMPLOYEE_MONTHLY_METRICS_KEY = 'employee_monthly_metrics'
export const PROMOTION_USAGE_METRICS_KEY = 'promotion_usage_metrics'
export const PROMOTION_PROGRESSION_METRICS_KEY = 'promotion_progression_metrics'

export function useProductMonthlyMetrics() {
  return useQuery({
    queryKey: [PRODUCT_MONTHLY_METRICS_KEY],
    queryFn: () => metricsApi.listProductMonthly(),
  })
}

export function useTableMonthlyMetrics() {
  return useQuery({
    queryKey: [TABLE_MONTHLY_METRICS_KEY],
    queryFn: () => metricsApi.listTableMonthly(),
  })
}

export function useEmployeeMonthlyMetrics() {
  return useQuery({
    queryKey: [EMPLOYEE_MONTHLY_METRICS_KEY],
    queryFn: () => metricsApi.listEmployeeMonthly(),
  })
}

export function usePromotionUsageMetrics() {
  return useQuery({
    queryKey: [PROMOTION_USAGE_METRICS_KEY],
    queryFn: () => metricsApi.listPromotionUsage(),
  })
}

export function usePromotionProgressionMetrics() {
  return useQuery({
    queryKey: [PROMOTION_PROGRESSION_METRICS_KEY],
    queryFn: () => metricsApi.listPromotionProgression(),
  })
}

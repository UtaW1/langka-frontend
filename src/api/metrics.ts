import apiClient from './client'
import type {
  EmployeeMonthlyMetric,
  ProductMonthlyMetric,
  PromotionProgressionMetric,
  PromotionUsageMetric,
  TableMonthlyMetric,
} from '@/types'

function normalizeProductMonthlyMetric(raw: any): ProductMonthlyMetric {
  return {
    productId: Number(raw.product_id ?? 0),
    productName: String(raw.product_name ?? ''),
    totalQuantity: Number(raw.total_quantity ?? 0),
  }
}

function normalizeTableMonthlyMetric(raw: any): TableMonthlyMetric {
  return {
    seatingTableId: Number(raw.seating_table_id ?? 0),
    tableNumber: String(raw.table_number ?? ''),
    usageCount: Number(raw.usage_count ?? 0),
  }
}

function normalizeEmployeeMonthlyMetric(raw: any): EmployeeMonthlyMetric {
  return {
    employeeId: String(raw.employee_id ?? ''),
    employeeName: String(raw.employee_name ?? ''),
    completedOrders: Number(raw.completed_orders ?? 0),
    cancelledOrders: Number(raw.cancelled_orders ?? 0),
  }
}

function normalizePromotionUsageMetric(raw: any): PromotionUsageMetric {
  return {
    promotionId: String(raw.promotion_id ?? ''),
    transactionCountToGetDiscount: Number(raw.transaction_count_to_get_discount ?? 0),
    discountAsPercent: Number(raw.discount_as_percent ?? 0),
    totalAppliedTransactions: Number(raw.total_applied_transactions ?? 0),
  }
}

function normalizePromotionProgressionMetric(raw: any): PromotionProgressionMetric {
  return {
    userId: String(raw.user_id ?? ''),
    userName: String(raw.username ?? ''),
    phoneNumber: String(raw.phone_number ?? ''),
    promotionId: String(raw.promotion_id ?? ''),
    discountAsPercent: Number(raw.discount_as_percent ?? 0),
    transactionCountToGetDiscount: Number(raw.transaction_count_to_get_discount ?? 0),
    currentProgressCount: Number(raw.current_progress_count ?? 0),
    remainingOrdersBeforeDiscount: Number(raw.remaining_orders_before_discount ?? 0),
    willHaveDiscountOnNextOrder: Boolean(raw.will_have_discount_on_next_order),
  }
}

export const metricsApi = {
  listProductMonthly: async () => {
    const endpoints = ['/admin/metrics/product_monthly', '/metrics/product_monthly']

    for (const endpoint of endpoints) {
      try {
        const r = await apiClient.get<any>(endpoint)
        const arr = Array.isArray(r.data) ? r.data : (r.data.data ?? [])
        return arr.map(normalizeProductMonthlyMetric)
      } catch (error: any) {
        const status = error?.response?.status
        if (status === 404) continue
        throw error
      }
    }

    throw new Error('Product monthly metrics endpoint not found.')
  },

  listTableMonthly: async () => {
    const endpoints = ['/admin/metrics/table_monthly', '/metrics/table_monthly']

    for (const endpoint of endpoints) {
      try {
        const r = await apiClient.get<any>(endpoint)
        const arr = Array.isArray(r.data) ? r.data : (r.data.data ?? [])
        return arr.map(normalizeTableMonthlyMetric)
      } catch (error: any) {
        const status = error?.response?.status
        if (status === 404) continue
        throw error
      }
    }

    throw new Error('Table monthly metrics endpoint not found.')
  },

  listEmployeeMonthly: async () => {
    const endpoints = ['/admin/metrics/employee_monthly', '/metrics/employee_monthly']

    for (const endpoint of endpoints) {
      try {
        const r = await apiClient.get<any>(endpoint)
        const arr = Array.isArray(r.data) ? r.data : (r.data.data ?? [])
        return arr.map(normalizeEmployeeMonthlyMetric)
      } catch (error: any) {
        const status = error?.response?.status
        if (status === 404) continue
        throw error
      }
    }

    throw new Error('Employee monthly metrics endpoint not found.')
  },

  listPromotionUsage: async () => {
    const endpoints = ['/admin/metrics/promotion_usage', '/metrics/promotion_usage']

    for (const endpoint of endpoints) {
      try {
        const r = await apiClient.get<any>(endpoint)
        const arr = Array.isArray(r.data) ? r.data : (r.data.data ?? [])
        return arr.map(normalizePromotionUsageMetric)
      } catch (error: any) {
        const status = error?.response?.status
        if (status === 404) continue
        throw error
      }
    }

    throw new Error('Promotion usage metrics endpoint not found.')
  },

  listPromotionProgression: async () => {
    const endpoints = ['/admin/metrics/promotion_progression', '/metrics/promotion_progression']

    for (const endpoint of endpoints) {
      try {
        const r = await apiClient.get<any>(endpoint)
        const arr = Array.isArray(r.data) ? r.data : (r.data.data ?? [])
        return arr.map(normalizePromotionProgressionMetric)
      } catch (error: any) {
        const status = error?.response?.status
        if (status === 404) continue
        throw error
      }
    }

    throw new Error('Promotion progression metrics endpoint not found.')
  },
}

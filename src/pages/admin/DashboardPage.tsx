import { useMemo, useState } from 'react'
import { Users, ShoppingBag, CreditCard, TrendingUp, UserCheck } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { useUsers } from '@/hooks/useUsers'
import { useEmployees } from '@/hooks/useEmployees'
import { useTransactions } from '@/hooks/useTransactions'
import { useProducts } from '@/hooks/useProducts'
import {
  useEmployeeMonthlyMetrics,
  useProductMonthlyMetrics,
  usePromotionProgressionMetrics,
  usePromotionUsageMetrics,
  useTableMonthlyMetrics,
} from '@/hooks/useMetrics'
import { formatPrice } from '@/utils'
import { Card } from '@/components/Card'
import { FilterSelect } from '@/components/FilterSelect'
import { getPresetDateRange, type DatePreset } from '@/utils/dateRange'
import type {
  EmployeeMonthlyMetric,
  ProductMonthlyMetric,
  PromotionProgressionMetric,
  PromotionUsageMetric,
  TableMonthlyMetric,
} from '@/types'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  iconBg: string
  iconColor: string
}

function StatCard({ icon, label, value, sub, iconBg, iconColor }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-stone-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-stone-800">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-stone-400">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

interface MetricBarChartItem {
  id: string
  label: string
  value: number
}

interface MetricBarChartProps {
  title: string
  subtitle: string
  valueLabel: string
  items: MetricBarChartItem[]
  loading?: boolean
  emptyMessage: string
  barClassName: string
}

function MetricBarChart({
  title,
  subtitle,
  valueLabel,
  items,
  loading = false,
  emptyMessage,
  barClassName,
}: MetricBarChartProps) {
  const [showAll, setShowAll] = useState(false)
  const maxValue = items.length ? Math.max(...items.map((item) => item.value)) : 0
  const visibleItems = showAll ? items : items.slice(0, 5)

  return (
    <Card>
      <div className="mb-4">
        <h2 className="font-serif text-lg font-semibold text-stone-800">{title}</h2>
        <p className="mt-0.5 text-xs text-stone-500">{subtitle}</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-stone-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-400">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const width = maxValue > 0 ? Math.max((item.value / maxValue) * 100, 6) : 6

            return (
              <div key={item.id}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-stone-700">{item.label}</p>
                  <p className="text-xs font-semibold text-stone-500">
                    {item.value.toLocaleString()} {valueLabel}
                  </p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className={`h-full rounded-full ${barClassName}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            )
          })}

          {items.length > 5 && (
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="text-xs font-medium text-coffee-700 hover:text-coffee-800 hover:underline"
              >
                {showAll ? 'View less' : 'View all'}
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function EmployeeMonthlyMetricCard({
  items,
  loading,
}: {
  items: EmployeeMonthlyMetric[]
  loading?: boolean
}) {
  const [showAll, setShowAll] = useState(false)
  const visibleItems = showAll ? items : items.slice(0, 5)
  const maxTotal =
    items.length > 0
      ? Math.max(...items.map((item) => item.completedOrders + item.cancelledOrders))
      : 0

  return (
    <Card>
      <div className="mb-4">
        <h2 className="font-serif text-lg font-semibold text-stone-800">Employee Performance</h2>
        <p className="mt-0.5 text-xs text-stone-500">Current month completed vs cancelled orders</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-stone-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-400">No employee metrics available for this month.</p>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const total = item.completedOrders + item.cancelledOrders
            const totalWidth = maxTotal > 0 ? Math.max((total / maxTotal) * 100, 8) : 8
            const completedRatio = total > 0 ? (item.completedOrders / total) * 100 : 0
            const cancelledRatio = total > 0 ? (item.cancelledOrders / total) * 100 : 0

            return (
              <div key={item.employeeId}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-stone-700">{item.employeeName || 'Unknown employee'}</p>
                  <p className="text-xs font-semibold text-stone-500">{total.toLocaleString()} orders</p>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-stone-100" style={{ width: `${totalWidth}%` }}>
                  <div className="flex h-full w-full">
                    <div className="h-full bg-green-500" style={{ width: `${completedRatio}%` }} />
                    <div className="h-full bg-red-400" style={{ width: `${cancelledRatio}%` }} />
                  </div>
                </div>

                <div className="mt-1 flex gap-3 text-[11px] text-stone-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {item.completedOrders} completed
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    {item.cancelledOrders} cancelled
                  </span>
                </div>
              </div>
            )
          })}

          {items.length > 5 && (
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="text-xs font-medium text-coffee-700 hover:text-coffee-800 hover:underline"
              >
                {showAll ? 'View less' : 'View all'}
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function PromotionProgressionCard({
  items,
  loading,
}: {
  items: PromotionProgressionMetric[]
  loading?: boolean
}) {
  const [showAll, setShowAll] = useState(false)
  const visibleItems = showAll ? items : items.slice(0, 5)

  return (
    <Card>
      <div className="mb-4">
        <h2 className="font-serif text-lg font-semibold text-stone-800">Promotion Progress</h2>
        <p className="mt-0.5 text-xs text-stone-500">Users close to earning promotion discounts</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-stone-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-400">No promotion progression metrics yet.</p>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const target = Math.max(item.transactionCountToGetDiscount, 1)
            const progress = Math.min((item.currentProgressCount / target) * 100, 100)

            return (
              <div key={`${item.userId}-${item.promotionId}`} className="rounded-xl bg-stone-50 p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-stone-800">{item.userName || 'Unknown user'}</p>
                  <span className="text-[11px] text-stone-500">{item.discountAsPercent}% promo</span>
                </div>
                <p className="mb-2 text-xs text-stone-500">{item.phoneNumber || 'No phone'}</p>

                <div className="h-2.5 overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400"
                    style={{ width: `${Math.max(progress, 6)}%` }}
                  />
                </div>

                <p className="mt-1 text-[11px] text-stone-600">
                  {item.currentProgressCount}/{target} completed
                  {item.willHaveDiscountOnNextOrder
                    ? ' • Discount ready now'
                    : ` • ${item.remainingOrdersBeforeDiscount} more to unlock`}
                </p>
              </div>
            )
          })}

          {items.length > 5 && (
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="text-xs font-medium text-coffee-700 hover:text-coffee-800 hover:underline"
              >
                {showAll ? 'View less' : 'View all'}
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export function DashboardPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>('today')

  const overviewRange = useMemo(() => getPresetDateRange(datePreset), [datePreset])
  const periodLabel =
    datePreset === 'today'
      ? 'Today'
      : datePreset === 'weekly'
      ? 'Weekly'
      : datePreset === 'monthly'
      ? 'Monthly'
      : 'Yearly'

  const { data: ordersData } = useOrders({ limit: 1, ...overviewRange })
  const { data: usersData } = useUsers({ limit: 1, ...overviewRange })
  const { data: employeesData } = useEmployees(overviewRange)
  const { data: txData } = useTransactions({ limit: 1000, ...overviewRange })
  const { data: productsData } = useProducts({ limit: 1, ...overviewRange })
  const { data: productMetrics, isLoading: isProductMetricsLoading } = useProductMonthlyMetrics(overviewRange)
  const { data: tableMetrics, isLoading: isTableMetricsLoading } = useTableMonthlyMetrics(overviewRange)
  const { data: employeeMetrics, isLoading: isEmployeeMetricsLoading } = useEmployeeMonthlyMetrics(overviewRange)
  const { data: promotionUsageMetrics, isLoading: isPromotionUsageMetricsLoading } =
    usePromotionUsageMetrics(overviewRange)
  const {
    data: promotionProgressionMetrics,
    isLoading: isPromotionProgressionMetricsLoading,
  } = usePromotionProgressionMetrics(overviewRange)

  const totalRevenue = txData?.data?.reduce((sum, tx) => sum + tx.billPriceUsd, 0) ?? 0
  const recentOrders = ordersData?.total ?? 0
  const totalUsers = usersData?.total ?? 0
  const totalActiveEmployees =
    employeesData?.data?.filter((employee) => !employee.removedDatetime).length ?? 0
  const totalProducts = productsData?.total ?? 0

  const stats = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: 'Total Revenue',
      value: formatPrice(totalRevenue),
      sub: `${periodLabel} window`,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      icon: <ShoppingBag className="h-5 w-5" />,
      label: 'Total Orders',
      value: recentOrders,
      sub: `${periodLabel} window`,
      iconBg: 'bg-coffee-50',
      iconColor: 'text-coffee-700',
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Total Users',
      value: totalUsers,
      sub: `${periodLabel} window`,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: <UserCheck className="h-5 w-5" />,
      label: 'Active Employees',
      value: totalActiveEmployees,
      sub: `${periodLabel} window`,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: 'Products',
      value: totalProducts,
      sub: `${periodLabel} window`,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ]

  const productChartItems: MetricBarChartItem[] = (productMetrics ?? [])
    .slice()
    .sort((a: ProductMonthlyMetric, b: ProductMonthlyMetric) => b.totalQuantity - a.totalQuantity)
    .map((metric: ProductMonthlyMetric) => ({
      id: String(metric.productId),
      label: metric.productName,
      value: metric.totalQuantity,
    }))

  const tableChartItems: MetricBarChartItem[] = (tableMetrics ?? [])
    .slice()
    .sort((a: TableMonthlyMetric, b: TableMonthlyMetric) => b.usageCount - a.usageCount)
    .map((metric: TableMonthlyMetric) => ({
      id: String(metric.seatingTableId),
      label: metric.tableNumber,
      value: metric.usageCount,
    }))

  const promotionUsageChartItems: MetricBarChartItem[] = (promotionUsageMetrics ?? [])
    .slice()
    .sort((a: PromotionUsageMetric, b: PromotionUsageMetric) => b.totalAppliedTransactions - a.totalAppliedTransactions)
    .map((metric: PromotionUsageMetric) => ({
      id: metric.promotionId,
      label: `${metric.discountAsPercent}% off at ${metric.transactionCountToGetDiscount} orders`,
      value: metric.totalAppliedTransactions,
    }))

  const promotionProgressionItems: PromotionProgressionMetric[] = (promotionProgressionMetrics ?? [])
    .slice()
    .sort((a: PromotionProgressionMetric, b: PromotionProgressionMetric) => {
      if (a.willHaveDiscountOnNextOrder && !b.willHaveDiscountOnNextOrder) return -1
      if (!a.willHaveDiscountOnNextOrder && b.willHaveDiscountOnNextOrder) return 1
      return a.remainingOrdersBeforeDiscount - b.remainingOrdersBeforeDiscount
    })

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-stone-800">Overview</h1>
          <p className="mt-1 text-sm text-stone-400">Window: {periodLabel}</p>
        </div>

        <div className="w-full max-w-xs">
          <FilterSelect
            label="Filter Overview By"
            value={datePreset}
            onChange={(next) => setDatePreset(next as DatePreset)}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-7 grid gap-4 lg:grid-cols-3">
        <MetricBarChart
          title="Most Bought Products"
          subtitle={`${periodLabel} ranking`}
          valueLabel="orders"
          items={productChartItems}
          loading={isProductMetricsLoading}
          emptyMessage={`No product metrics available for this ${periodLabel.toLowerCase()} window.`}
          barClassName="bg-gradient-to-r from-coffee-500 to-amber-400"
        />

        <MetricBarChart
          title="Most Used Tables"
          subtitle={`${periodLabel} ranking`}
          valueLabel="uses"
          items={tableChartItems}
          loading={isTableMetricsLoading}
          emptyMessage={`No table metrics available for this ${periodLabel.toLowerCase()} window.`}
          barClassName="bg-gradient-to-r from-blue-500 to-cyan-400"
        />

        <EmployeeMonthlyMetricCard
          items={employeeMetrics ?? []}
          loading={isEmployeeMetricsLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <MetricBarChart
          title="Promotion Usage"
          subtitle="How often each promotion is applied"
          valueLabel="applied"
          items={promotionUsageChartItems}
          loading={isPromotionUsageMetricsLoading}
          emptyMessage="No promotion usage metrics available yet."
          barClassName="bg-gradient-to-r from-emerald-500 to-teal-400"
        />

        <PromotionProgressionCard
          items={promotionProgressionItems}
          loading={isPromotionProgressionMetricsLoading}
        />
      </div>
    </div>
  )
}

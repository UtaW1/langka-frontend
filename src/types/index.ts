// ─── User & Auth ────────────────────────────────────────────────────────────

export interface User {
  id: string
  phone_number: string
  name?: string
  role?: 'admin' | 'customer'
  totalCompletedTransactions?: number
  totalRevenueGenerated?: number
  createdAt: string
}

export type UserRole = 'admin' | 'customer'

export interface Employee {
  id: string
  name: string
  phone: string
  removedDatetime?: string
  createdAt: string
  updatedAt?: string
}

export interface CreateEmployeeRequest {
  name: string
  phone: string
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

export interface RegisterRequest {
  phone_number: string
  password: string
  name?: string
}

export interface LoginRequest {
  phone_number: string
  password: string
}

export interface AuthSessionResponse {
  access_token: string
  user_id: string | number
  role: UserRole
}

export interface RefreshRequest {
  csrf_token: string
}

// ─── Category ───────────────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  description: string
  imageUrl?: string
  productCount?: number
  createdAt: string
}

export interface CreateCategoryRequest {
  name: string
  description: string
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface Product {
  code?: string
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  categoryId: string
  category?: Category
  available: boolean
  removedDatetime?: string
  createdAt: string
}

export interface CreateProductRequest {
  name: string
  code?: string
  product_category_id: number
  price_as_usd: number
  product_image?: File
}

export interface UpdateProductRequest {
  code?: string
  name?: string
  description?: string
  price?: number
  imageUrl?: string
  categoryId?: string
  available?: boolean
  product_image?: File
}

// ─── Seating Table ───────────────────────────────────────────────────────────

export interface SeatingTable {
  id: string
  tableNumber: string
  seatingCount: number
  createdAt: string
  updatedAt?: string
}

export interface CreateSeatingTableRequest {
  table_number: string
  seating_count?: number
}

export interface UpdateSeatingTableRequest extends Partial<CreateSeatingTableRequest> {}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product
  quantity: number
  sugarLevel: SugarLevel
  iceLevel: IceLevel
  orderNote: string
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export type TransactionStatus = 'pending' | 'paid' | 'cancelled' | 'refunded' | 'failed' | 'completed'

export type IceLevel = 'no ice' | 'less ice' | 'normal ice'
export type SugarLevel = 0 | 25 | 50 | 75 | 100 | 125

export const ALLOWED_SUGAR_LEVELS: SugarLevel[] = [0, 25, 50, 75, 100, 125]
export const ALLOWED_ICE_LEVELS: IceLevel[] = ['no ice', 'less ice', 'normal ice']

export interface TransactionOrderItem {
  id?: number
  productId: number
  quantity: number
  name: string
  sugarLevel?: SugarLevel
  iceLevel?: IceLevel
  orderNote?: string
}

export interface Transaction {
  id: string
  status: TransactionStatus
  invoiceId: string
  billPriceUsd: number
  billPriceBeforeDiscountUsd?: number
  billPriceAfterDiscountUsd?: number
  discountAmountUsd?: number
  promotionDiscountAsPercent?: number
  employee?: string
  userId?: string
  userName?: string
  userPhone?: string
  tableNumber?: string
  promotionApplyId?: string
  productsOrders?: TransactionOrderItem[]
  createdAt: string
  updatedAt?: string
}

export interface TransactionListParams extends PaginationParams {
  status?: 'pending' | 'completed' | 'cancelled'
  employee_id?: string
}

export interface SeatingTableTransactions extends SeatingTable {
  transactions: Transaction[]
}

export interface CreatePendingTransactionRequest {
  name: string
  phone_number: string
  invoice_id?: string | null
  products_orders: {
    product_id: number
    quantity: number
    sugar_level?: SugarLevel | null
    ice_level?: IceLevel | null
    order_note?: string | null
  }[]
  seating_table_id: number
}

export interface ExportTransactionsReportRequest {
  start_datetime: string
  end_datetime: string
}

export interface ExportUsersReportRequest {
  start_datetime: string
  end_datetime: string
}

export interface ProductMonthlyMetric {
  productId: number
  productName: string
  totalQuantity: number
}

export interface TableMonthlyMetric {
  seatingTableId: number
  tableNumber: string
  usageCount: number
}

export interface EmployeeMonthlyMetric {
  employeeId: string
  employeeName: string
  completedOrders: number
  cancelledOrders: number
}

export interface PromotionUsageMetric {
  promotionId: string
  transactionCountToGetDiscount: number
  discountAsPercent: number
  totalAppliedTransactions: number
  status?: string
}

export interface PromotionProgressionMetric {
  userId: string
  userName: string
  phoneNumber: string
  promotionId: string
  discountAsPercent: number
  transactionCountToGetDiscount: number
  currentProgressCount: number
  remainingOrdersBeforeDiscount: number
  willHaveDiscountOnNextOrder: boolean
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export interface Inventory {
  id: string
  name: string
  note?: string
  imageUrl?: string
  actualQuantity: number
  removedDatetime?: string
  createdAt: string
  updatedAt?: string
}

export interface CreateInventoryRequest {
  name: string
  note?: string | null
  inventory_image?: File
}

export interface UpdateInventoryRequest {
  name?: string
  note?: string | null
  inventory_image?: File
}

export type MovementType = 'in' | 'out'

export interface InventoryMovement {
  id: string
  inventoryId: string
  movementType: MovementType
  quantity: number
  createdAt: string
  updatedAt?: string
}

export interface CreateInventoryMovementRequest {
  inventory_id: number
  movement_type: MovementType
  quantity: number
}

export interface InventoryMovementListParams {
  inventory_id: number
  page_size: number
  page_number?: number
  cursor_id?: number
  movement_type?: MovementType | null
}

export interface InventoryMovementsResponse {
  actualQuantity: number
  movements: InventoryMovement[]
}

// ─── Promotion ───────────────────────────────────────────────────────────────

export interface Promotion {
  id: string
  transactionCountToGetDiscount: number
  discountAsPercent: number
  status: 'active' | 'inactive'
  removedDatetime?: string
  createdAt: string
  updatedAt?: string
}

export interface CreatePromotionRequest {
  transaction_count_to_get_discount: number
  discount_as_percent: number
  status?: 'active' | 'inactive'
}

export interface UpdatePromotionRequest extends Partial<CreatePromotionRequest> {}

export interface PromotionDetail {
  id: string
  transactionCountToGetDiscount: number
  discountAsPercent: number
  status: string
  transactions: Transaction[]
}

export interface PromotionPreviewPromotion {
  id: string
  transactionCountToGetDiscount: number
  discountAsPercent: number
  status: 'active' | 'inactive'
}

export interface PromotionPreview {
  willHaveDiscountOnNextOrder: boolean
  currentProgressCount: number
  requiredTransactionCount?: number
  remainingOrdersBeforeDiscount?: number
  promotion?: PromotionPreviewPromotion | null
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

export interface PaginationParams {
  page_size?: number
  page_number?: number
  limit?: number
  search?: string
  start_datetime?: string
  end_datetime?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

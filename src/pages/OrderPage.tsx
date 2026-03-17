import { useEffect, useMemo, useState } from 'react'
import { ShoppingCart, CheckCircle2, Clock3, UserCheck, XCircle, Loader2, Search } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useCreateOrder } from '@/hooks/useOrders'
import { useOrderStream } from '@/hooks/useOrderStream'
import { usePromotionPreview } from '@/hooks/usePromotions'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { OrderItem } from '@/components/OrderItem'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { formatDate, formatPrice } from '@/utils'
import { Link, useSearchParams } from 'react-router-dom'
import type { PromotionPreview, Transaction } from '@/types'
import toast from 'react-hot-toast'

const ACTIVE_TRANSACTION_STORAGE_KEY = 'active-transaction'
const UUID_REGEX = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi

function sanitizeEventMessage(message?: string | null): string | null {
  if (!message) return null

  const cleaned = message
    .replace(/\border\s+[0-9a-f-]{36}\b/gi, 'order')
    .replace(/\btransaction\s+[0-9a-f-]{36}\b/gi, 'transaction')
    .replace(UUID_REGEX, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return cleaned || null
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function OrderPage() {
  const [customerName, setCustomerName] = useState('')
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState('')
  const [isIdentityConfirmed, setIsIdentityConfirmed] = useState(false)
  const [promotionPreview, setPromotionPreview] = useState<PromotionPreview | null>(null)
  const [seatingTableIdInput, setSeatingTableIdInput] = useState('')
  const [placedTransaction, setPlacedTransaction] = useState<Transaction | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [menuSearch, setMenuSearch] = useState('')
  const [searchParams] = useSearchParams()
  const { items, clearCart, total, itemCount } = useCartStore()
  const createOrder = useCreateOrder()
  const previewPromotion = usePromotionPreview()
  const orderStream = useOrderStream(placedTransaction?.id ?? null)

  const qrSeatingTableId = useMemo(() => {
    const raw = searchParams.get('seating_table_id')
    const parsed = Number(raw)
    if (!raw || !Number.isInteger(parsed) || parsed <= 0) return null
    return parsed
  }, [searchParams])

  const isQrOrderMode = qrSeatingTableId != null

  const { data: categoriesData } = useCategories()
  const categories = categoriesData?.data ?? []
  const { data: orderProductsData, isLoading: isOrderProductsLoading } = useProducts({
    categoryId: activeCategory ?? undefined,
    search: menuSearch.trim() || undefined,
  })
  const orderProducts = orderProductsData?.data ?? []

  useEffect(() => {
    if (typeof window === 'undefined') return

    // QR flow should always start fresh so old tracker state is not shown.
    if (isQrOrderMode) {
      setPlacedTransaction(null)
      window.localStorage.removeItem(ACTIVE_TRANSACTION_STORAGE_KEY)
      return
    }

    const raw = window.localStorage.getItem(ACTIVE_TRANSACTION_STORAGE_KEY)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as Transaction
      if (parsed?.id) {
        setPlacedTransaction(parsed)
      }
    } catch {
      window.localStorage.removeItem(ACTIVE_TRANSACTION_STORAGE_KEY)
    }
  }, [isQrOrderMode])

  useEffect(() => {
    if (qrSeatingTableId != null) {
      setSeatingTableIdInput(String(qrSeatingTableId))
    }
  }, [qrSeatingTableId])

  async function handleContinueWithIdentity() {
    const trimmedName = customerName.trim()
    const trimmedPhoneNumber = customerPhoneNumber.trim()
    if (!trimmedName || !trimmedPhoneNumber) {
      toast.error('Name and phone number are required before ordering.')
      return
    }

    try {
      const preview = await previewPromotion.mutateAsync(trimmedPhoneNumber)
      setPromotionPreview(preview)
      setIsIdentityConfirmed(true)
    } catch {
      setPromotionPreview(null)
      setIsIdentityConfirmed(true)
    }
  }

  async function handlePlaceOrder() {
    const trimmedName = customerName.trim()
    const trimmedPhoneNumber = customerPhoneNumber.trim()
    const seatingTableId = Number(seatingTableIdInput)
    if (!trimmedName || !trimmedPhoneNumber) {
      toast.error('Name and phone number are required before placing an order.')
      return
    }
    if (!items.length || !Number.isInteger(seatingTableId) || seatingTableId <= 0) return

    const result = await createOrder.mutateAsync({
      name: trimmedName,
      phone_number: trimmedPhoneNumber,
      invoice_id: null,
      products_orders: items.map((i) => ({
        product_id: Number(i.product.id),
        quantity: i.quantity,
        sugar_level: i.sugarLevel ?? null,
        ice_level: i.iceLevel ?? null,
        order_note: i.orderNote?.trim() ? i.orderNote : null,
      })),
      seating_table_id: seatingTableId,
    })

    setPlacedTransaction({
      ...result,
      tableNumber: result.tableNumber || `#${seatingTableId}`,
      productsOrders: result.productsOrders ?? [],
    })

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        ACTIVE_TRANSACTION_STORAGE_KEY,
        JSON.stringify({
          ...result,
          tableNumber: result.tableNumber || `#${seatingTableId}`,
          productsOrders: result.productsOrders ?? [],
        }),
      )
    }

    clearCart()
    if (!isQrOrderMode) {
      setSeatingTableIdInput('')
    }
  }

  // ── Post-order: show live tracker ────────────────────────────────────────
  if (placedTransaction) {
    const hasQueued =
      orderStream.events.some((e) => e.type === 'queued') ||
      orderStream.events.some((e) => e.type === 'assigned') ||
      orderStream.events.some((e) => e.type === 'completed') ||
      orderStream.events.some((e) => e.type === 'cancelled')
    const hasAssigned =
      orderStream.events.some((e) => e.type === 'assigned') ||
      orderStream.events.some((e) => e.type === 'completed') ||
      orderStream.events.some((e) => e.type === 'cancelled')
    const isCompleted = orderStream.currentType === 'completed'
    const isCancelled = orderStream.currentType === 'cancelled'
    const isTerminal = isCompleted || isCancelled

    const statusLabel =
      (orderStream.status ?? placedTransaction.status ?? 'pending').toString().toLowerCase()

    const friendlyEmployee = orderStream.assignedEmployeeName?.trim() || 'our team'
    const liveMessage = isCompleted
      ? `Your order is completed by ${friendlyEmployee}. Please do not forget to pay the amount before you leave.`
      : isCancelled
      ? `Your order was cancelled by ${friendlyEmployee}. Please check with our staff if you need help.`
      : sanitizeEventMessage(orderStream.message)

    const timeline = [...orderStream.events].reverse()

    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col bg-cream-50 px-4 py-10 md:items-center">
        <div className="w-full max-w-md">
          <h1 className="mb-1 font-serif text-2xl font-semibold text-stone-800">
            Order received!
          </h1>
          <p className="mb-8 text-sm text-stone-400">
            Follow your order progress in real time.
          </p>

          <div className="mb-4 flex items-center justify-between rounded-xl border border-stone-100 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              {orderStream.connected ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-green-700">Live updates connected</span>
                </>
              ) : orderStream.error && !isTerminal ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-xs font-medium text-red-600">Connection lost</span>
                </>
              ) : (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                  <span className="text-xs font-medium text-stone-500">Waiting for updates</span>
                </>
              )}
            </div>
            <span
              className={[
                'rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
                isCompleted
                  ? 'bg-green-50 text-green-700'
                  : isCancelled
                  ? 'bg-red-50 text-red-600'
                  : 'bg-amber-50 text-amber-700',
              ].join(' ')}
            >
              {statusLabel}
            </span>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Order successfully submitted</span>
            </div>

            <div className="grid gap-2 rounded-xl bg-stone-50 p-3">
              <div className="flex items-center gap-2 text-sm text-stone-700">
                {hasQueued ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Loader2 className="h-4 w-4 animate-spin text-stone-400" />}
                <span>Published to cafe channel</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-700">
                {hasAssigned ? <UserCheck className="h-4 w-4 text-blue-600" /> : <Clock3 className="h-4 w-4 text-stone-400" />}
                <span>
                  {hasAssigned
                    ? `Assigned to ${orderStream.assignedEmployeeName ?? 'an employee'}`
                    : 'Waiting for employee assignment'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-700">
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : isCancelled ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <Clock3 className="h-4 w-4 text-stone-400" />
                )}
                <span>
                  {isCompleted ? 'Order completed' : isCancelled ? 'Order cancelled' : 'Order in progress'}
                </span>
              </div>
            </div>

            {liveMessage && (
              <div className="rounded-xl border border-coffee-100 bg-coffee-50 px-3 py-2.5 text-sm text-coffee-800">
                {liveMessage}
              </div>
            )}

            <div className="space-y-2 text-sm text-stone-600">
              <p>
                Table: <span className="font-medium">{placedTransaction.tableNumber}</span>
              </p>
              {placedTransaction.promotionApplyId && (
                <p>
                  Promotion Applied ID:{' '}
                  <span className="font-mono break-all">{placedTransaction.promotionApplyId}</span>
                </p>
              )}
              <p>
                Total: <span className="font-semibold">{formatPrice(placedTransaction.billPriceUsd || total())}</span>
              </p>
              {placedTransaction.productsOrders && placedTransaction.productsOrders.length > 0 && (
                <div className="rounded-lg bg-stone-50 px-3 py-2">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Items</p>
                  <div className="space-y-2">
                    {placedTransaction.productsOrders.map((po, index) => (
                      <div key={`${po.productId}-${index}`} className="rounded-md bg-white px-2.5 py-2">
                        <p className="text-sm text-stone-700">
                          {po.name || `Product ${po.productId}`} x {po.quantity}
                        </p>
                        <p className="mt-0.5 text-xs text-stone-500">
                          Sugar: {po.sugarLevel ?? '—'}{po.sugarLevel != null ? '%' : ''} • Ice: {po.iceLevel ?? '—'}
                        </p>
                        <p className="mt-0.5 text-xs text-stone-500">
                          Note: {po.orderNote?.trim() ? po.orderNote : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Live Timeline</p>
              {timeline.length === 0 ? (
                <p className="text-xs text-stone-400">No updates yet. This panel will populate as staff process your order.</p>
              ) : (
                <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                  {timeline.map((event, index) => (
                    <div key={`${event.type}-${event.timestamp}-${index}`} className="rounded-lg bg-white px-2.5 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase text-stone-500">{event.type}</span>
                        <span className="text-[11px] text-stone-400">{formatDate(event.timestamp)}</span>
                      </div>
                      <p className="mt-1 break-words text-xs text-stone-600">
                        {event.type === 'completed'
                          ? `Order completed by ${event.employeeName ?? friendlyEmployee}. Please do not forget to pay the amount before you leave.`
                          : event.type === 'cancelled'
                          ? `Order cancelled by ${event.employeeName ?? friendlyEmployee}.`
                          : sanitizeEventMessage(event.message) ?? 'Status updated.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setPlacedTransaction(null)
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem(ACTIVE_TRANSACTION_STORAGE_KEY)
              }
            }}
            className="mt-6 w-full text-center text-sm text-stone-400 hover:text-stone-600"
          >
            {isTerminal ? 'Place another order' : 'Start a new order'}
          </button>
        </div>
      </div>
    )
  }

  // ── Cart view ─────────────────────────────────────────────────────────────
  const promotionPreviewBanner = promotionPreview && (
    <div
      className={[
        'mb-4 rounded-xl border px-3 py-2.5 text-sm',
        promotionPreview.willHaveDiscountOnNextOrder
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-amber-200 bg-amber-50 text-amber-800',
      ].join(' ')}
    >
      {promotionPreview.willHaveDiscountOnNextOrder ? (
        <p>
          Discount available on this order
          {promotionPreview.promotion?.discountAsPercent
            ? `: ${promotionPreview.promotion.discountAsPercent}% off.`
            : '.'}
        </p>
      ) : (
        <p>
          {promotionPreview.requiredTransactionCount
            ? `${promotionPreview.currentProgressCount}/${promotionPreview.requiredTransactionCount} orders completed.`
            : `Progress: ${promotionPreview.currentProgressCount} completed orders.`}{' '}
          {promotionPreview.remainingOrdersBeforeDiscount != null
            ? `${promotionPreview.remainingOrdersBeforeDiscount} more before discount unlocks.`
            : ''}
        </p>
      )}
    </div>
  )

  const identityStep = (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-coffee-600">Before ordering</p>
      <h1 className="font-serif text-2xl font-semibold text-stone-800">Tell us who you are</h1>
      <p className="mt-1 text-sm text-stone-500">
        We use your phone number to check promotion eligibility before checkout.
      </p>

      <div className="mt-5 space-y-4">
        <Input
          label="Name"
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Your name"
          autoComplete="off"
          required
        />
        <Input
          label="Phone Number"
          type="tel"
          value={customerPhoneNumber}
          onChange={(e) => setCustomerPhoneNumber(e.target.value)}
          placeholder="e.g. +85512345678"
          autoComplete="off"
          required
        />
      </div>

      <Button
        fullWidth
        size="lg"
        className="mt-5"
        loading={previewPromotion.isPending}
        onClick={handleContinueWithIdentity}
      >
        Continue to Order
      </Button>
    </div>
  )

  const cartPanel = (
    <div>
      {promotionPreviewBanner}

      <div className="mb-4 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-600">
        <p>
          Ordering as <span className="font-medium text-stone-800">{customerName || 'Guest'}</span>{' '}
          ({customerPhoneNumber || 'No phone'})
        </p>
        <button
          type="button"
          onClick={() => setIsIdentityConfirmed(false)}
          className="mt-1 font-medium text-coffee-700 hover:underline"
        >
          Change details
        </button>
      </div>

      <div
        className={[
          'mb-6 flex items-center gap-2',
          items.length === 0 ? 'justify-center text-center' : '',
        ].join(' ')}
      >
        <ShoppingCart className="h-5 w-5 text-coffee-700" />
        <h1 className="font-serif text-xl font-semibold text-stone-800">
          Your Order
        </h1>
        {itemCount() > 0 && (
          <span className="ml-auto rounded-full bg-coffee-100 px-2 py-0.5 text-xs font-semibold text-coffee-700">
            {itemCount()} item{itemCount() !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-5xl">☕</span>
          <p className="text-stone-500">
            {isQrOrderMode
              ? 'Pick your drinks from the menu above to start ordering.'
              : 'Your cart is empty.'}
          </p>
          {!isQrOrderMode && (
            <Link
              to={
                qrSeatingTableId != null
                  ? `/menu?seating_table_id=${encodeURIComponent(String(qrSeatingTableId))}`
                  : '/menu'
              }
            >
              <Button variant="secondary">Browse menu</Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-stone-100 bg-white shadow-sm">
            <div className="divide-y divide-stone-50 px-4">
              {items.map((item) => (
                <OrderItem key={item.product.id} item={item} />
              ))}
            </div>

            <div className="border-t border-stone-50 px-4 py-4">
              <div className="mb-4 space-y-4">
                <p className="text-xs text-stone-500">
                  Promotion eligibility has been checked for this phone number.
                </p>
              </div>
              <Input
                label="Seating Table ID"
                type="number"
                min="1"
                step="1"
                value={seatingTableIdInput}
                onChange={(e) => setSeatingTableIdInput(e.target.value)}
                placeholder="1"
                readOnly={qrSeatingTableId != null}
                required
              />
              {qrSeatingTableId != null && (
                <p className="mt-1 text-xs text-green-700">Table auto-selected from QR scan.</p>
              )}
            </div>

            <div className="border-t border-stone-100 px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">Subtotal</span>
                <span className="font-semibold text-stone-800">{formatPrice(total())}</span>
              </div>
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            loading={createOrder.isPending}
            disabled={
              createOrder.isPending ||
              !customerName.trim() ||
              !customerPhoneNumber.trim() ||
              !Number.isInteger(Number(seatingTableIdInput)) ||
              Number(seatingTableIdInput) <= 0
            }
            onClick={handlePlaceOrder}
            className="mt-5"
          >
            {createOrder.isPending ? 'Creating transaction…' : `Submit Transaction · ${formatPrice(total())}`}
          </Button>
        </>
      )}
    </div>
  )

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-cream-50 px-4 py-6 md:items-center">
      <div className={isQrOrderMode ? 'w-full max-w-6xl' : 'w-full max-w-sm'}>
        {!isIdentityConfirmed ? (
          identityStep
        ) : (
          <>
        {isQrOrderMode ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <section>
              <div className="mb-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-coffee-600">Order flow</p>
                <h1 className="font-serif text-2xl font-semibold text-stone-800">Choose your drinks</h1>
                <p className="mt-1 text-sm text-stone-500">You are ordering for table #{qrSeatingTableId}.</p>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder="Search drinks..."
                    className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-coffee-400 focus:ring-2 focus:ring-coffee-100"
                  />
                </div>
              </div>

              <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className={[
                    'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    activeCategory === null
                      ? 'bg-coffee-700 text-white'
                      : 'border border-stone-200 bg-white text-stone-600 hover:border-coffee-400',
                  ].join(' ')}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={[
                      'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                      activeCategory === cat.id
                        ? 'bg-coffee-700 text-white'
                        : 'border border-stone-200 bg-white text-stone-600 hover:border-coffee-400',
                    ].join(' ')}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {isOrderProductsLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-56 animate-pulse rounded-2xl bg-stone-100" />
                  ))}
                </div>
              ) : orderProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-stone-500">
                  No drinks found. Try another category or search term.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {orderProducts.map((product) => (
                    <ProductCard key={product.id} product={product} canAdd />
                  ))}
                </div>
              )}
            </section>

            <section className="lg:sticky lg:top-24">{cartPanel}</section>
          </div>
        ) : (
          cartPanel
        )}
          </>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { createOrderEventSource } from '@/api/orders'
import type { TransactionStatus } from '@/types'

export type OrderEventType = 'queued' | 'assigned' | 'completed' | 'cancelled'

export interface OrderEvent {
  type: OrderEventType
  transactionId: string
  status: TransactionStatus | string
  message?: string
  employeeId?: string
  employeeName?: string
  timestamp: string
}

interface OrderStreamState {
  status: (TransactionStatus | string) | null
  currentType: OrderEventType | null
  message: string | null
  assignedEmployeeName: string | null
  events: OrderEvent[]
  connected: boolean
  error: boolean
}

/**
 * Subscribes to real-time order status updates via Server-Sent Events.
 * Automatically cleans up the connection when the component unmounts
 * or when the order reaches a terminal state.
 */
export function useOrderStream(orderId: string | null) {
  const [state, setState] = useState<OrderStreamState>({
    status: null,
    currentType: null,
    message: null,
    assignedEmployeeName: null,
    events: [],
    connected: false,
    error: false,
  })

  useEffect(() => {
    if (!orderId) {
      setState({
        status: null,
        currentType: null,
        message: null,
        assignedEmployeeName: null,
        events: [],
        connected: false,
        error: false,
      })
      return
    }

    const es = createOrderEventSource(orderId)

    es.onopen = () => {
      setState((prev) => ({ ...prev, connected: true, error: false }))
    }

    const applyEvent = (eventType: OrderEventType, event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string
          timestamp?: string
          data?: {
            status?: string
            message?: string
            employee_id?: string | number
            employee_name?: string
            transaction_id?: string | number
          }
        }

        const eventData = payload.data ?? {}
        const parsed: OrderEvent = {
          type: eventType,
          transactionId: String(eventData.transaction_id ?? orderId),
          status: eventData.status ?? 'pending',
          message: eventData.message,
          employeeId:
            eventData.employee_id == null ? undefined : String(eventData.employee_id),
          employeeName: eventData.employee_name ?? undefined,
          timestamp: payload.timestamp ?? new Date().toISOString(),
        }

        setState((prev) => ({
          ...prev,
          status: parsed.status,
          currentType: parsed.type,
          message: parsed.message ?? null,
          assignedEmployeeName: parsed.employeeName ?? prev.assignedEmployeeName,
          events: [...prev.events, parsed],
        }))

        if (parsed.type === 'completed' || parsed.type === 'cancelled') {
          es.close()
          setState((prev) => ({ ...prev, connected: false }))
        }
      } catch {
        // ignore parse errors
      }
    }

    es.addEventListener('queued', (event: Event) => applyEvent('queued', event as MessageEvent))
    es.addEventListener('assigned', (event: Event) => applyEvent('assigned', event as MessageEvent))
    es.addEventListener('completed', (event: Event) => applyEvent('completed', event as MessageEvent))
    es.addEventListener('cancelled', (event: Event) => applyEvent('cancelled', event as MessageEvent))

    // Fallback for unnamed/default messages from proxies or intermediate middleware.
    es.onmessage = (event) => {
      applyEvent('queued', event)
    }

    es.onerror = () => {
      setState((prev) => ({ ...prev, connected: false, error: true }))
      es.close()
    }

    return () => {
      es.close()
    }
  }, [orderId])

  return state
}

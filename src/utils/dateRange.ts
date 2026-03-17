export type DatePreset = 'today' | 'weekly' | 'monthly' | 'yearly'

export interface DateRangeFilter {
  start_datetime: string
  end_datetime: string
}

export function toDatetimeLocalValue(date: Date): string {
  const tzOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

export function toIsoOrUndefined(value?: string): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

export function toIsoRange(
  startDatetime?: string,
  endDatetime?: string,
): { start_datetime?: string; end_datetime?: string } {
  return {
    start_datetime: toIsoOrUndefined(startDatetime),
    end_datetime: toIsoOrUndefined(endDatetime),
  }
}

export function getPresetDateRange(preset: DatePreset, now: Date = new Date()): DateRangeFilter {
  const end = new Date(now)
  const start = new Date(now)

  if (preset === 'today') {
    start.setHours(0, 0, 0, 0)
  }

  if (preset === 'weekly') {
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
  }

  if (preset === 'monthly') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  }

  if (preset === 'yearly') {
    start.setMonth(0, 1)
    start.setHours(0, 0, 0, 0)
  }

  return {
    start_datetime: start.toISOString(),
    end_datetime: end.toISOString(),
  }
}
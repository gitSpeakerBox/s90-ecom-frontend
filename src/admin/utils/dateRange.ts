import type { DatePreset, DateRange, Granularity } from '../types/admin'
import { parseISODate } from './format'

export const DASHBOARD_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '12m', label: '12 Months' },
]

export const REPORT_PRESETS: { value: DatePreset; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '12m', label: '12 Months' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom' },
]

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
}

/**
 * Resolves a preset against the current date. `earliest` is the first date
 * found in the data and anchors the "All time" preset.
 */
export function resolvePreset(
  preset: DatePreset,
  options: { now?: Date; earliest?: string; custom?: { from: string; to: string } } = {}
): DateRange {
  const now = options.now ?? new Date()
  const today = startOfDay(now)
  switch (preset) {
    case 'today':
      return { start: today, end: endOfDay(today) }
    case '7d':
      return { start: addDays(today, -6), end: endOfDay(today) }
    case '30d':
      return { start: addDays(today, -29), end: endOfDay(today) }
    case '90d':
      return { start: addDays(today, -89), end: endOfDay(today) }
    case '12m':
      return { start: new Date(today.getFullYear(), today.getMonth() - 11, 1), end: endOfDay(today) }
    case 'all': {
      const start = options.earliest ? parseISODate(options.earliest) : today
      return { start: start < today ? start : today, end: endOfDay(today) }
    }
    case 'custom': {
      const from = options.custom?.from ? parseISODate(options.custom.from) : today
      const to = options.custom?.to ? parseISODate(options.custom.to) : today
      return from <= to
        ? { start: startOfDay(from), end: endOfDay(to) }
        : { start: startOfDay(to), end: endOfDay(from) }
    }
  }
}

export function isInRange(iso: string, range: DateRange): boolean {
  const d = parseISODate(iso)
  return d >= range.start && d <= range.end
}

/** Daily buckets for ranges up to ~3 months, monthly buckets beyond that. */
export function granularityFor(range: DateRange): Granularity {
  const days = Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000)
  return days > 92 ? 'month' : 'day'
}

export function describeRange(range: DateRange): string {
  const fmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const a = fmt.format(range.start)
  const b = fmt.format(range.end)
  return a === b ? a : `${a} – ${b}`
}

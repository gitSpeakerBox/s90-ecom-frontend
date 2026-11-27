import { formatPrice, formatNumber } from '../../shared/utils/formatters'
import { BASE_CURRENCY } from '../../shared/constants/currency'

/** Formats an amount stored in the catalog base currency (QAR). */
export function money(amount: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact && Math.abs(amount) >= 1000) {
    const formatted = new Intl.NumberFormat('en-QA', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount)
    return `${BASE_CURRENCY} ${formatted}`
  }
  return formatPrice(amount, 'en', BASE_CURRENCY, { alreadyConverted: true })
}

export function num(value: number): string {
  return formatNumber(value, 'en')
}

export function pct(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '—'
  return `${(value * 100).toFixed(digits)}%`
}

/** Parses an ISO calendar date ('YYYY-MM-DD') as a local-time date. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const shortDateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' })
const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' })

export function formatDate(iso: string): string {
  return dateFmt.format(parseISODate(iso))
}

export function formatShortDate(date: Date): string {
  return shortDateFmt.format(date)
}

export function formatMonth(date: Date): string {
  return monthFmt.format(date)
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0] ?? ''
  const lastPart = parts.length > 1 ? parts[parts.length - 1].replace(/^Al-/i, '') : ''
  return (first + (lastPart[0] ?? '')).toUpperCase()
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function includesText(haystack: Array<string | undefined>, needle: string): boolean {
  const q = needle.trim().toLowerCase()
  if (!q) return true
  return haystack.some((h) => (h ?? '').toLowerCase().includes(q))
}

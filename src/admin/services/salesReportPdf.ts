import type { Order } from '../../shared/types/order'
import { CURRENCY_CONFIG } from '../../shared/constants/currency'
import { getExchangeRate } from '../../shared/services/currencyService'
import { PdfDocument, fitText } from '../utils/pdf'
import type { Rgb } from '../utils/pdf'
import { formatConverted } from '../utils/revenueCurrency'
import type { RevenueCurrency } from '../utils/revenueCurrency'
import { formatDate } from '../utils/format'
import { ORDER_STATUS_META } from '../utils/status'
import { formatOrderAmount, orderDiscount, revenueSummary } from './salesReportService'

export interface SalesReportPdfInput {
  /** The filtered orders, in table order. */
  orders: Order[]
  currency: RevenueCurrency
  /** e.g. "24 Oct 2026 – 27 Nov 2026" */
  rangeLabel: string
  /** Active filters other than the date range, e.g. ["Status: Delivered"]. */
  filters: string[]
  generatedAt?: Date
}

const INK: Rgb = [17, 17, 17]
const MUTED: Rgb = [110, 110, 110]
const RULE: Rgb = [222, 222, 222]
const HEAD_FILL: Rgb = [17, 17, 17]
const ZEBRA: Rgb = [247, 247, 247]
const TOTAL_FILL: Rgb = [240, 240, 240]

const MARGIN = 36
const ROW_H = 22
const HEAD_H = 24

interface Col {
  header: string
  width: number
  align?: 'left' | 'right'
  value: (o: Order) => string
}

/** Builds the sales report PDF for the filtered orders (landscape A4). */
export function buildSalesReportPdf(input: SalesReportPdfInput): Uint8Array {
  const { orders, currency } = input
  const doc = new PdfDocument()
  const W = doc.width
  const H = doc.height
  const tableW = W - MARGIN * 2
  const generated = input.generatedAt ?? new Date()
  const stamp = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(generated)

  const fractions: Col[] = [
    { header: 'Customer Name', width: 0.17, value: (o) => o.shippingAddress.fullName || '—' },
    { header: 'Order ID', width: 0.11, value: (o) => o.id },
    { header: 'Date', width: 0.1, value: (o) => formatDate(o.date) },
    { header: 'Payment Method', width: 0.24, value: (o) => o.paymentMethod || '—' },
    { header: 'Discount', width: 0.11, align: 'right', value: (o) => formatOrderAmount(o, orderDiscount(o), currency) },
    { header: 'Order Status', width: 0.12, value: (o) => ORDER_STATUS_META[o.status].label },
    { header: 'Total Amount', width: 0.15, align: 'right', value: (o) => formatOrderAmount(o, o.total, currency) },
  ]
  const cols: Col[] = fractions.map((c) => ({ ...c, width: c.width * tableW }))

  const drawHeader = (first: boolean): number => {
    let y = MARGIN
    doc.text(MARGIN, y + 14, 'S90 SPORT', { size: 16, bold: true })
    doc.text(MARGIN + 96, y + 14, 'Sales Report', { size: 14, color: MUTED })
    doc.text(W - MARGIN, y + 14, `Generated ${stamp}`, { size: 9, color: MUTED, align: 'right' })
    y += 24
    doc.line(MARGIN, y, W - MARGIN, y, INK, 1)
    y += 18
    if (first) {
      const rate = getExchangeRate(currency)
      const currencyLine =
        currency === 'QAR'
          ? `${currency} (${CURRENCY_CONFIG[currency].name})`
          : `${currency} (${CURRENCY_CONFIG[currency].name}) · converted from QAR at 1 QAR = ${rate.toFixed(4)} ${currency}`
      const meta: [string, string][] = [
        ['Report period', input.rangeLabel],
        ['Currency', currencyLine],
        ['Filters', input.filters.length ? input.filters.join(' · ') : 'None'],
        ['Orders', String(orders.length)],
      ]
      for (const [label, value] of meta) {
        doc.text(MARGIN, y, label, { size: 9, bold: true, color: MUTED })
        doc.text(MARGIN + 86, y, fitText(value, tableW - 86, 9), { size: 9, color: INK })
        y += 14
      }
      y += 8
    }
    // column headings
    doc.rect(MARGIN, y, tableW, HEAD_H, HEAD_FILL)
    let x = MARGIN
    for (const c of cols) {
      const tx = c.align === 'right' ? x + c.width - 8 : x + 8
      doc.text(tx, y + 15.5, c.header, { size: 8.5, bold: true, color: [255, 255, 255], align: c.align })
      x += c.width
    }
    return y + HEAD_H
  }

  const bottomLimit = H - MARGIN - 28 // keep room for the page footer
  let y = drawHeader(true)

  if (orders.length === 0) {
    doc.text(MARGIN + 8, y + 16, 'No orders match the selected filters.', { size: 9.5, color: MUTED })
    y += ROW_H
  }
  orders.forEach((o, i) => {
    if (y + ROW_H > bottomLimit) {
      doc.addPage()
      y = drawHeader(false)
    }
    if (i % 2 === 1) doc.rect(MARGIN, y, tableW, ROW_H, ZEBRA)
    let x = MARGIN
    for (const c of cols) {
      const value = fitText(c.value(o), c.width - 16, 9)
      const tx = c.align === 'right' ? x + c.width - 8 : x + 8
      doc.text(tx, y + 14.5, value, { size: 9, color: INK, align: c.align })
      x += c.width
    }
    doc.line(MARGIN, y + ROW_H, W - MARGIN, y + ROW_H, RULE, 0.5)
    y += ROW_H
  })

  // Total Revenue (from the orders in this report, original amounts)
  const summary = revenueSummary(orders, currency)
  const totalBlock = 30 + 30
  if (y + totalBlock > bottomLimit) {
    doc.addPage()
    y = drawHeader(false)
  }
  y += 6
  doc.rect(MARGIN, y, tableW, 30, TOTAL_FILL)
  doc.line(MARGIN, y, W - MARGIN, y, INK, 1)
  doc.text(MARGIN + 8, y + 19.5, 'Total Revenue', { size: 11, bold: true })
  doc.text(W - MARGIN - 8, y + 19.5, formatConverted(summary.revenue, currency), { size: 12, bold: true, align: 'right' })
  y += 30 + 14
  const note =
    `Total Revenue = totals of the ${summary.paidOrders} paid order${summary.paidOrders === 1 ? '' : 's'} in this report, each counted once, from the stored order amounts.` +
    (summary.excludedOrders
      ? ` Not included: ${summary.excludedOrders} unpaid Cash on Delivery order${summary.excludedOrders === 1 ? '' : 's'} (${formatConverted(summary.excludedAmount, currency)}), counted once delivered.`
      : '')
  doc.text(MARGIN, y, fitText(note, tableW, 8), { size: 8, color: MUTED })

  // Footers
  const pages = doc.pageCount
  for (let p = 0; p < pages; p++) {
    doc.onPage(p, () => {
      doc.line(MARGIN, H - MARGIN - 12, W - MARGIN, H - MARGIN - 12, RULE, 0.5)
      doc.text(MARGIN, H - MARGIN, `S90 SPORT · Sales Report · ${input.rangeLabel} · ${currency}`, { size: 8, color: MUTED })
      doc.text(W - MARGIN, H - MARGIN, `Page ${p + 1} of ${pages}`, { size: 8, color: MUTED, align: 'right' })
    })
  }

  return doc.toBytes({ title: `S90 SPORT Sales Report ${input.rangeLabel} (${currency})` })
}

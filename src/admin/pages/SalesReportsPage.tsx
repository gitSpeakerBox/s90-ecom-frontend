import { useState } from 'react'
import { Eye, FileDown, ReceiptText } from 'lucide-react'
import type { Order, OrderStatus } from '../../shared/types/order'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { Dialog } from '../components/Dialog'
import { ResultCount, SearchInput, SelectFilter } from '../components/Filters'
import { DataTable } from '../components/DataTable'
import type { Column, SortState } from '../utils/table'
import { sortRows } from '../utils/table'
import { Pagination } from '../components/Pagination'
import { EmptyState } from '../components/EmptyState'
import { OrderStatusBadge, PaymentStatusBadge } from '../components/StatusBadge'
import { useAdminData } from '../context/AdminDataContext'
import { usePagination } from '../hooks/usePagination'
import { earliestOrderDate, getPaymentStatus, listOrders, orderUnits } from '../services/orderAdminService'
import {
  convertOrderAmount,
  filterSalesOrders,
  displayOrderAmount,
  REPORT_CURRENCY_SYMBOL,
  orderDiscount,
  paymentMethodOptions,
} from '../services/salesReportService'
import type { PaymentMethodType } from '../services/salesReportService'
import { buildSalesReportPdf } from '../services/salesReportPdf'
import { downloadPdf } from '../utils/pdf'
import { REPORT_PRESETS, describeRange, resolvePreset } from '../utils/dateRange'
import { ORDER_STATUSES, ORDER_STATUS_META } from '../utils/status'
import { BASE_REVENUE_CURRENCY, REVENUE_CURRENCIES } from '../utils/revenueCurrency'
import type { RevenueCurrency } from '../utils/revenueCurrency'
import { formatDate, num, toISODate } from '../utils/format'
import type { DatePreset } from '../types/admin'
import './pages.css'
import './SalesReportsPage.css'

const PAGE_SIZE = 10

export function SalesReportsPage() {
  useAdminData() // subscribe: re-render after every admin commit (e.g. order status changes)
  const [query, setQuery] = useState('')
  const [preset, setPreset] = useState<DatePreset>('all')
  const [custom, setCustom] = useState(() => {
    const today = toISODate(new Date())
    return { from: earliestOrderDate() ?? today, to: today }
  })
  const [payment, setPayment] = useState<PaymentMethodType | 'all'>('all')
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [currency, setCurrency] = useState<RevenueCurrency>(BASE_REVENUE_CURRENCY)
  const [sort, setSort] = useState<SortState>({ key: 'date', dir: 'desc' })
  const [viewId, setViewId] = useState<string | null>(null)

  const all = listOrders()
  const range = resolvePreset(preset, { earliest: earliestOrderDate(), custom })
  const rangeLabel = describeRange(range)
  const filtered = filterSalesOrders(all, { query, range, payment, status })

  const columns: Column<Order>[] = [
    {
      key: 'customer',
      header: 'Customer Name',
      render: (o) => <span className="adm-cell-primary">{o.shippingAddress.fullName || '—'}</span>,
      sortValue: (o) => o.shippingAddress.fullName.toLowerCase(),
    },
    { key: 'id', header: 'Order ID', render: (o) => <span className="adm-num">{o.id}</span>, sortValue: (o) => o.id },
    { key: 'date', header: 'Date', render: (o) => formatDate(o.date), sortValue: (o) => o.date },
    {
      key: 'payment',
      header: 'Payment Method',
      render: (o) => <span className="adm-sales-payment">{o.paymentMethod || '—'}</span>,
      sortValue: (o) => o.paymentMethod,
    },
    {
      key: 'discount',
      header: 'Discount',
      align: 'right',
      render: (o) => {
        const d = orderDiscount(o)
        return <span className={`adm-num ${d ? '' : 'adm-muted'}`}>{displayOrderAmount(o, d, currency)}</span>
      },
      sortValue: (o) => convertOrderAmount(o, orderDiscount(o), currency),
    },
    {
      key: 'status',
      header: 'Order Status',
      render: (o) => <OrderStatusBadge status={o.status} />,
      sortValue: (o) => ORDER_STATUSES.indexOf(o.status),
    },
    {
      key: 'total',
      header: 'Total Amount',
      align: 'right',
      render: (o) => <span className="adm-num adm-cell-primary">{displayOrderAmount(o, o.total, currency)}</span>,
      sortValue: (o) => convertOrderAmount(o, o.total, currency),
    },
    {
      key: 'view',
      header: 'View',
      align: 'center',
      render: (o) => (
        <button
          type="button"
          className="adm-icon-btn"
          title="View order details"
          aria-label={`View order ${o.id}`}
          onClick={() => setViewId(o.id)}
        >
          <Eye size={16} aria-hidden="true" />
        </button>
      ),
    },
  ]

  const rows = sortRows(filtered, columns, sort)
  const pagination = usePagination(rows, PAGE_SIZE)
  const viewing = viewId ? (all.find((o) => o.id === viewId) ?? null) : null
  const resetPage = <V,>(setter: (v: V) => void) => (v: V) => {
    setter(v)
    pagination.setPage(1)
  }
  const hasFilters = Boolean(query.trim()) || preset !== 'all' || payment !== 'all' || status !== 'all'

  const activeFilters = [
    query.trim() && `Search: “${query.trim()}”`,
    payment !== 'all' && `Payment method: ${payment}`,
    status !== 'all' && `Order status: ${ORDER_STATUS_META[status].label}`,
  ].filter(Boolean) as string[]

  const exportPdf = () => {
    const bytes = buildSalesReportPdf({ orders: rows, currency, rangeLabel, filters: activeFilters })
    downloadPdf(`s90-sales-report_${toISODate(range.start)}_to_${toISODate(range.end)}_${currency}.pdf`, bytes)
  }

  return (
    <div className="adm-stack">
      <PageHeader title="Sales Reports" subtitle={`Orders placed ${rangeLabel}`} />

      <Card flush>
        <div className="adm-toolbar adm-sales-toolbar">
          <SearchInput
            value={query}
            onChange={resetPage(setQuery)}
            placeholder="Search customer name or order ID…"
            label="Search customer name or order ID"
          />
          <SelectFilter
            label="Date range"
            value={preset}
            onChange={resetPage((v: string) => setPreset(v as DatePreset))}
            options={REPORT_PRESETS.map((p) => ({ value: p.value, label: p.value === 'all' ? 'All dates' : p.value === 'custom' ? 'Custom range' : `Last ${p.label}` }))}
          />
          {preset === 'custom' && (
            <div className="adm-date-inputs">
              <label className="adm-sr-only" htmlFor="sales-from">
                From
              </label>
              <input
                id="sales-from"
                type="date"
                className="adm-input"
                value={custom.from}
                max={custom.to}
                onChange={(e) => e.target.value && resetPage(setCustom)({ ...custom, from: e.target.value })}
              />
              <span className="adm-muted">to</span>
              <label className="adm-sr-only" htmlFor="sales-to">
                To
              </label>
              <input
                id="sales-to"
                type="date"
                className="adm-input"
                value={custom.to}
                min={custom.from}
                onChange={(e) => e.target.value && resetPage(setCustom)({ ...custom, to: e.target.value })}
              />
            </div>
          )}
          <SelectFilter
            label="Payment method"
            value={payment}
            onChange={resetPage((v: string) => setPayment(v as PaymentMethodType | 'all'))}
            options={[{ value: 'all', label: 'All payment methods' }, ...paymentMethodOptions(all).map((t) => ({ value: t, label: t }))]}
          />
          <SelectFilter
            label="Order status"
            value={status}
            onChange={resetPage((v: string) => setStatus(v as OrderStatus | 'all'))}
            options={[{ value: 'all', label: 'All statuses' }, ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_META[s].label }))]}
          />
          {hasFilters && (
            <button
              type="button"
              className="adm-btn adm-btn--sm adm-btn--ghost"
              onClick={() => {
                setQuery('')
                setPreset('all')
                setPayment('all')
                setStatus('all')
                pagination.setPage(1)
              }}
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="adm-toolbar adm-sales-toolbar adm-sales-toolbar--meta">
          <ResultCount shown={filtered.length} total={all.length} noun="orders" />
          <span className="adm-toolbar__spacer" />
          <select
            className="adm-select adm-filter-select adm-sales-currency"
            aria-label="Report currency"
            title="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as RevenueCurrency)}
          >
            {REVENUE_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({REPORT_CURRENCY_SYMBOL[c.code]})
              </option>
            ))}
          </select>
          <button type="button" className="adm-btn adm-btn--primary" onClick={exportPdf} disabled={filtered.length === 0}>
            <FileDown size={16} aria-hidden="true" /> Export PDF
          </button>
        </div>
        <div className="adm-sales-table">
          <DataTable
            caption="Sales report"
            columns={columns}
            rows={pagination.pageItems}
            rowKey={(o) => o.id}
            sortState={sort}
            onSortChange={(s) => {
              setSort(s)
              pagination.setPage(1)
            }}
            empty={<EmptyState icon={ReceiptText} title="No orders match" text="Change the search, date range or filters to see orders." />}
          />
        </div>
        {filtered.length > 0 && <Pagination state={pagination} noun="orders" showPageSize={false} showPageCount />}
      </Card>

      <Dialog
        open={Boolean(viewing)}
        onClose={() => setViewId(null)}
        title={viewing ? `Order ${viewing.id}` : ''}
        subtitle={viewing ? `Placed ${formatDate(viewing.date)} · ${num(orderUnits(viewing))} item(s)` : undefined}
      >
        {viewing && <OrderDetails key={viewing.id} order={viewing} currency={currency} />}
      </Dialog>
    </div>
  )
}

/** Read-only order details in the report currency (all amounts from the stored order). */
function OrderDetails({ order, currency }: { order: Order; currency: RevenueCurrency }) {
  const addr = order.shippingAddress
  const amount = (value: number) => displayOrderAmount(order, value, currency)
  const discount = orderDiscount(order)
  return (
    <div className="adm-sales-detail">
      <div className="adm-dialog-section">
        <div className="adm-sales-detail__badges">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={getPaymentStatus(order)} />
        </div>
      </div>

      <div className="adm-dialog-section adm-sales-detail__grid">
        <div>
          <h3 className="adm-dialog-section__title">Customer</h3>
          <dl className="adm-detail-list">
            <dt>Name</dt>
            <dd>{addr.fullName || '—'}</dd>
            <dt>Email</dt>
            {order.customerEmail ? <dd>{order.customerEmail}</dd> : <dd className="adm-muted">Not provided</dd>}
            <dt>Phone</dt>
            <dd>{addr.phone ?? <span className="adm-muted">Not provided</span>}</dd>
            <dt>Order ID</dt>
            <dd className="adm-num">{order.id}</dd>
            <dt>Order date</dt>
            <dd>{formatDate(order.date)}</dd>
          </dl>
        </div>
        <div>
          <h3 className="adm-dialog-section__title">Payment & delivery</h3>
          <dl className="adm-detail-list">
            <dt>Payment method</dt>
            <dd>{order.paymentMethod || '—'}</dd>
            <dt>Payment status</dt>
            <dd>{getPaymentStatus(order)}</dd>
            <dt>Order status</dt>
            <dd>{ORDER_STATUS_META[order.status]?.label ?? order.status}</dd>
            <dt>Delivery address</dt>
            <dd>
              {addr.street}
              <br />
              {[addr.city, addr.region, addr.country].filter(Boolean).join(', ')}
              {addr.postalCode ? ` · ${addr.postalCode}` : ''}
            </dd>
          </dl>
        </div>
      </div>

      <div className="adm-dialog-section">
        <h3 className="adm-dialog-section__title">Products</h3>
        <ul className="adm-order-items">
          {order.items.map((item, i) => (
            <li key={`${item.productSlug}-${item.size}-${i}`}>
              <img src={item.productImage} alt="" className="adm-thumb" />
              <div style={{ minWidth: 0 }}>
                <div className="adm-cell-primary">{item.productName}</div>
                <div className="adm-cell-secondary">
                  Size {item.size} · Qty {item.quantity} · {amount(item.price)} each
                </div>
              </div>
              <span className="adm-num adm-cell-primary">{amount(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="adm-order-totals adm-num">
          <div>
            <span>Subtotal</span>
            <span>{amount(order.subtotal)}</span>
          </div>
          <div>
            <span>Discount</span>
            <span>{discount ? `− ${amount(discount)}` : amount(0)}</span>
          </div>
          <div>
            <span>Shipping</span>
            <span>{order.shippingFee === 0 ? `Free (${amount(0)})` : amount(order.shippingFee)}</span>
          </div>
          <div className="is-total">
            <span>Total</span>
            <span>{amount(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

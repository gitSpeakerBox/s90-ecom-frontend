import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bell, Eye, ShoppingBag } from 'lucide-react'
import type { Order } from '../../shared/types/order'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { ResultCount, SearchInput, SegmentedControl, SelectFilter } from '../components/Filters'
import { DataTable } from '../components/DataTable'
import { sortRows, stop } from '../utils/table'
import type { Column } from '../utils/table'
import { Pagination } from '../components/Pagination'
import { EmptyState } from '../components/EmptyState'
import { OrderStatusBadge, PaymentStatusBadge } from '../components/StatusBadge'
import { OrderDetailDrawer } from './OrderDetailDrawer'
import { useAdminData } from '../context/AdminDataContext'
import { usePagination } from '../hooks/usePagination'
import { useMarkNewOrdersReadOnOpen, useNewOrders } from '../hooks/useNewOrders'
import {
  NEW_ORDER_STATUS,
  earliestOrderDate,
  getPaymentStatus,
  listOrders,
  orderUnits,
} from '../services/orderAdminService'
import { isInRange, resolvePreset } from '../utils/dateRange'
import { ORDER_STATUSES } from '../utils/status'
import { formatDate, includesText, money, num } from '../utils/format'
import type { DatePreset } from '../types/admin'
import './pages.css'

type StatusFilter = 'all' | Order['status']

/** Fixed page size for the Orders table (no rows-per-page selector). */
const ORDERS_PAGE_SIZE = 5

const DATE_OPTIONS = [
  { value: 'all', label: 'Any date' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
]

export function OrdersPage() {
  useAdminData() // subscribe: re-render after every admin commit
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [payment, setPayment] = useState('all')
  const [date, setDate] = useState('all')
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' })

  const all = listOrders()

  const statusOptions = [
      { value: 'all' as StatusFilter, label: `All · ${all.length}` },
      ...ORDER_STATUSES.map((s) => ({
        value: s as StatusFilter,
        label: `${s} · ${all.filter((o) => o.status === s).length}`,
      })),
    ]

  const columns: Column<Order>[] = [
    {
      key: 'id',
      header: 'Order ID',
      render: (o) => <span className="adm-cell-primary adm-mono">{o.id}</span>,
      sortValue: (o) => o.id,
      nowrap: true,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (o) => (
        <div>
          <div className="adm-cell-primary">{o.shippingAddress.fullName}</div>
          <div className="adm-cell-secondary is-nowrap" style={{ whiteSpace: 'nowrap' }} title="Orders in the demo data carry no email address">
            No email · {o.shippingAddress.phone ?? '—'}
          </div>
        </div>
      ),
      sortValue: (o) => o.shippingAddress.fullName,
    },
    { key: 'date', header: 'Date', render: (o) => formatDate(o.date), sortValue: (o) => o.date, nowrap: true },
    {
      key: 'items',
      header: 'Items',
      render: (o) => <span className="adm-num">{num(orderUnits(o))}</span>,
      sortValue: (o) => orderUnits(o),
      align: 'right',
    },
    {
      key: 'total',
      header: 'Total',
      render: (o) => <span className="adm-num adm-cell-primary">{money(o.total)}</span>,
      sortValue: (o) => o.total,
      align: 'right',
      nowrap: true,
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (o) => (
        <div>
          <PaymentStatusBadge status={getPaymentStatus(o)} />
          <div className="adm-cell-secondary" style={{ marginTop: 4 }}>
            {o.paymentMethod.replace(/^Credit Card \((.*)\)$/, '$1')}
          </div>
        </div>
      ),
      sortValue: (o) => getPaymentStatus(o),
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <OrderStatusBadge status={o.status} />,
      sortValue: (o) => ORDER_STATUSES.indexOf(o.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      hideHeader: true,
      align: 'right',
      render: (o) => (
        <button
          type="button"
          className="adm-btn adm-btn--sm"
          onClick={(e) => {
            stop(e)
            openOrder(o.id)
          }}
        >
          <Eye size={14} aria-hidden="true" /> View
        </button>
      ),
    },
  ]

  const filtered = (() => {
    const range = date === 'all' ? null : resolvePreset(date as DatePreset, { earliest: earliestOrderDate() })
    const rows = all.filter((o) => {
      if (status !== 'all' && o.status !== status) return false
      if (payment !== 'all' && getPaymentStatus(o) !== payment) return false
      if (range && !isInRange(o.date, range)) return false
      return includesText(
        [
          o.id,
          o.shippingAddress.fullName,
          o.shippingAddress.phone,
          o.shippingAddress.city,
          o.paymentMethod,
          ...o.items.map((i) => i.productName),
        ],
        query
      )
    })
    return sortRows(rows, columns, sort)
    // columns are stable in behaviour; sorting depends on `sort` only
  })()

  const pagination = usePagination(filtered, ORDERS_PAGE_SIZE)
  const newOrders = useNewOrders()
  useMarkNewOrdersReadOnOpen()
  const selectedId = params.get('order')
  const selected = selectedId ? (all.find((o) => o.id === selectedId) ?? null) : null

  function openOrder(id: string) {
    const next = new URLSearchParams(params)
    next.set('order', id)
    setParams(next)
  }

  function closeOrder() {
    const next = new URLSearchParams(params)
    next.delete('order')
    setParams(next, { replace: true })
  }

  const hasFilters = query || status !== 'all' || payment !== 'all' || date !== 'all'

  return (
    <div className="adm-stack">
      <PageHeader
        title="Orders"
        subtitle="Track and manage customer orders, payment and fulfilment status."
        actions={
          <button
            type="button"
            className="adm-icon-btn adm-icon-btn--bordered adm-order-bell"
            onClick={() => {
              setStatus(NEW_ORDER_STATUS)
              pagination.setPage(1)
            }}
            aria-label={
              newOrders.length
                ? `${newOrders.length} unread new order${newOrders.length === 1 ? '' : 's'} — show new orders`
                : 'No unread new orders — show new orders'
            }
            title={`Unread new orders (status “${NEW_ORDER_STATUS}”). Opening this page marks them as read.`}
          >
            <Bell size={18} aria-hidden="true" />
            {newOrders.length > 0 && (
              <span className="adm-order-bell__count adm-num" aria-hidden="true">
                {newOrders.length > 99 ? '99+' : newOrders.length}
              </span>
            )}
          </button>
        }
      />

      

      <Card flush>
        <div className="adm-toolbar">
          <SegmentedControl label="Filter by status" value={status} onChange={setStatus} options={statusOptions} />
        </div>
        <div className="adm-toolbar">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search order ID, customer, phone, product…"
            label="Search orders"
          />
          <SelectFilter
            label="Payment status"
            value={payment}
            onChange={setPayment}
            options={[
              { value: 'all', label: 'Any payment' },
              { value: 'Paid', label: 'Paid' },
              { value: 'Unpaid (COD)', label: 'Unpaid · COD' },
            ]}
          />
          <SelectFilter label="Order date" value={date} onChange={setDate} options={DATE_OPTIONS} />
          {hasFilters && (
            <button
              type="button"
              className="adm-btn adm-btn--sm adm-btn--ghost"
              onClick={() => {
                setQuery('')
                setStatus('all')
                setPayment('all')
                setDate('all')
              }}
            >
              Clear filters
            </button>
          )}
          <span className="adm-toolbar__spacer" />
          <ResultCount shown={filtered.length} total={all.length} noun="orders" />
        </div>
        <DataTable
          caption="Orders"
          columns={columns}
          rows={pagination.pageItems}
          rowKey={(o) => o.id}
          onRowClick={(o) => openOrder(o.id)}
          sortState={sort}
          onSortChange={setSort}
          empty={
            <EmptyState
              icon={ShoppingBag}
              title="No orders match these filters"
              text="Adjust the search or filters to see more orders."
            />
          }
        />
        <Pagination state={pagination} noun="orders" showPageSize={false} />
      </Card>

      <OrderDetailDrawer order={selected} onClose={closeOrder} />
    </div>
  )
}

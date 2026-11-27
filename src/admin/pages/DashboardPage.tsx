import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CircleCheck,
  CircleDollarSign,
  Clock,
  Package,
  ShoppingBag,
  Users,
  ChartColumn,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { MetricCard } from '../components/MetricCard'
import { SegmentedControl } from '../components/Filters'
import { DataTable } from '../components/DataTable'
import type { Column } from '../utils/table'
import { EmptyState } from '../components/EmptyState'
import { OrderStatusBadge } from '../components/StatusBadge'
import { RevenueAreaChart } from '../components/charts/RevenueAreaChart'
import { SalesBarChart } from '../components/charts/SalesBarChart'
import { StatusDonut } from '../components/charts/StatusDonut'
import { BarList } from '../components/charts/BarList'
import { useAdminData } from '../context/AdminDataContext'
import { listOrders, sortByDateDesc, isOpenOrder, earliestOrderDate } from '../services/orderAdminService'
import { listProducts } from '../services/productAdminService'
import { listCustomers } from '../services/userAdminService'
import { ordersInRange, productSales, statusBreakdown, summarize, timeSeries } from '../services/analyticsService'
import { DASHBOARD_PRESETS, describeRange, resolvePreset } from '../utils/dateRange'
import { TYPE_COLORS } from '../utils/status'
import { formatDate, num } from '../utils/format'
import {
  BASE_REVENUE_CURRENCY,
  REVENUE_CURRENCIES,
  convertFromBase,
  formatFromBase,
  formatRevenue,
} from '../utils/revenueCurrency'
import type { RevenueCurrency } from '../utils/revenueCurrency'
import type { DatePreset } from '../types/admin'
import type { Order } from '../../shared/types/order'
import { adminPath } from '../routes/navConfig'
import './pages.css'

/** Number of orders shown in the Recent orders table (newest first). */
const RECENT_ORDERS_LIMIT = 5

export function DashboardPage() {
  useAdminData() // subscribe: re-render after every admin commit
  const [preset, setPreset] = useState<DatePreset>('12m')
  // Local to this page — never touches the storefront's currency preference.
  const [currency, setCurrency] = useState<RevenueCurrency>(BASE_REVENUE_CURRENCY)

  const data = (() => {
    const range = resolvePreset(preset)
    const all = listOrders()
    const orders = ordersInRange(all, range)
    const granularity = preset === '12m' ? 'month' : 'day'
    return {
      range,
      all,
      orders,
      summary: summarize(orders),
      series: timeSeries(all, range, granularity),
      status: statusBreakdown(orders),
      top: productSales(orders).slice(0, 5),
      recent: sortByDateDesc(orders).slice(0, RECENT_ORDERS_LIMIT),
      pending: orders.filter(isOpenOrder).length,
      delivered: orders.filter((o) => o.status === 'Delivered').length,
      products: listProducts().length,
      customers: listCustomers().length,
      earliest: earliestOrderDate(),
      latest: sortByDateDesc(all)[0]?.date,
    }
  })()

  const { summary } = data
  // Display-only conversion: always derived from the original QAR total.
  const revenueDisplay = formatRevenue(summary.revenue, currency)
  // Chart datasets: a fresh converted copy derived from the base (QAR) series on
  // every render — the base series itself is never modified or re-converted.
  const displaySeries = data.series.map((p) => ({
    ...p,
    revenue: convertFromBase(p.revenue, currency),
    jerseys: convertFromBase(p.jerseys, currency),
    shoes: convertFromBase(p.shoes, currency),
  }))
  const periodHint = preset === 'today' ? 'Today' : `Selected period`

  const recentColumns: Column<Order>[] = [
    {
      key: 'id',
      header: 'Order',
      render: (o) => <span className="adm-cell-primary adm-mono">{o.id}</span>,
      nowrap: true,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (o) => (
        <div>
          <div className="adm-cell-primary">{o.shippingAddress.fullName}</div>
          <div className="adm-cell-secondary">{o.shippingAddress.city}</div>
        </div>
      ),
    },
    { key: 'date', header: 'Date', render: (o) => formatDate(o.date), nowrap: true },
    { key: 'items', header: 'Items', render: (o) => num(o.items.length), align: 'right' },
    {
      key: 'total',
      header: 'Total',
      render: (o) => <span className="adm-num adm-cell-primary">{formatFromBase(o.total, currency)}</span>,
      align: 'right',
      nowrap: true,
    },
    { key: 'status', header: 'Status', render: (o) => <OrderStatusBadge status={o.status} /> },
  ]

  const noOrders = data.orders.length === 0

  return (
    <div className="adm-stack">
      <PageHeader
        title="Dashboard"
        subtitle={`Store performance for ${describeRange(data.range)}.`}
        actions={
          <SegmentedControl label="Date range" value={preset} onChange={setPreset} options={DASHBOARD_PRESETS} />
        }
      />

      

      <div className="adm-grid adm-grid--metrics">
        <MetricCard
          label="Total Revenue"
          value={revenueDisplay.formatted}
          icon={CircleDollarSign}
          action={
            <select
              className="adm-select adm-metric__select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as RevenueCurrency)}
              aria-label="Dashboard currency"
              title="Currency for all amounts on the dashboard"
            >
              {REVENUE_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} title={c.name}>
                  {c.code}
                </option>
              ))}
            </select>
          }
        />
        <MetricCard label="Total Orders" value={num(summary.orders)} icon={ShoppingBag} hint={periodHint} />
        <MetricCard label="Total Products" value={num(data.products)} icon={Package} hint="Live catalog · all time" />
        <MetricCard
          label="Total Customers"
          value={num(data.customers)}
          icon={Users}
          hint="Accounts + order recipients"
        />
        <MetricCard label="Pending Orders" value={num(data.pending)} icon={Clock} hint="Not yet delivered" />
        <MetricCard label="Delivered Orders" value={num(data.delivered)} icon={CircleCheck} hint={periodHint} />
      </div>

      <div className="adm-grid adm-grid--2-1">
        <Card
          title="Revenue overview"
          subtitle={preset === '12m' ? 'Monthly order revenue' : 'Daily order revenue'}
        >
          {noOrders ? (
            <EmptyState icon={ChartColumn} title="No orders in this period" text="Try a longer date range." />
          ) : (
            <RevenueAreaChart data={displaySeries} currency={currency} />
          )}
        </Card>
        <Card title="Orders by status" subtitle="Fulfilment pipeline for the period">
          {noOrders ? (
            <EmptyState icon={ShoppingBag} title="No orders in this period" />
          ) : (
            <StatusDonut data={data.status} />
          )}
        </Card>
      </div>

      <div className="adm-grid adm-grid--2-1">
        <Card title="Sales performance" subtitle="Line-item revenue by product line">
          {noOrders ? (
            <EmptyState icon={ChartColumn} title="No sales in this period" />
          ) : (
            <SalesBarChart data={displaySeries} currency={currency} />
          )}
        </Card>
        <Card
          title="Top-selling products"
          subtitle="By line-item revenue"
          actions={
            <Link to={adminPath('sales-reports')} className="adm-btn adm-btn--sm adm-btn--ghost">
              Reports <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          }
        >
          {data.top.length === 0 ? (
            <EmptyState icon={Package} title="No products sold in this period" />
          ) : (
            <BarList
              ranked
              items={data.top.map((p) => ({
                key: p.slug,
                name: p.name,
                meta: `${num(p.units)} unit${p.units === 1 ? '' : 's'} · ${p.category}`,
                value: p.revenue,
                valueLabel: formatFromBase(p.revenue, currency, { compact: true }),
                color: TYPE_COLORS[p.type],
                leading: <img src={p.image} alt="" className="adm-thumb" style={{ width: 36, height: 36 }} />,
              }))}
            />
          )}
        </Card>
      </div>

      <Card
          title="Recent orders"
          subtitle={`Latest ${RECENT_ORDERS_LIMIT} orders in the period`}
          className="adm-recent-orders"
          flush
          actions={
            <Link to={adminPath('orders')} className="adm-btn adm-btn--sm adm-btn--ghost">
              All orders <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          }
        >
          <DataTable
            caption="Recent orders"
            columns={recentColumns}
            rows={data.recent}
            rowKey={(o) => o.id}
            empty={<EmptyState icon={ShoppingBag} title="No orders in this period" />}
          />
        </Card>
    </div>
  )
}

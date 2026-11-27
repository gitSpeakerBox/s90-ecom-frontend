import { useState } from 'react'
import { ChartColumn, CircleDollarSign, Download, Package, Receipt, ShoppingBag } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { MetricCard } from '../components/MetricCard'
import { SegmentedControl } from '../components/Filters'
import { DataTable } from '../components/DataTable'
import type { Column } from '../utils/table'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/StatusBadge'
import { RevenueAreaChart } from '../components/charts/RevenueAreaChart'
import { SalesBarChart } from '../components/charts/SalesBarChart'
import { BarList } from '../components/charts/BarList'
import { useAdminData } from '../context/AdminDataContext'
import { earliestOrderDate, listOrders, sortByDateDesc } from '../services/orderAdminService'
import {
  categorySales,
  dailySales,
  ordersInRange,
  productSales,
  summarize,
  timeSeries,
} from '../services/analyticsService'
import { REPORT_PRESETS, describeRange, granularityFor, resolvePreset } from '../utils/dateRange'
import { downloadCsv } from '../utils/csv'
import { TYPE_COLORS } from '../utils/status'
import { formatDate, money, num, pct, toISODate } from '../utils/format'
import type { CategorySalesRow, DailySalesRow, DatePreset, ProductSalesRow } from '../types/admin'
import './pages.css'

export function SalesReportsPage() {
  useAdminData() // subscribe: re-render after every admin commit
  const [preset, setPreset] = useState<DatePreset>('all')
  const [custom, setCustom] = useState(() => {
    const today = toISODate(new Date())
    return { from: earliestOrderDate() ?? today, to: today }
  })

  const report = (() => {
    const range = resolvePreset(preset, { earliest: earliestOrderDate(), custom })
    const all = listOrders()
    const orders = ordersInRange(all, range)
    const granularity = granularityFor(range)
    return {
      range,
      all,
      orders,
      granularity,
      summary: summarize(orders),
      series: timeSeries(all, range, granularity),
      daily: dailySales(orders),
      products: productSales(orders),
      categories: categorySales(orders),
    }
  })()

  const { summary, range } = report
  const stamp = `${toISODate(range.start)}_to_${toISODate(range.end)}`
  const empty = report.orders.length === 0

  const exportDaily = () =>
    downloadCsv(
      `s90-demo-revenue-by-date_${stamp}.csv`,
      ['Date', 'Orders', 'Units', 'Revenue (QAR)', 'Source'],
      report.daily.map((d) => [d.date, d.orders, d.units, d.revenue.toFixed(2), 'Demo data'])
    )

  const exportProducts = () =>
    downloadCsv(
      `s90-demo-best-sellers_${stamp}.csv`,
      ['Product', 'Slug', 'Product line', 'Category', 'Orders', 'Units', 'Revenue (QAR)', 'Source'],
      report.products.map((p) => [
        p.name,
        p.slug,
        p.type === 'jerseys' ? 'Jerseys' : 'Shoes',
        p.category,
        p.orders,
        p.units,
        p.revenue.toFixed(2),
        'Demo data',
      ])
    )

  const exportCategories = () =>
    downloadCsv(
      `s90-demo-sales-by-category_${stamp}.csv`,
      ['Category', 'Product line', 'Units', 'Revenue (QAR)', 'Share of line revenue', 'Source'],
      report.categories.map((c) => [
        c.category,
        c.type === 'jerseys' ? 'Jerseys' : 'Shoes',
        c.units,
        c.revenue.toFixed(2),
        pct(c.share, 1),
        'Demo data',
      ])
    )

  const exportOrders = () =>
    downloadCsv(
      `s90-demo-order-lines_${stamp}.csv`,
      ['Order ID', 'Date', 'Status', 'Customer', 'Product', 'Size', 'Quantity', 'Unit price (QAR)', 'Line total (QAR)', 'Order total (QAR)', 'Source'],
      sortByDateDesc(report.orders).flatMap((o) =>
        o.items.map((i) => [
          o.id,
          o.date,
          o.status,
          o.shippingAddress.fullName,
          i.productName,
          i.size,
          i.quantity,
          i.price.toFixed(2),
          (i.price * i.quantity).toFixed(2),
          o.total.toFixed(2),
          'Demo data',
        ])
      )
    )

  const dailyColumns: Column<DailySalesRow>[] = [
    { key: 'date', header: 'Date', render: (d) => formatDate(d.date), sortValue: (d) => d.date, nowrap: true },
    { key: 'orders', header: 'Orders', align: 'right', render: (d) => <span className="adm-num">{num(d.orders)}</span>, sortValue: (d) => d.orders },
    { key: 'units', header: 'Units', align: 'right', render: (d) => <span className="adm-num">{num(d.units)}</span>, sortValue: (d) => d.units },
    {
      key: 'aov',
      header: 'Avg. order',
      align: 'right',
      render: (d) => <span className="adm-num">{money(d.revenue / d.orders)}</span>,
      sortValue: (d) => d.revenue / d.orders,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      nowrap: true,
      render: (d) => <span className="adm-num adm-cell-primary">{money(d.revenue)}</span>,
      sortValue: (d) => d.revenue,
    },
  ]

  const productColumns: Column<ProductSalesRow>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div className="adm-cell-media">
          <img src={p.image} alt="" className="adm-thumb" loading="lazy" />
          <div>
            <div className="adm-cell-primary">{p.name}</div>
            <div className="adm-cell-secondary">{p.category}</div>
          </div>
        </div>
      ),
      sortValue: (p) => p.name,
    },
    {
      key: 'type',
      header: 'Line',
      render: (p) => <Badge tone="neutral" dotColor={TYPE_COLORS[p.type]}>{p.type === 'jerseys' ? 'Jerseys' : 'Shoes'}</Badge>,
      sortValue: (p) => p.type,
    },
    { key: 'orders', header: 'Orders', align: 'right', render: (p) => <span className="adm-num">{num(p.orders)}</span>, sortValue: (p) => p.orders },
    { key: 'units', header: 'Units', align: 'right', render: (p) => <span className="adm-num">{num(p.units)}</span>, sortValue: (p) => p.units },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      nowrap: true,
      render: (p) => <span className="adm-num adm-cell-primary">{money(p.revenue)}</span>,
      sortValue: (p) => p.revenue,
    },
  ]

  const categoryColumns: Column<CategorySalesRow>[] = [
    {
      key: 'category',
      header: 'Category',
      render: (c) => <span className="adm-cell-primary">{c.category}</span>,
      sortValue: (c) => c.category,
    },
    {
      key: 'type',
      header: 'Line',
      render: (c) => <Badge tone="neutral" dotColor={TYPE_COLORS[c.type]}>{c.type === 'jerseys' ? 'Jerseys' : 'Shoes'}</Badge>,
    },
    { key: 'units', header: 'Units', align: 'right', render: (c) => <span className="adm-num">{num(c.units)}</span>, sortValue: (c) => c.units },
    { key: 'share', header: 'Share', align: 'right', render: (c) => <span className="adm-num">{pct(c.share, 1)}</span>, sortValue: (c) => c.share },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      nowrap: true,
      render: (c) => <span className="adm-num adm-cell-primary">{money(c.revenue)}</span>,
      sortValue: (c) => c.revenue,
    },
  ]

  const exportButton = (onClick: () => void, label = 'Export CSV') => (
    <button type="button" className="adm-btn adm-btn--sm" onClick={onClick} disabled={empty}>
      <Download size={14} aria-hidden="true" /> {label}
    </button>
  )

  return (
    <div className="adm-stack">
      <PageHeader
        title="Sales Reports"
        subtitle={describeRange(range)}
        actions={
          <>
            <button type="button" className="adm-btn adm-btn--primary" onClick={exportOrders} disabled={empty}>
              <Download size={15} aria-hidden="true" /> Export order lines
            </button>
          </>
        }
      />

      

      <div className="adm-filter-row">
        <SegmentedControl label="Report period" value={preset} onChange={setPreset} options={REPORT_PRESETS} />
        {preset === 'custom' && (
          <div className="adm-date-inputs">
            <label className="adm-sr-only" htmlFor="report-from">
              From
            </label>
            <input
              id="report-from"
              type="date"
              className="adm-input"
              value={custom.from}
              max={custom.to}
              onChange={(e) => e.target.value && setCustom((c) => ({ ...c, from: e.target.value }))}
            />
            <span className="adm-muted">to</span>
            <label className="adm-sr-only" htmlFor="report-to">
              To
            </label>
            <input
              id="report-to"
              type="date"
              className="adm-input"
              value={custom.to}
              min={custom.from}
              onChange={(e) => e.target.value && setCustom((c) => ({ ...c, to: e.target.value }))}
            />
          </div>
        )}
      </div>

      <div className="adm-grid adm-grid--metrics adm-grid--4">
        <MetricCard label="Total sales" value={`${num(summary.units)} units`} icon={Package} hint="Items sold in the period" />
        <MetricCard label="Revenue" value={money(summary.revenue)} icon={CircleDollarSign} hint="Order totals" />
        <MetricCard label="Orders" value={num(summary.orders)} icon={ShoppingBag} hint="Orders placed" />
        <MetricCard
          label="Average order value"
          value={summary.orders ? money(summary.averageOrderValue) : '—'}
          icon={Receipt}
          hint="Revenue ÷ orders"
        />
      </div>

      {empty ? (
        <Card>
          <EmptyState
            icon={ChartColumn}
            title="No orders in this period"
            text="The demo orders fall between their earliest and latest dates — choose “All time” or widen the custom range."
          />
        </Card>
      ) : (
        <>
          <div className="adm-grid adm-grid--1-1">
            <Card title="Sales trend" subtitle={report.granularity === 'day' ? 'Daily revenue' : 'Monthly revenue'}>
              <RevenueAreaChart data={report.series} height={260} />
            </Card>
            <Card title="Revenue by product line" subtitle={report.granularity === 'day' ? 'Per day' : 'Per month'}>
              <SalesBarChart data={report.series} height={260} />
            </Card>
          </div>

          <Card title="Revenue by date" subtitle="Days with at least one order" flush actions={exportButton(exportDaily)}>
            <DataTable
              caption="Revenue by date"
              columns={dailyColumns}
              rows={report.daily}
              rowKey={(d) => d.date}
              defaultSort={{ key: 'date', dir: 'desc' }}
            />
          </Card>

          <div className="adm-grid adm-grid--2-1">
            <Card title="Best-selling products" subtitle="Ranked by line revenue" flush actions={exportButton(exportProducts)}>
              <DataTable
                caption="Best-selling products"
                columns={productColumns}
                rows={report.products}
                rowKey={(p) => p.slug}
                defaultSort={{ key: 'revenue', dir: 'desc' }}
              />
            </Card>
            <Card title="Sales by category" subtitle="Catalog category of each sold product" actions={exportButton(exportCategories)}>
              <BarList
                items={report.categories.map((c) => ({
                  key: c.category,
                  name: c.category,
                  meta: `${num(c.units)} unit${c.units === 1 ? '' : 's'} · ${pct(c.share, 1)}`,
                  value: c.revenue,
                  valueLabel: money(c.revenue, { compact: true }),
                  color: TYPE_COLORS[c.type],
                }))}
              />
            </Card>
          </div>

          <Card title="Category breakdown" flush>
            <DataTable
              caption="Category breakdown"
              columns={categoryColumns}
              rows={report.categories}
              rowKey={(c) => c.category}
              defaultSort={{ key: 'revenue', dir: 'desc' }}
            />
          </Card>
        </>
      )}
    </div>
  )
}

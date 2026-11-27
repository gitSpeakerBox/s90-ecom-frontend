import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import type { OrderStatus } from '../../../shared/types/order'
import { ORDER_STATUS_META } from '../../utils/status'
import { num, pct } from '../../utils/format'
import { ChartDataTable, ChartTooltip } from './ChartParts'

interface StatusDonutProps {
  data: { status: OrderStatus; count: number }[]
}

/** Orders by fulfilment status. Segments separated by a 2px surface gap; list doubles as legend. */
export function StatusDonut({ data }: StatusDonutProps) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const slices = data.filter((d) => d.count > 0).map((d) => ({ ...d, name: ORDER_STATUS_META[d.status].label }))

  return (
    <div className="adm-donut-wrap">
    <div className="adm-chart adm-donut">
      <div className="adm-donut__chart">
        <PieChart width={180} height={180}>
          <Pie
            data={slices}
            dataKey="count"
            nameKey="name"
            innerRadius={60}
            outerRadius={86}
            startAngle={90}
            endAngle={-270}
            stroke="#ffffff"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {slices.map((s) => (
              <Cell key={s.status} fill={ORDER_STATUS_META[s.status].color} />
            ))}
          </Pie>
          <Tooltip
            content={<ChartTooltip valueFormatter={(v) => `${num(v)} order${v === 1 ? '' : 's'} · ${pct(v / (total || 1))}`} />}
          />
        </PieChart>
        <div className="adm-donut__center">
          <span className="adm-donut__total adm-num">{num(total)}</span>
          <span className="adm-donut__caption">orders</span>
        </div>
      </div>
      <ul className="adm-donut__list" aria-label="Orders by status">
        {data.map((d) => (
          <li key={d.status}>
            <span
              className="adm-chart-legend__key"
              style={{ background: ORDER_STATUS_META[d.status].color }}
              aria-hidden="true"
            />
            <span>{ORDER_STATUS_META[d.status].label}</span>
            <span className="adm-num" style={{ fontWeight: 600 }}>
              {num(d.count)}
            </span>
            <span className="adm-donut__pct adm-num">{total ? pct(d.count / total) : '—'}</span>
          </li>
        ))}
      </ul>
      <ChartDataTable
        caption="Orders by status"
        headers={['Status', 'Orders']}
        rows={data.map((d) => [d.status, d.count])}
      />
    </div>
    </div>
  )
}

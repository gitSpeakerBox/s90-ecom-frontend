import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SeriesPoint } from '../../types/admin'
import { num } from '../../utils/format'
import { BASE_REVENUE_CURRENCY, formatConverted } from '../../utils/revenueCurrency'
import type { RevenueCurrency } from '../../utils/revenueCurrency'
import { ChartDataTable, ChartLegend, ChartTooltip } from './ChartParts'
import { AXIS_TICK, GRID_STROKE } from './chartTheme'

const REVENUE_COLOR = '#2a78d6'

interface RevenueAreaChartProps {
  /** Series values must already be in `currency` (converted once from base by the caller). */
  data: SeriesPoint[]
  height?: number
  /** Display currency for axes, tooltips and legends. Defaults to the QAR base. */
  currency?: RevenueCurrency
}

/** Revenue over time — single series, crosshair tooltip with order count. */
export function RevenueAreaChart({ data, height = 280, currency = BASE_REVENUE_CURRENCY }: RevenueAreaChartProps) {
  return (
    <div className="adm-chart">
      <ChartLegend items={[{ label: `Revenue (${currency}, order totals)`, color: REVENUE_COLOR }]} />
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: GRID_STROKE }}
            minTickGap={24}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={72}
            tickFormatter={(v: number) => formatConverted(v, currency, { compact: true, axis: true })}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: '#b9b8b3', strokeWidth: 1, strokeDasharray: '3 3' }}
            content={
              <ChartTooltip
                valueFormatter={(v) => formatConverted(v, currency)}
                footer={(d) => {
                  const p = d as SeriesPoint
                  return `${num(p.orders)} order${p.orders === 1 ? '' : 's'}`
                }}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke={REVENUE_COLOR}
            strokeWidth={2}
            fill={REVENUE_COLOR}
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <ChartDataTable
        caption="Revenue by period"
        headers={['Period', `Revenue (${currency})`, 'Orders']}
        rows={data.filter((d) => d.orders > 0).map((d) => [d.label, d.revenue, d.orders])}
      />
    </div>
  )
}

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SeriesPoint } from '../../types/admin'
import { BASE_REVENUE_CURRENCY, formatConverted } from '../../utils/revenueCurrency'
import type { RevenueCurrency } from '../../utils/revenueCurrency'
import { TYPE_COLORS } from '../../utils/status'
import { ChartDataTable, ChartLegend, ChartTooltip } from './ChartParts'
import { AXIS_TICK, GRID_STROKE } from './chartTheme'

interface SalesBarChartProps {
  /** Series values must already be in `currency` (converted once from base by the caller). */
  data: SeriesPoint[]
  height?: number
  /** Display currency for axes, tooltips and legends. Defaults to the QAR base. */
  currency?: RevenueCurrency
}

/** Line-item revenue per period, grouped by product line (Jerseys vs Shoes). */
export function SalesBarChart({ data, height = 280, currency = BASE_REVENUE_CURRENCY }: SalesBarChartProps) {
  const totals = data.reduce(
    (acc, d) => ({ jerseys: acc.jerseys + d.jerseys, shoes: acc.shoes + d.shoes }),
    { jerseys: 0, shoes: 0 }
  )
  return (
    <div className="adm-chart">
      <ChartLegend
        items={[
          { label: 'Jerseys', color: TYPE_COLORS.jerseys, value: formatConverted(totals.jerseys, currency, { compact: true }) },
          { label: 'Shoes', color: TYPE_COLORS.shoes, value: formatConverted(totals.shoes, currency, { compact: true }) },
        ]}
      />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2} barCategoryGap="22%">
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: GRID_STROKE }}
            minTickGap={16}
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
            cursor={{ fill: 'rgba(17,17,17,0.04)' }}
            content={<ChartTooltip valueFormatter={(v) => formatConverted(v, currency)} />}
          />
          <Bar
            dataKey="jerseys"
            name="Jerseys"
            fill={TYPE_COLORS.jerseys}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
          <Bar
            dataKey="shoes"
            name="Shoes"
            fill={TYPE_COLORS.shoes}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
      <ChartDataTable
        caption="Sales by product line per period"
        headers={['Period', `Jerseys (${currency})`, `Shoes (${currency})`]}
        rows={data.filter((d) => d.orders > 0).map((d) => [d.label, d.jerseys, d.shoes])}
      />
    </div>
  )
}

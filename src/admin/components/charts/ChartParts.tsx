import type { ReactNode } from 'react'
import './charts.css'

interface TooltipEntry {
  name?: string | number
  value?: unknown
  color?: string
  dataKey?: unknown
  payload?: unknown
}

interface ChartTooltipProps {
  active?: boolean
  payload?: ReadonlyArray<TooltipEntry>
  label?: string | number
  valueFormatter: (value: number) => string
  /** Optional extra line from the hovered datum. */
  footer?: (datum: unknown) => ReactNode
}

/** Tooltip body: label, then one row per series (colour key + name + value). */
export function ChartTooltip({ active, payload, label, valueFormatter, footer }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const datum = payload[0]?.payload
  return (
    <div className="adm-chart-tooltip">
      {label !== undefined && label !== '' && <div className="adm-chart-tooltip__label">{label}</div>}
      {payload.map((entry, i) => (
        <div key={`${String(entry.dataKey ?? entry.name)}-${i}`} className="adm-chart-tooltip__row">
          <span className="adm-chart-tooltip__key" style={{ background: entry.color }} aria-hidden="true" />
          <span className="adm-chart-tooltip__name">{entry.name}</span>
          <span className="adm-chart-tooltip__value adm-num">{valueFormatter(Number(entry.value ?? 0))}</span>
        </div>
      ))}
      {footer && <div className="adm-chart-tooltip__footer">{footer(datum)}</div>}
    </div>
  )
}

export interface LegendItem {
  label: string
  color: string
  value?: string
}

export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="adm-chart-legend">
      {items.map((item) => (
        <li key={item.label}>
          <span className="adm-chart-legend__key" style={{ background: item.color }} aria-hidden="true" />
          <span>{item.label}</span>
          {item.value && <span className="adm-chart-legend__value adm-num">{item.value}</span>}
        </li>
      ))}
    </ul>
  )
}

/** Visually hidden table equivalent of a chart for screen-reader users. */
export function ChartDataTable({
  caption,
  headers,
  rows,
}: {
  caption: string
  headers: string[]
  rows: Array<Array<string | number>>
}) {
  return (
    <table className="adm-sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} scope="col">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

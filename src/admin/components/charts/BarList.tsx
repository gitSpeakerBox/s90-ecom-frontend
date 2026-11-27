import type { ReactNode } from 'react'
import './charts.css'

export interface BarListItem {
  key: string
  name: string
  meta?: string
  value: number
  valueLabel: string
  color: string
  leading?: ReactNode
}

/**
 * Ranked horizontal bars in plain HTML — used for top products and category
 * breakdowns where a label + value + proportional bar reads better than a plot.
 */
export function BarList({ items, ranked }: { items: BarListItem[]; ranked?: boolean }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <ol className="adm-barlist">
      {items.map((item, idx) => (
        <li key={item.key} className="adm-barlist__item">
          {ranked ? <span className="adm-barlist__rank adm-num">{idx + 1}</span> : (item.leading ?? <span />)}
          <div className="adm-barlist__body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              {ranked && item.leading}
              <div style={{ minWidth: 0 }}>
                <div className="adm-barlist__name" title={item.name}>
                  {item.name}
                </div>
                {item.meta && <div className="adm-barlist__meta">{item.meta}</div>}
              </div>
            </div>
            <div className="adm-barlist__track" aria-hidden="true">
              <div
                className="adm-barlist__fill"
                style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, background: item.color }}
              />
            </div>
          </div>
          <span className="adm-barlist__value adm-num">{item.valueLabel}</span>
        </li>
      ))}
    </ol>
  )
}

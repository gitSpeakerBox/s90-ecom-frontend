import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import './MetricCard.css'

interface MetricCardProps {
  label: string
  /** Display value. A leading currency code ("QAR 1,200.00") is shown as a smaller unit. */
  value: string
  icon: LucideIcon
  /** Context line under the value, e.g. the period or the definition. */
  hint?: string
  /** Tooltip for the hint line. */
  hintTitle?: string
  /** Optional compact control (e.g. a currency select) shown in place of the icon. */
  action?: ReactNode
}

export function MetricCard({ label, value, icon: Icon, hint, hintTitle, action }: MetricCardProps) {
  const currency = /^([A-Z]{3}) (.+)$/.exec(value)
  return (
    <div className="adm-metric">
      <div className="adm-metric__top">
        <span className="adm-metric__label">{label}</span>
        {action ?? (
          <span className="adm-metric__icon" aria-hidden="true">
            <Icon size={16} strokeWidth={1.8} />
          </span>
        )}
      </div>
      <div className="adm-metric__value adm-num" aria-live={action ? 'polite' : undefined}>
        {currency ? (
          <>
            <span className="adm-metric__unit">{currency[1]}</span>
            {currency[2]}
          </>
        ) : (
          value
        )}
      </div>
      {hint && (
        <div className="adm-metric__hint" title={hintTitle}>
          {hint}
        </div>
      )}
    </div>
  )
}

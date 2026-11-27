import type { ReactNode } from 'react'

interface CardProps {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  /** Body without side padding (tables, toolbars). */
  flush?: boolean
  className?: string
  children: ReactNode
}

export function Card({ title, subtitle, actions, footer, flush, className = '', children }: CardProps) {
  return (
    <section className={`adm-card ${className}`}>
      {(title || actions) && (
        <div className="adm-card__header">
          <div>
            {title && <h2 className="adm-card__title">{title}</h2>}
            {subtitle && <p className="adm-card__subtitle">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={flush ? 'adm-card__body--flush' : 'adm-card__body'}>{children}</div>
      {footer && <div className="adm-card__footer">{footer}</div>}
    </section>
  )
}

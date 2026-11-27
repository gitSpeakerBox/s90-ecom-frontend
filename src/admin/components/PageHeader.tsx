import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="adm-page-header">
      <div>
        <h1 className="adm-page-title">{title}</h1>
        {subtitle && <p className="adm-page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="adm-page-actions">{actions}</div>}
    </header>
  )
}

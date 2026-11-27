import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Search } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  text?: ReactNode
  action?: ReactNode
}

export function EmptyState({ icon: Icon = Search, title, text, action }: EmptyStateProps) {
  return (
    <div className="adm-empty">
      <div className="adm-empty__icon" aria-hidden="true">
        <Icon size={20} />
      </div>
      <div className="adm-empty__title">{title}</div>
      {text && <div className="adm-empty__text">{text}</div>}
      {action}
    </div>
  )
}

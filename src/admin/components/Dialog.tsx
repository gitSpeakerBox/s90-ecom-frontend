import { useId } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useDialog } from '../hooks/useDialog'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  footer?: ReactNode
  children: ReactNode
  /** 'modal' centres the dialog; 'drawer' slides in from the right. */
  variant?: 'modal' | 'drawer'
  size?: 'sm' | 'md'
}

export function Dialog({ open, onClose, title, subtitle, footer, children, variant = 'modal', size = 'md' }: DialogProps) {
  const ref = useDialog<HTMLDivElement>(open, onClose)
  const titleId = useId()
  if (!open) return null

  const panelClass =
    variant === 'drawer' ? 'adm-drawer' : `adm-modal ${size === 'sm' ? 'adm-modal--sm' : ''}`

  return (
    <div
      className={`adm-overlay ${variant === 'drawer' ? 'adm-overlay--right' : 'adm-overlay--center'}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div ref={ref} className={panelClass} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="adm-dialog__header">
          <div>
            <h2 id={titleId} className="adm-dialog__title">
              {title}
            </h2>
            {subtitle && <p className="adm-dialog__subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="adm-dialog__body">{children}</div>
        {footer && <div className="adm-dialog__footer">{footer}</div>}
      </div>
    </div>
  )
}

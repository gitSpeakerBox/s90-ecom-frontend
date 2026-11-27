import React from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { useLocale } from '../../context/LocaleContext'
import './Toast.css'

export const Toast: React.FC = () => {
  const { toast, isExiting, hideToast, pauseToast, resumeToast } = useToast()
  const { t, language } = useLocale()

  if ((!toast && !isExiting) || typeof document === 'undefined') {
    return null
  }

  const displayText = toast ? t(toast.message, { defaultValue: toast.message }) : ''
  const isArabic = language === 'ar'

  return createPortal(
    <div
      className={`s90-toast-portal ${isArabic ? 's90-toast-portal--rtl' : 's90-toast-portal--ltr'}`}
      dir={isArabic ? 'rtl' : 'ltr'}
      aria-hidden={!toast && isExiting}
    >
      {displayText && (
        <div
          className={`s90-toast ${isExiting ? 'is-exiting' : ''}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          onMouseEnter={pauseToast}
          onMouseLeave={resumeToast}
        >
          <div className="s90-toast-content">
            <span className="s90-toast-icon-badge" aria-hidden="true">
              <Check size={12} strokeWidth={3} />
            </span>
            <span className="s90-toast-message">{displayText}</span>
          </div>
          <button
            type="button"
            className="s90-toast-close-btn"
            onClick={hideToast}
            aria-label={t('toast.close', { defaultValue: 'Close' })}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>,
    document.body
  )
}


import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, X } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import './RemoveItemModal.css'

export interface RemoveItemModalProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  triggerElement?: HTMLElement | null
  item?: {
    name?: string
    image?: string
    size?: string | null
    price?: string
  }
}

export const RemoveItemModal: React.FC<RemoveItemModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  triggerElement,
  item,
}) => {
  const { t } = useLocale()
  const [isActive, setIsActive] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shouldRender = isOpen || isClosing

  // Smooth close handler with animation
  const handleClose = useCallback(() => {
    setIsActive(false)
    setIsClosing(true)

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = prefersReduced ? 0 : 200

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => {
      setIsClosing(false)
      onCancel()

      // Return focus to trigger element if available
      if (triggerElement) {
        try {
          triggerElement.focus()
        } catch {
          // ignore
        }
      }
    }, duration)
  }, [onCancel, triggerElement])

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setIsActive(false)
    setIsClosing(false)
    onConfirm()
  }, [onConfirm])

  // Trigger enter animation on open
  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsActive(true)
        })
      })
      return () => cancelAnimationFrame(id)
    }
  }, [isOpen])

  // Body scroll lock
  useEffect(() => {
    if (!isActive) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isActive])

  // Keyboard navigation: Escape key to close, Tab trap, and initial focus on Cancel
  useEffect(() => {
    if (!isActive) return

    // Focus cancel button on open for safe keyboard UX
    if (cancelBtnRef.current) {
      cancelBtnRef.current.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
        return
      }

      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, handleClose])

  if (!shouldRender || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className={`remove-item-portal ${isActive ? 'is-active' : ''}`}
      aria-hidden={!isActive}
    >
      {/* Dark overlay backdrop */}
      <div
        className={`remove-item-backdrop ${isActive ? 'is-visible' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Confirmation Modal Card */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="remove-item-title"
        aria-describedby="remove-item-message"
        className={`remove-item-modal ${isActive ? 'is-open' : ''}`}
      >
        <button
          type="button"
          className="remove-item-close-btn"
          onClick={handleClose}
          aria-label={t('quickAdd.close', { defaultValue: 'Close' })}
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="remove-item-icon-badge" aria-hidden="true">
          <Trash2 size={22} strokeWidth={1.75} />
        </div>

        <h2 id="remove-item-title" className="remove-item-title">
          {t('cart.removeConfirmTitle', { defaultValue: 'Remove Item?' })}
        </h2>

        <p id="remove-item-message" className="remove-item-message">
          {t('cart.removeConfirmMessage', {
            defaultValue:
              'Are you sure you want to remove this item from your cart?',
          })}
        </p>

        {item && item.name && (
          <div className="remove-item-preview">
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="remove-item-thumb"
              />
            )}
            <div className="remove-item-preview-details">
              <span className="remove-item-preview-name">{item.name}</span>
              <div className="remove-item-preview-meta">
                {item.size && (
                  <span className="remove-item-preview-size">{item.size}</span>
                )}
                {item.price && (
                  <span className="remove-item-preview-price">{item.price}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="remove-item-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            className="remove-item-btn remove-item-btn-cancel"
            onClick={handleClose}
          >
            {t('cart.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            type="button"
            className="remove-item-btn remove-item-btn-confirm"
            onClick={handleConfirm}
          >
            {t('cart.confirmRemove', { defaultValue: 'Yes, Remove' })}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

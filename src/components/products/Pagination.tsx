import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import { formatPaginationNumber } from '../../utils/formatters'
import './Pagination.css'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  ariaLabel?: string
  scrollTargetId?: string
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  ariaLabel,
  scrollTargetId = 'catalog-grid',
}) => {
  const { t, language } = useLocale()

  if (totalPages <= 1) {
    return null
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
      if (scrollTargetId) {
        const grid = document.getElementById(scrollTargetId)
        if (grid) {
          grid.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }

  const prevLabel = t('pagination.previous', { defaultValue: 'Previous' })
  const nextLabel = t('pagination.next', { defaultValue: 'Next' })

  return (
    <nav
      className={`catalog-pagination ${className || ''}`.trim()}
      aria-label={ariaLabel || t('pagination.ariaLabel', { defaultValue: 'Catalog Pagination' })}
    >
      <button
        type="button"
        className="pagination-arrow-btn"
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label={prevLabel}
        title={prevLabel}
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      <div className="pagination-pages-group">
        {pages.map((pageNum) => {
          const displayNum = formatPaginationNumber(pageNum, language)
          return (
            <button
              key={pageNum}
              type="button"
              className={`pagination-page-btn ${pageNum === currentPage ? 'active' : ''}`}
              onClick={() => handlePageClick(pageNum)}
              aria-label={t('pagination.page', {
                page: displayNum,
                defaultValue: `Page ${displayNum}`,
              })}
              aria-current={pageNum === currentPage ? 'page' : undefined}
            >
              {displayNum}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className="pagination-arrow-btn"
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label={nextLabel}
        title={nextLabel}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  )
}



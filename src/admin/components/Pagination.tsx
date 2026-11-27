import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationState } from '../hooks/usePagination'

const PAGE_SIZES = [5, 10, 25, 50]

/** Page list with ellipses: 1 … 4 5 6 … 12 */
function pageList(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: Array<number | 'gap'> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('gap')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < total - 1) pages.push('gap')
  pages.push(total)
  return pages
}

interface PaginationProps<T> {
  state: PaginationState<T>
  noun?: string
  /** Show the rows-per-page selector (default true). Pass false for a fixed page size. */
  showPageSize?: boolean
  /** Also show "Page X of Y" (default false). */
  showPageCount?: boolean
}

export function Pagination<T>({ state, noun = 'results', showPageSize = true, showPageCount = false }: PaginationProps<T>) {
  const { page, pageSize, totalPages, total, setPage, setPageSize } = state
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <nav className="adm-pagination" aria-label="Pagination">
      <span className="adm-num">
        Showing {from}–{to} of {total} {noun}
        {showPageCount && (
          <span className="adm-pagination__pagecount">
            {' '}
            · Page {page} of {totalPages}
          </span>
        )}
      </span>
      <div className="adm-pagination__pages">
        <button
          type="button"
          className="adm-icon-btn"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {pageList(page, totalPages).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="adm-muted" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className="adm-pagination__page"
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Page ${p}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className="adm-icon-btn"
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      {showPageSize && (
      <label className="adm-pagination__size">
        Rows
        <select
          className="adm-select"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          aria-label="Rows per page"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      )}
    </nav>
  )
}

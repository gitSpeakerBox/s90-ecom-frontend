import { useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { sortRows } from '../utils/table'
import type { Column, SortState } from '../utils/table'

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string
  empty?: ReactNode
  caption?: string
  /** Initial sort when sorting is internal. */
  defaultSort?: SortState
  /** Controlled sort: the parent sorts (before paginating) and passes rows in order. */
  sortState?: SortState | null
  onSortChange?: (sort: SortState) => void
}

/**
 * Reusable data table. Rows are keyboard-reachable when clickable (Enter/Space
 * opens). Sorting is either internal or controlled via sortState/onSortChange.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  rowClassName,
  empty,
  caption,
  defaultSort,
  sortState,
  onSortChange,
}: DataTableProps<T>) {
  const [internalSort, setInternalSort] = useState<SortState | null>(defaultSort ?? null)
  const controlled = sortState !== undefined
  const sort = controlled ? sortState : internalSort
  const sorted = controlled ? rows : sortRows(rows, columns, sort)

  const toggleSort = (key: string) => {
    const next: SortState =
      sort?.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }
    if (controlled) onSortChange?.(next)
    else setInternalSort(next)
  }

  const alignClass = (a?: Column<T>['align']) => (a === 'right' ? 'is-right' : a === 'center' ? 'is-center' : '')

  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        {caption && <caption className="adm-sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => {
              const active = sort?.key === col.key
              const ariaSort = active ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : undefined
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={alignClass(col.align)}
                  style={col.width ? { width: col.width } : undefined}
                  aria-sort={ariaSort}
                >
                  {col.hideHeader ? (
                    <span className="adm-sr-only">{col.header}</span>
                  ) : col.sortValue ? (
                    <button type="button" onClick={() => toggleSort(col.key)}>
                      {col.header}
                      {active ? (
                        sort?.dir === 'asc' ? (
                          <ArrowUp size={12} aria-hidden="true" />
                        ) : (
                          <ArrowDown size={12} aria-hidden="true" />
                        )
                      ) : (
                        <ChevronsUpDown size={12} aria-hidden="true" opacity={0.5} />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr
                key={rowKey(row)}
                className={`${onRowClick ? 'is-clickable' : ''} ${rowClassName?.(row) ?? ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
                          e.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`${alignClass(col.align)} ${col.nowrap ? 'is-nowrap' : ''}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

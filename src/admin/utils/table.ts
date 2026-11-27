import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number
  nowrap?: boolean
  width?: number | string
  /** Visually hide the header text (e.g. actions column). */
  hideHeader?: boolean
}

export interface SortState {
  key: string
  dir: 'asc' | 'desc'
}

/** Sorts rows with a column's sortValue. Pages sort before paginating. */
export function sortRows<T>(rows: T[], columns: Column<T>[], sort: SortState | null): T[] {
  if (!sort) return rows
  const col = columns.find((c) => c.key === sort.key)
  if (!col?.sortValue) return rows
  const get = col.sortValue
  const factor = sort.dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const va = get(a)
    const vb = get(b)
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor
    return String(va).localeCompare(String(vb)) * factor
  })
}

/** Stops row-click handling for interactive cells (buttons, toggles, links). */
export function stop(e: { stopPropagation: () => void }) {
  e.stopPropagation()
}

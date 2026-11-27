import { useMemo, useState } from 'react'

export interface PaginationState<T> {
  page: number
  pageSize: number
  totalPages: number
  total: number
  pageItems: T[]
  setPage: (page: number) => void
  setPageSize: (size: number) => void
}

/**
 * Client-side pagination. The page is clamped whenever the filtered list
 * shrinks, so changing a filter never leaves the user on an empty page.
 */
export function usePagination<T>(items: T[], initialPageSize = 10): PaginationState<T> {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(initialPageSize)
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)

  const pageItems = useMemo(
    () => items.slice((current - 1) * pageSize, current * pageSize),
    [items, current, pageSize]
  )

  return {
    page: current,
    pageSize,
    totalPages,
    total,
    pageItems,
    setPage,
    setPageSize: (size: number) => {
      setPageSizeState(size)
      setPage(1)
    },
  }
}

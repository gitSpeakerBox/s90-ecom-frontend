import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Admin data context.
 *
 * Admin services read and write the existing storefront data modules directly
 * (in memory). Because those are plain module objects, React cannot observe
 * them, so every write goes through `commit()`, which bumps `revision` —
 * pages recompute their views from the source data on each revision.
 */

interface Notice {
  id: number
  message: string
}

interface AdminDataContextValue {
  revision: number
  commit: (mutation: () => void, message?: string) => void
  notice: Notice | null
  dismissNotice: () => void
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null)

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0)
  const [notice, setNotice] = useState<Notice | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const commit = useCallback((mutation: () => void, message?: string) => {
    mutation()
    setRevision((r) => r + 1)
    if (message) {
      setNotice({ id: Date.now(), message })
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setNotice(null), 3600)
    }
  }, [])

  const dismissNotice = useCallback(() => setNotice(null), [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const value = useMemo(
    () => ({ revision, commit, notice, dismissNotice }),
    [revision, commit, notice, dismissNotice]
  )
  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useAdminData(): AdminDataContextValue {
  const ctx = useContext(AdminDataContext)
  if (!ctx) throw new Error('useAdminData must be used inside <AdminDataProvider>')
  return ctx
}

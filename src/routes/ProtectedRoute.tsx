import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Route wrapper that ensures only authenticated users can access the route.
 * Redirects unauthenticated users to /login, preserving the requested destination
 * in location state so they are automatically returned upon successful login.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    )
  }

  return <>{children}</>
}

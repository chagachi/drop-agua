import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { ProtectedRoute } from './ProtectedRoute'

export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <RequireAdmin>{children}</RequireAdmin>
    </ProtectedRoute>
  )
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth()

  if (loading) return null
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

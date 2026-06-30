import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <div className="page-loading">Carregando...</div>
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

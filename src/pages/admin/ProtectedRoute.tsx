import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ color: 'var(--text-muted)' }}>
        Loading…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}
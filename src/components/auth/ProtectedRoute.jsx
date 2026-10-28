import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../ui/States'

/** Only renders children for the signed-in admin. Real enforcement is RLS in the database. */
export default function ProtectedRoute({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return <Spinner label="Checking session…" />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

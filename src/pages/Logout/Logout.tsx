import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export function Logout() {
  useEffect(() => {
    supabase.auth.signOut()
  }, [])

  return <Navigate to="/" replace />
}

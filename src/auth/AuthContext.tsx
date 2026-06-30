import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../types/database'

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  deactivated: boolean
}

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  profile: null,
  loading: true,
  isAdmin: false,
  deactivated: false,
})

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) {
    console.error('Falha ao carregar perfil:', error.message)
    return null
  }
  return data
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [deactivated, setDeactivated] = useState(false)

  useEffect(() => {
    let mounted = true

    async function handleSession(session: Session | null) {
      if (!mounted) return
      setSession(session)

      if (!session) {
        setProfile(null)
        setLoading(false)
        return
      }

      const fetched = await fetchProfile(session.user.id)
      if (!mounted) return

      if (fetched && !fetched.is_active) {
        setDeactivated(true)
        setProfile(null)
        setSession(null)
        setLoading(false)
        await supabase.auth.signOut()
        return
      }

      setProfile(fetched)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => handleSession(session))

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const isAdmin = profile?.is_admin === true

  return (
    <AuthContext.Provider value={{ session, profile, loading, isAdmin, deactivated }}>
      {children}
    </AuthContext.Provider>
  )
}

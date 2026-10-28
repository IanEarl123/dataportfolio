import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ADMIN_EMAIL } from '../lib/constants'

const AuthContext = createContext(null)

const isAdminEmail = (email) => (email || '').trim().toLowerCase() === ADMIN_EMAIL

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Any session that isn't the admin is signed out immediately.
  useEffect(() => {
    if (session && !isAdminEmail(session.user?.email)) supabase.auth.signOut()
  }, [session])

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured yet. Add your keys to .env.local.')
    // Same message for wrong email and wrong password so the form leaks nothing.
    if (!isAdminEmail(email)) throw new Error('Invalid login credentials.')

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new Error(error.message || 'Invalid login credentials.')
    if (!isAdminEmail(data.user?.email)) {
      await supabase.auth.signOut()
      throw new Error('Invalid login credentials.')
    }
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAdmin: isAdminEmail(session?.user?.email),
      loading,
      signIn,
      signOut,
    }),
    [session, loading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

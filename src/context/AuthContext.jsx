import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile, flushPendingProfile } from '../services/userData'

const AuthContext = createContext({
  session: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signIn: async () => {},
  signInWithMagicLink: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async (sess) => {
    const s = sess ?? session
    if (!s?.user) {
      setProfile(null)
      return
    }
    try {
      const p = await getProfile(s.user.id)
      setProfile(p)
    } catch {
      setProfile(null)
    }
  }, [session])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      refreshProfile(data.session).finally(() => setLoading(false))
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, sess) => {
      setSession(sess)
      if (event === 'SIGNED_IN' && sess?.user) {
        // A quiz completed before email confirmation leaves a pending profile.
        const flushed = await flushPendingProfile(sess.user.id)
        await refreshProfile(sess)
        if (flushed) await refreshProfile(sess)
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
      }
    })
    return () => sub.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signInWithMagicLink = (email) =>
    supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile, signIn, signInWithMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

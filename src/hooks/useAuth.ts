import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')

    if (code) {
      // Exchange the verification / OAuth code for a real session
      supabase.auth.exchangeCodeForSession(code).then(({ data }) => {
        setUser(data.session?.user ?? null)
        setLoading(false)
        // Remove the code from the URL so refreshing doesn't re-run the exchange
        window.history.replaceState({}, '', window.location.pathname)
      }).catch(() => setLoading(false))
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }).catch(() => setLoading(false))
    }

    // Safety net: never spin forever (e.g. Supabase env vars missing in prod)
    const timeout = setTimeout(() => setLoading(false), 8000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') setIsRecovery(false)
    })

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })
    return error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    return error
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) setIsRecovery(false)
    return error
  }

  return { user, loading, isRecovery, signIn, signUp, signOut, resetPassword, updatePassword }
}

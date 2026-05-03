import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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
      })
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
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

  return { user, loading, signIn, signUp, signOut }
}

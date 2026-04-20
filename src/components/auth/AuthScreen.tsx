import { useState } from 'react'
import type { AuthError } from '@supabase/supabase-js'

interface Props {
  onSignIn: (email: string, password: string) => Promise<AuthError | null>
  onSignUp: (email: string, password: string) => Promise<AuthError | null>
}

export function AuthScreen({ onSignIn, onSignUp }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(m: 'login' | 'register') {
    setMode(m)
    setError('')
    setMessage('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'login') {
      const err = await onSignIn(email, password)
      if (err) setError(err.message)
    } else {
      const err = await onSignUp(email, password)
      if (err) setError(err.message)
      else setMessage('Account created! Check your email to confirm, then log in.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-100 grid place-items-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="h-10 w-10 rounded-2xl bg-zinc-900 text-white grid place-items-center font-bold text-base">
            FF
          </span>
          <div>
            <h1 className="text-xl font-semibold leading-tight">FocusFlow</h1>
            <p className="text-xs text-zinc-500">Daily checklist, simplified</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex rounded-xl bg-zinc-100 p-1 mb-6 gap-1">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={
                  'flex-1 py-1.5 text-sm rounded-lg transition ' +
                  (mode === m ? 'bg-white shadow-sm font-medium' : 'text-zinc-600 hover:bg-white/60')
                }
              >
                {m === 'login' ? 'Log in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Password</label>
              <input
                type="password"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}
            {message && (
              <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

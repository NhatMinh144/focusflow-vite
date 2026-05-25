import { useState } from 'react'
import type { AuthError } from '@supabase/supabase-js'
import { Alert, Button, Card, Form } from '@heroui/react'

interface Props {
  onSignIn: (email: string, password: string) => Promise<AuthError | null>
  onSignUp: (email: string, password: string) => Promise<AuthError | null>
  onResetPassword: (email: string) => Promise<AuthError | null>
}

type Mode = 'login' | 'register' | 'forgot'

export function AuthScreen({ onSignIn, onSignUp, onResetPassword }: Props) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(m: Mode) {
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
    } else if (mode === 'register') {
      const err = await onSignUp(email, password)
      if (err) setError(err.message)
      else setMessage('Account created! Check your email to confirm, then log in.')
    } else {
      const err = await onResetPassword(email)
      if (err) setError(err.message)
      else setMessage('Reset link sent! Check your inbox and click the link to set a new password.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen grid place-items-center p-4" style={{ background: '#f0f4f9' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="h-10 w-10 rounded-2xl bg-blue-600 text-white grid place-items-center font-bold text-base shadow-sm">
            FF
          </span>
          <div>
            <h1 className="text-xl font-semibold leading-tight text-slate-900">FocusFlow</h1>
            <p className="text-xs text-slate-400">Daily planner, simplified</p>
          </div>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <Card.Content className="p-6">
            {mode !== 'forgot' ? (
              <>
                {/* Mode toggle */}
                <div className="flex rounded-xl bg-slate-100 p-1 mb-6 gap-1">
                  {(['login', 'register'] as const).map((m) => (
                    <Button
                      key={m}
                      variant="ghost"
                      size="sm"
                      onPress={() => switchMode(m)}
                      className={
                        'flex-1 rounded-lg text-sm ' +
                        (mode === m ? 'bg-white shadow-sm font-semibold' : 'text-slate-500')
                      }
                    >
                      {m === 'login' ? 'Log in' : 'Create account'}
                    </Button>
                  ))}
                </div>

                {/* Auth form */}
                <Form onSubmit={handleSubmit} className="grid gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">Password</label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
                    />
                  </div>

                  {error && (
                    <Alert status="danger">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Description>{error}</Alert.Description>
                      </Alert.Content>
                    </Alert>
                  )}
                  {message && (
                    <Alert status="success">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Description>{message}</Alert.Description>
                      </Alert.Content>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    isDisabled={loading}
                    className="w-full mt-1"
                  >
                    {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
                  </Button>
                </Form>
              </>
            ) : (
              <>
                {/* Forgot password form */}
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-slate-900">Reset your password</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Enter your email and we'll send you a link to set a new password.
                  </p>
                </div>

                <Form onSubmit={handleSubmit} className="grid gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
                    />
                  </div>

                  {error && (
                    <Alert status="danger">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Description>{error}</Alert.Description>
                      </Alert.Content>
                    </Alert>
                  )}
                  {message && (
                    <Alert status="success">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Description>{message}</Alert.Description>
                      </Alert.Content>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    isDisabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Sending…' : 'Send reset link'}
                  </Button>

                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-sm text-slate-500 hover:text-slate-700 text-center transition-colors"
                  >
                    ← Back to log in
                  </button>
                </Form>
              </>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}

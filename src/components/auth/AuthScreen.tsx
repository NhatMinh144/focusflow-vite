import { useState } from 'react'
import type { AuthError } from '@supabase/supabase-js'
import { Alert, Button, Card, Form, TextField } from '@heroui/react'

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
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="h-10 w-10 rounded-2xl bg-zinc-900 text-white grid place-items-center font-bold text-base">
            FF
          </span>
          <div>
            <h1 className="text-xl font-semibold leading-tight">FocusFlow</h1>
            <p className="text-xs text-muted">Daily checklist, simplified</p>
          </div>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <Card.Content className="p-6">
          {/* Mode toggle */}
          <div className="flex rounded-xl bg-zinc-100 p-1 mb-6 gap-1">
            {(['login', 'register'] as const).map((m) => (
              <Button
                key={m}
                variant="ghost"
                size="sm"
                onPress={() => switchMode(m)}
                className={
                  'flex-1 rounded-lg text-sm ' +
                  (mode === m ? 'bg-white shadow-sm font-semibold' : 'text-muted')
                }
              >
                {m === 'login' ? 'Log in' : 'Create account'}
              </Button>
            ))}
          </div>

          {/* Auth form */}
          <Form onSubmit={handleSubmit} className="grid gap-4">
            <TextField
              label="Email"
              type="email"
              isRequired
              autoComplete="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              className="w-full"
            />

            <TextField
              label="Password"
              type="password"
              isRequired
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              className="w-full"
            />

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
              isLoading={loading}
              className="w-full mt-1"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </Button>
          </Form>
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}

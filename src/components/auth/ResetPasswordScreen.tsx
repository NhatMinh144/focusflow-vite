import { useState } from 'react'
import type { AuthError } from '@supabase/supabase-js'
import { Alert, Button, Card, Form } from '@heroui/react'

interface Props {
  onUpdatePassword: (newPassword: string) => Promise<AuthError | null>
}

export function ResetPasswordScreen({ onUpdatePassword }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const err = await onUpdatePassword(password)
    if (err) setError(err.message)
    setLoading(false)
    // On success, useAuth sets isRecovery = false → App renders the main app automatically
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
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-900">Set a new password</h2>
              <p className="text-sm text-slate-500 mt-1">Choose a strong password for your account.</p>
            </div>

            <Form onSubmit={handleSubmit} className="grid gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">New password</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Confirm password</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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

              <Button
                type="submit"
                variant="primary"
                isDisabled={loading}
                className="w-full mt-1"
              >
                {loading ? 'Saving…' : 'Update password'}
              </Button>
            </Form>
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}

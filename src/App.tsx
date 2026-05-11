import { useState } from 'react'
import { Spinner } from '@heroui/react'
import { useAuth } from './hooks/useAuth'
import { AuthScreen } from './components/auth/AuthScreen'
import { Header, type AppView } from './components/layout/Header'
import { ChecklistApp } from './components/checklist/ChecklistApp'

export default function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth()
  const [view, setView] = useState<AppView>('daily')

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 grid place-items-center">
        <Spinner color="current" />
      </div>
    )
  }

  if (!user) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} />
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <Header email={user.email ?? ''} view={view} setView={setView} onSignOut={signOut} />
      <ChecklistApp user={user} view={view} setView={setView} />
    </div>
  )
}

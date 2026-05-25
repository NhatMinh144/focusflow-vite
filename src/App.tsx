import { useState } from 'react'
import { Spinner } from '@heroui/react'
import { useAuth } from './hooks/useAuth'
import { useColorCodes } from './hooks/useColorCodes'
import { AuthScreen } from './components/auth/AuthScreen'
import { ResetPasswordScreen } from './components/auth/ResetPasswordScreen'
import { Header, type AppView } from './components/layout/Header'
import { ChecklistApp } from './components/checklist/ChecklistApp'

export default function App() {
  const { user, loading, isRecovery, signIn, signUp, signOut, resetPassword, updatePassword } = useAuth()
  const [view, setView] = useState<AppView>('planner')

  const { colorCodes, addColorCode, updateColorCode, deleteColorCode } = useColorCodes(
    user?.id ?? '',
  )

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: '#f0f4f9' }}>
        <Spinner color="current" />
      </div>
    )
  }

  // User clicked the reset-password email link — show the set-new-password form
  if (user && isRecovery) {
    return <ResetPasswordScreen onUpdatePassword={updatePassword} />
  }

  if (!user) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} onResetPassword={resetPassword} />
  }

  return (
    <div className="min-h-screen text-slate-900" style={{ background: '#f0f4f9' }}>
      <Header
        email={user.email ?? ''}
        view={view}
        setView={setView}
        onSignOut={signOut}
        colorCodes={colorCodes}
        onAddColorCode={addColorCode}
        onUpdateColorCode={updateColorCode}
        onDeleteColorCode={deleteColorCode}
      />
      <ChecklistApp
        user={user}
        view={view}
        setView={setView}
        colorCodes={colorCodes}
        onUpdateColorCode={updateColorCode}
      />
    </div>
  )
}

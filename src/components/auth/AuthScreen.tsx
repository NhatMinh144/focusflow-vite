import type { AuthError } from '@supabase/supabase-js'
import { Button, Card } from '@heroui/react'

interface Props {
  onSignInWithGoogle: () => Promise<AuthError | null>
}

export function AuthScreen({ onSignInWithGoogle }: Props) {
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
          <Card.Content className="p-6 flex flex-col gap-5">
            <div className="text-center">
              <h2 className="text-base font-semibold text-slate-900">Chào mừng bạn</h2>
              <p className="text-sm text-slate-500 mt-1">
                Đăng nhập để lưu trữ task và ghi chú của bạn
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full gap-3 py-5 text-sm font-medium border-slate-200 hover:border-slate-300"
              onPress={onSignInWithGoogle}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Tiếp tục với Google
            </Button>

            <p className="text-xs text-slate-400 text-center leading-relaxed">
              Tài khoản Google của bạn chỉ dùng để đăng nhập và lưu dữ liệu.
              Chúng tôi không lưu mật khẩu.
            </p>
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}

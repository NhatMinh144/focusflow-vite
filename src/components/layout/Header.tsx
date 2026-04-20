interface Props {
  email: string
  view: 'daily' | 'monthly'
  setView: (v: 'daily' | 'monthly') => void
  onSignOut: () => void
}

export function Header({ email, view, setView, onSignOut }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-zinc-200">
      <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="h-8 w-8 rounded-2xl bg-zinc-900 text-white grid place-items-center font-bold text-sm">
            FF
          </span>
          <div>
            <h1 className="text-base font-semibold leading-tight">FocusFlow</h1>
            <p className="text-xs text-zinc-500 -mt-0.5 hidden sm:block">Daily checklist</p>
          </div>
        </div>

        <nav className="flex rounded-xl bg-zinc-100 p-1 gap-1">
          {(['daily', 'monthly'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={
                'px-3 py-1.5 text-sm rounded-lg transition capitalize ' +
                (view === v
                  ? 'bg-white shadow-sm font-medium'
                  : 'text-zinc-600 hover:bg-white/60')
              }
            >
              {v}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-400 hidden md:block max-w-[140px] truncate">{email}</span>
          <button
            onClick={onSignOut}
            className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}

import { Button, Tabs } from '@heroui/react'

export type AppView = 'daily' | 'monthly' | 'notes' | 'settings'

interface Props {
  email: string
  view: AppView
  setView: (v: AppView) => void
  onSignOut: () => void
}

export function Header({ email, view, setView, onSignOut }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-zinc-200">
      <div className="mx-auto max-w-3xl flex items-center justify-between px-3 py-2.5 gap-2 sm:gap-3 sm:px-4 sm:py-3">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="h-8 w-8 rounded-2xl bg-zinc-900 text-white grid place-items-center font-bold text-sm">
            FF
          </span>
          <div className="hidden sm:block">
            <h1 className="text-base font-semibold leading-tight">FocusFlow</h1>
            <p className="text-xs text-zinc-400 -mt-0.5">Daily checklist</p>
          </div>
        </div>

        {/* View tabs */}
        <Tabs
          selectedKey={view}
          onSelectionChange={(key) => setView(key as AppView)}
          variant="secondary"
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="View">
              <Tabs.Tab id="daily">
                Daily<Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="monthly">
                <Tabs.Separator />Monthly<Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="notes">
                <Tabs.Separator />Notes<Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="settings">
                <Tabs.Separator />Labels<Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>

        {/* User / sign out */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-400 hidden md:block max-w-[140px] truncate">
            {email}
          </span>
          <Button variant="outline" size="sm" onPress={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}

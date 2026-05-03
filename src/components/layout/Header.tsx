import { Button, Tabs } from '@heroui/react'

interface Props {
  email: string
  view: 'daily' | 'monthly'
  setView: (v: 'daily' | 'monthly') => void
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
          <div>
            <h1 className="text-base font-semibold leading-tight">FocusFlow</h1>
            <p className="text-xs text-muted -mt-0.5 hidden sm:block">Daily checklist</p>
          </div>
        </div>

        {/* View toggle */}
        <Tabs
          selectedKey={view}
          onSelectionChange={(key) => setView(key as 'daily' | 'monthly')}
          variant="secondary"
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="View">
              <Tabs.Tab id="daily">
                Daily
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="monthly">
                <Tabs.Separator />
                Monthly
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>

        {/* User / sign out */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted hidden md:block max-w-[140px] truncate">
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

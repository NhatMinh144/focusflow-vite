import { useState } from 'react'
import { Tabs } from '@heroui/react'
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react'
import { FloatingPortal } from '@floating-ui/react'
import { SettingsView } from '../settings/SettingsView'
import type { ColorCode } from '../../types'

export type AppView = 'notes' | 'daily' | 'monthly'

interface Props {
  email: string
  view: AppView
  setView: (v: AppView) => void
  onSignOut: () => void
  colorCodes: ColorCode[]
  onAddColorCode: (name: string, color: string) => void
  onUpdateColorCode: (id: string, name: string, color: string) => void
  onDeleteColorCode: (id: string) => void
}

// ── User dropdown menu ────────────────────────────────────────
function UserMenu({
  email, onSignOut, colorCodes, onAddColorCode, onUpdateColorCode, onDeleteColorCode,
}: {
  email: string
  onSignOut: () => void
  colorCodes: ColorCode[]
  onAddColorCode: (name: string, color: string) => void
  onUpdateColorCode: (id: string, name: string, color: string) => void
  onDeleteColorCode: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showLabels, setShowLabels] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    placement: 'bottom-end',
  })
  const click = useClick(context)
  const dismiss = useDismiss(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss])

  const initial = email ? email[0].toUpperCase() : '?'

  function handleManageLabels() {
    setIsOpen(false)
    setShowLabels(true)
  }

  function handleSignOut() {
    setIsOpen(false)
    onSignOut()
  }

  return (
    <>
      {/* Avatar trigger */}
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        type="button"
        aria-label="User menu"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white text-sm font-semibold shrink-0 hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
      >
        {initial}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 w-56 rounded-xl border border-zinc-200 bg-white shadow-xl overflow-hidden"
          >
            {/* Email header — non-clickable */}
            <div className="px-4 py-3 border-b border-zinc-100">
              <p className="text-xs text-zinc-400 font-medium truncate">{email}</p>
            </div>

            {/* Manage labels */}
            <button
              type="button"
              onClick={handleManageLabels}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
            >
              {/* Tag icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="text-zinc-400 shrink-0">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              Manage labels
            </button>

            {/* Divider */}
            <div className="border-t border-zinc-100" />

            {/* Sign out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-700 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-colors"
            >
              {/* Log out icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="shrink-0">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        </FloatingPortal>
      )}

      {/* Manage Labels modal */}
      {showLabels && (
        <FloatingPortal>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLabels(false)}
            aria-hidden="true"
          />
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden pointer-events-auto animate-slide-up">
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                <h2 className="text-base font-semibold">Manage Labels</h2>
                <button
                  type="button"
                  onClick={() => setShowLabels(false)}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              {/* Modal body — scrollable */}
              <div className="overflow-y-auto max-h-[70vh] p-5">
                <SettingsView
                  colorCodes={colorCodes}
                  onAdd={onAddColorCode}
                  onUpdate={onUpdateColorCode}
                  onDelete={onDeleteColorCode}
                />
              </div>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  )
}

// ── Header ────────────────────────────────────────────────────
export function Header({
  email, view, setView, onSignOut,
  colorCodes, onAddColorCode, onUpdateColorCode, onDeleteColorCode,
}: Props) {
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

        {/* Tabs: Notes → Daily → Monthly */}
        <Tabs
          selectedKey={view}
          onSelectionChange={(key) => setView(key as AppView)}
          variant="secondary"
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="View">
              <Tabs.Tab id="notes">
                Notes<Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="daily">
                <Tabs.Separator />Daily<Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="monthly">
                <Tabs.Separator />Monthly<Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>

        {/* User menu */}
        <UserMenu
          email={email}
          onSignOut={onSignOut}
          colorCodes={colorCodes}
          onAddColorCode={onAddColorCode}
          onUpdateColorCode={onUpdateColorCode}
          onDeleteColorCode={onDeleteColorCode}
        />
      </div>
    </header>
  )
}

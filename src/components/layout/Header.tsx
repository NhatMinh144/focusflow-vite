import { useState } from 'react'
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

export type AppView = 'planner' | 'monthly'

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

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

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

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        type="button"
        aria-label="User menu"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-semibold shrink-0 hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      >
        {initial}
      </button>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 w-56 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs text-slate-400 font-medium truncate">{email}</p>
            </div>
            <button
              type="button"
              onClick={() => { setIsOpen(false); setShowLabels(true) }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="text-slate-400 shrink-0">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              Manage labels
            </button>
            <div className="border-t border-slate-100" />
            <button
              type="button"
              onClick={() => { setIsOpen(false); onSignOut() }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-colors"
            >
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

      {showLabels && (
        <FloatingPortal>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLabels(false)} aria-hidden="true" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden pointer-events-auto animate-slide-up">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold">Manage Labels</h2>
                <button type="button" onClick={() => setShowLabels(false)} aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto max-h-[70vh] p-5">
                <SettingsView colorCodes={colorCodes} onAdd={onAddColorCode}
                  onUpdate={onUpdateColorCode} onDelete={onDeleteColorCode} />
              </div>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  )
}

export function Header({
  email, view, setView, onSignOut,
  colorCodes, onAddColorCode, onUpdateColorCode, onDeleteColorCode,
}: Props) {
  const isMonthly = view === 'monthly'

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-2.5 sm:py-3 gap-3">

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded-xl bg-blue-600 text-white grid place-items-center font-bold text-sm shadow-sm">
            FF
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold leading-tight text-slate-900">FocusFlow</h1>
            <p className="text-xs text-slate-400 -mt-0.5">Daily planner</p>
          </div>
        </div>

        {/* Monthly calendar toggle */}
        <button
          type="button"
          onClick={() => setView(isMonthly ? 'planner' : 'monthly')}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200',
            isMonthly
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300',
          ].join(' ')}
        >
          <CalendarIcon />
          <span className="hidden sm:inline">{isMonthly ? '← Planner' : 'Monthly'}</span>
          <span className="sm:hidden">{isMonthly ? '← Back' : 'Month'}</span>
        </button>

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

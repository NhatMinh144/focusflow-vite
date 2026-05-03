import { useEffect, useRef, useState } from 'react'
import {
  FloatingFocusManager,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'

interface Props {
  notes: string
  onSave: (notes: string) => void
  placeholder?: string
}

export function NotePopover({ notes, onSave, placeholder = 'Add a note…' }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(notes)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasNotes = notes.trim().length > 0

  // Sync draft when notes prop changes while popover is closed
  useEffect(() => {
    if (!isOpen) {
      setDraft(notes)
      setSaveStatus('idle')
    }
  }, [notes, isOpen])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  function handleChange(value: string) {
    setDraft(value)
    setSaveStatus('saving')

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)

    debounceRef.current = setTimeout(() => {
      onSave(value)
      setSaveStatus('saved')
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
    }, 500)
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      // Flush any pending debounced save immediately on close
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
        if (draft !== notes) onSave(draft)
      }
    }
    setIsOpen(nextOpen)
  }

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: handleOpenChange,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    placement: 'bottom-end',
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'dialog' })
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  return (
    <>
      {/* Icon trigger */}
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        type="button"
        aria-label={hasNotes ? 'View or edit notes' : 'Add notes'}
        className={[
          'relative flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors',
          isOpen
            ? 'text-amber-500'
            : hasNotes
              ? 'text-amber-500 hover:text-amber-600'
              : 'text-zinc-400 hover:text-zinc-600',
        ].join(' ')}
      >
        {/* Speech bubble icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {/* Amber dot when notes exist and popover is closed */}
        {hasNotes && !isOpen && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber-400"
          />
        )}
      </button>

      {/* Floating popover */}
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-50 w-72 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg outline-none"
            >
              {/* Header row */}
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-600">Notes</p>
                <div className="flex items-center gap-2">
                  {saveStatus === 'saving' && (
                    <span className="text-xs text-zinc-400">Saving…</span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="text-xs text-emerald-500">Auto-saved ✓</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenChange(false)}
                    aria-label="Close notes"
                    className="flex h-4 w-4 items-center justify-center rounded text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => {
                  handleChange(e.target.value)
                  autoResize(e.target)
                }}
                onFocus={(e) => autoResize(e.target)}
                placeholder={placeholder}
                rows={3}
                autoFocus
                style={{ minHeight: '72px', overflow: 'hidden' }}
                className="w-full resize-none rounded-lg border border-zinc-200 px-2.5 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  )
}

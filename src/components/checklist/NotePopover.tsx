import { useEffect, useState } from 'react'
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
  const hasNotes = notes.trim().length > 0

  // Sync draft when notes prop changes while popover is closed
  useEffect(() => {
    if (!isOpen) setDraft(notes)
  }, [notes, isOpen])

  function handleOpenChange(nextOpen: boolean) {
    // Save when closing if content changed
    if (!nextOpen && draft !== notes) onSave(draft)
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
              : 'text-zinc-300 hover:text-zinc-500',
        ].join(' ')}
      >
        {/* Speech bubble icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
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
              className="z-50 w-64 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg outline-none"
            >
              <p className="mb-2 text-xs font-semibold text-amber-600">Notes</p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder}
                rows={4}
                autoFocus
                className="w-full resize-none rounded-lg border border-zinc-200 px-2.5 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  )
}

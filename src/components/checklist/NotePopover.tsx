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

// Detect touch/mobile once
function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handle = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handle)
    return () => mq.removeEventListener('change', handle)
  }, [])
  return mobile
}

// ── Shared save logic hook ────────────────────────────────────────────────
function useNoteDraft(notes: string, isOpen: boolean, onSave: (v: string) => void) {
  const [draft, setDraft] = useState(notes)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setDraft(notes)
      setSaveStatus('idle')
    }
  }, [notes, isOpen])

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

  function flushSave() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
      if (draft !== notes) onSave(draft)
    }
  }

  return { draft, saveStatus, handleChange, flushSave }
}

// ── Desktop floating popover ──────────────────────────────────────────────
function DesktopPopover({
  notes,
  onSave,
  placeholder,
  triggerRef,
  getTriggerProps,
}: {
  notes: string
  onSave: (v: string) => void
  placeholder: string
  triggerRef: (el: HTMLButtonElement | null) => void
  getTriggerProps: () => Record<string, unknown>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const hasNotes = notes.trim().length > 0
  const { draft, saveStatus, handleChange, flushSave } = useNoteDraft(notes, isOpen, onSave)

  function handleOpenChange(next: boolean) {
    if (!next) flushSave()
    setIsOpen(next)
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
      <button
        ref={(el) => { refs.setReference(el); triggerRef(el) }}
        {...getReferenceProps()}
        {...getTriggerProps()}
        type="button"
        aria-label={hasNotes ? 'View or edit notes' : 'Add notes'}
        className={[
          'relative flex h-5 w-5 items-center justify-center rounded transition-colors',
          isOpen
            ? 'text-amber-500'
            : hasNotes
              ? 'text-amber-500 hover:text-amber-600'
              : 'text-zinc-400 hover:text-zinc-600',
        ].join(' ')}
      >
        <NoteIcon />
        {hasNotes && !isOpen && <AmberDot />}
      </button>

      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-50 w-72 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg outline-none"
            >
              <PopoverHeader
                saveStatus={saveStatus}
                onClose={() => handleOpenChange(false)}
              />
              <NoteTextarea
                draft={draft}
                placeholder={placeholder}
                onChange={handleChange}
                autoFocus
              />
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  )
}

// ── Mobile bottom sheet ───────────────────────────────────────────────────
function MobileSheet({
  notes,
  onSave,
  placeholder,
  triggerRef,
  getTriggerProps,
}: {
  notes: string
  onSave: (v: string) => void
  placeholder: string
  triggerRef: (el: HTMLButtonElement | null) => void
  getTriggerProps: () => Record<string, unknown>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const hasNotes = notes.trim().length > 0
  const { draft, saveStatus, handleChange, flushSave } = useNoteDraft(notes, isOpen, onSave)

  function close() {
    flushSave()
    setIsOpen(false)
  }

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      <button
        ref={triggerRef}
        {...getTriggerProps()}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={hasNotes ? 'View or edit notes' : 'Add notes'}
        className={[
          'relative flex h-5 w-5 items-center justify-center rounded transition-colors',
          isOpen
            ? 'text-amber-500'
            : hasNotes
              ? 'text-amber-500'
              : 'text-zinc-400',
        ].join(' ')}
      >
        <NoteIcon />
        {hasNotes && !isOpen && <AmberDot />}
      </button>

      {isOpen && (
        <FloatingPortal>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Bottom sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-2xl animate-slide-up">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-200" />
            </div>

            <div className="px-4 pb-4 pt-2">
              <PopoverHeader saveStatus={saveStatus} onClose={close} />
              <NoteTextarea
                draft={draft}
                placeholder={placeholder}
                onChange={handleChange}
                autoFocus
                rows={6}
              />
              {/* Done button — saves and dismisses */}
              <button
                type="button"
                onClick={close}
                className="mt-3 w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white active:bg-zinc-700 transition-colors"
              >
                Done
              </button>
            </div>

            {/* Safe area spacer for iOS home bar */}
            <div style={{ height: 'env(safe-area-inset-bottom)' }} />
          </div>
        </FloatingPortal>
      )}
    </>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────
function NoteIcon() {
  return (
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
  )
}

function AmberDot() {
  return (
    <span
      aria-hidden="true"
      className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber-400"
    />
  )
}

function PopoverHeader({
  saveStatus,
  onClose,
}: {
  saveStatus: 'idle' | 'saving' | 'saved'
  onClose: () => void
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <p className="text-sm font-semibold text-amber-600">Notes</p>
      <div className="flex items-center gap-2">
        {saveStatus === 'saving' && (
          <span className="text-xs text-zinc-400">Saving…</span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-xs text-emerald-500">Saved ✓</span>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notes"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
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
  )
}

function NoteTextarea({
  draft,
  placeholder,
  onChange,
  autoFocus,
  rows = 4,
}: {
  draft: string
  placeholder: string
  onChange: (v: string) => void
  autoFocus?: boolean
  rows?: number
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }, [draft])

  return (
    <textarea
      ref={ref}
      value={draft}
      onChange={(e) => {
        onChange(e.target.value)
        e.target.style.height = 'auto'
        e.target.style.height = e.target.scrollHeight + 'px'
      }}
      placeholder={placeholder}
      rows={rows}
      autoFocus={autoFocus}
      /* text-[16px] prevents iOS Safari zoom on focus */
      className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2.5 text-[16px] leading-relaxed text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
      style={{ minHeight: `${rows * 1.6}rem`, overflow: 'hidden' }}
    />
  )
}

// ── Public component — picks mobile or desktop automatically ──────────────
export function NotePopover({ notes, onSave, placeholder = 'Add a note…' }: Props) {
  const isMobile = useIsMobile()
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const setRef = (el: HTMLButtonElement | null) => { triggerRef.current = el }
  const getProps = () => ({})

  if (isMobile) {
    return (
      <MobileSheet
        notes={notes}
        onSave={onSave}
        placeholder={placeholder}
        triggerRef={setRef}
        getTriggerProps={getProps}
      />
    )
  }

  return (
    <DesktopPopover
      notes={notes}
      onSave={onSave}
      placeholder={placeholder}
      triggerRef={setRef}
      getTriggerProps={getProps}
    />
  )
}

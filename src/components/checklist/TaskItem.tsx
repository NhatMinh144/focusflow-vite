import { useEffect, useRef, useState } from 'react'
import { Button, Chip, Form } from '@heroui/react'
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react'
import type { ColorCode, Task } from '../../types'
import { NotePopover } from './NotePopover'

// ── Mobile detection ──────────────────────────────────────────
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

interface Props {
  task: Task
  colorCodes: ColorCode[]
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onAddSubtask: (taskId: string, text: string, date: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string, done: boolean) => void
  onDeleteSubtask: (taskId: string, subtaskId: string) => void
  onUpdateNotes: (taskId: string, notes: string) => void
  onUpdateSubtaskNotes: (taskId: string, subtaskId: string, notes: string) => void
  onUpdateText: (taskId: string, text: string) => void
  onUpdateSubtaskText: (taskId: string, subtaskId: string, text: string) => void
  onMoveDate: (taskId: string, date: string) => void
  onSetDateRange: (taskId: string, start: string, end: string) => void
  onUpdateColorCode: (taskId: string, colorCodeId: string | null) => void
}

// ── Inline editable text ──────────────────────────────────────
function InlineEdit({
  value, onSave, className, inputClassName,
}: {
  value: string; onSave: (next: string) => void
  className?: string; inputClassName?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() { setDraft(value); setEditing(true) }
  function save() {
    const t = draft.trim()
    if (t && t !== value) onSave(t)
    setEditing(false)
  }
  function cancel() { setDraft(value); setEditing(false) }

  if (editing) {
    return (
      <input ref={inputRef} autoFocus value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); save() }
          if (e.key === 'Escape') { e.preventDefault(); cancel() }
        }}
        className={inputClassName ?? 'flex-1 min-w-0 rounded-lg border border-zinc-300 px-2 py-1 text-[16px] focus:outline-none focus:ring-2 focus:ring-zinc-300'}
      />
    )
  }

  return (
    <span role="button" tabIndex={0} onClick={startEdit}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEdit() }}
      className={className}>
      {value}
    </span>
  )
}

// ── Three-dot menu with date adjustment ──────────────────────
type MenuPanel = 'main' | 'move' | 'range' | 'color'

interface MoreMenuProps {
  task: Task
  colorCodes: ColorCode[]
  onDelete: () => void
  onMoveDate: (date: string) => void
  onSetDateRange: (start: string, end: string) => void
  onUpdateColorCode: (id: string | null) => void
}

// Shared three-dot trigger icon
function ThreeDotIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
    </svg>
  )
}

// Back arrow button used in sub-panels
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  )
}

// Shared panel body — renders whichever panel is active
function MenuPanelBody({
  panel, setPanel, task, colorCodes,
  moveDate, setMoveDate, rangeStart, setRangeStart, rangeEnd, setRangeEnd,
  onDelete, onMoveDate, onSetDateRange, onUpdateColorCode, close,
}: {
  panel: MenuPanel
  setPanel: (p: MenuPanel) => void
  task: Task
  colorCodes: ColorCode[]
  moveDate: string
  setMoveDate: (d: string) => void
  rangeStart: string
  setRangeStart: (d: string) => void
  rangeEnd: string
  setRangeEnd: (d: string) => void
  onDelete: () => void
  onMoveDate: (date: string) => void
  onSetDateRange: (start: string, end: string) => void
  onUpdateColorCode: (id: string | null) => void
  close: () => void
}) {
  return (
    <>
      {/* ── Main panel ── */}
      {panel === 'main' && (
        <div className="py-1">
          <button type="button" onClick={() => setPanel('move')}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100">
            <span>📅</span> Move to date…
          </button>
          <button type="button" onClick={() => setPanel('range')}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100">
            <span>↔️</span> Set date range…
          </button>
          <button type="button" onClick={() => setPanel('color')}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100">
            <span>🏷️</span> Assign label…
          </button>
          <div className="my-1 border-t border-zinc-100" />
          <button type="button" onClick={() => { close(); onDelete() }}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-red-500 hover:bg-red-50 active:bg-red-100">
            <span>🗑️</span> Delete task
          </button>
        </div>
      )}

      {/* ── Move to date panel ── */}
      {panel === 'move' && (
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <BackButton onClick={() => setPanel('main')} />
            <span className="text-sm font-semibold text-zinc-700">Move to date</span>
          </div>
          <input type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)}
            className="w-full appearance-none rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 text-[16px] text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none" />
          <Button variant="primary" isDisabled={!moveDate}
            onPress={() => { onMoveDate(moveDate); close() }}
            className="w-full">
            Move
          </Button>
        </div>
      )}

      {/* ── Date range panel ── */}
      {panel === 'range' && (
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <BackButton onClick={() => setPanel('main')} />
            <span className="text-sm font-semibold text-zinc-700">Set date range</span>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-500">From</label>
            <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)}
              className="w-full appearance-none rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 text-[16px] text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none" />
            <label className="text-xs font-medium text-zinc-500">To</label>
            <input type="date" value={rangeEnd} min={rangeStart} onChange={(e) => setRangeEnd(e.target.value)}
              className="w-full appearance-none rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 text-[16px] text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none" />
          </div>
          <Button variant="primary"
            isDisabled={!rangeStart || !rangeEnd || rangeEnd < rangeStart}
            onPress={() => { onSetDateRange(rangeStart, rangeEnd); close() }}
            className="w-full">
            Set range
          </Button>
        </div>
      )}

      {/* ── Color label panel ── */}
      {panel === 'color' && (
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <BackButton onClick={() => setPanel('main')} />
            <span className="text-sm font-semibold text-zinc-700">Assign label</span>
          </div>
          {colorCodes.length === 0 ? (
            <p className="text-xs text-zinc-400">No labels yet. Create some in Settings.</p>
          ) : (
            <div className="flex flex-col gap-1">
              <button type="button"
                onClick={() => { onUpdateColorCode(null); close() }}
                className={[
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  task.color_code_id === null ? 'bg-zinc-100 font-semibold' : 'hover:bg-zinc-50 active:bg-zinc-100',
                ].join(' ')}>
                <span className="h-4 w-4 rounded-full border-2 border-dashed border-zinc-300 shrink-0" />
                None
              </button>
              {colorCodes.map((cc) => (
                <button key={cc.id} type="button"
                  onClick={() => { onUpdateColorCode(cc.id); close() }}
                  className={[
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    task.color_code_id === cc.id ? 'bg-zinc-100 font-semibold' : 'hover:bg-zinc-50 active:bg-zinc-100',
                  ].join(' ')}>
                  <span className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: cc.color }} />
                  {cc.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ── Desktop: floating popover ─────────────────────────────────
function DesktopMoreMenu({ task, colorCodes, onDelete, onMoveDate, onSetDateRange, onUpdateColorCode }: MoreMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [panel, setPanel] = useState<MenuPanel>('main')
  const [moveDate, setMoveDate] = useState(task.date)
  const [rangeStart, setRangeStart] = useState(task.date_range_start ?? task.date)
  const [rangeEnd, setRangeEnd] = useState(task.date_range_end ?? task.date)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (next) => { setIsOpen(next); if (!next) setPanel('main') },
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    placement: 'bottom-end',
  })
  const click = useClick(context)
  const dismiss = useDismiss(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss])

  function close() { setIsOpen(false); setPanel('main') }

  return (
    <>
      <button ref={refs.setReference} {...getReferenceProps()}
        type="button" aria-label="More options"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-zinc-700 hover:bg-zinc-100 sm:h-6 sm:w-6 sm:opacity-0 sm:group-hover/task:opacity-100">
        <ThreeDotIcon />
      </button>

      {isOpen && (
        <FloatingPortal>
          <div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}
            className="z-50 min-w-[200px] rounded-xl border border-zinc-200 bg-white shadow-xl overflow-hidden">
            <MenuPanelBody
              panel={panel} setPanel={setPanel} task={task} colorCodes={colorCodes}
              moveDate={moveDate} setMoveDate={setMoveDate}
              rangeStart={rangeStart} setRangeStart={setRangeStart}
              rangeEnd={rangeEnd} setRangeEnd={setRangeEnd}
              onDelete={onDelete} onMoveDate={onMoveDate}
              onSetDateRange={onSetDateRange} onUpdateColorCode={onUpdateColorCode}
              close={close}
            />
          </div>
        </FloatingPortal>
      )}
    </>
  )
}

// ── Mobile: bottom sheet ──────────────────────────────────────
function MobileMoreMenu({ task, colorCodes, onDelete, onMoveDate, onSetDateRange, onUpdateColorCode }: MoreMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [panel, setPanel] = useState<MenuPanel>('main')
  const [moveDate, setMoveDate] = useState(task.date)
  const [rangeStart, setRangeStart] = useState(task.date_range_start ?? task.date)
  const [rangeEnd, setRangeEnd] = useState(task.date_range_end ?? task.date)

  function open() { setPanel('main'); setIsOpen(true) }
  function close() { setIsOpen(false); setPanel('main') }

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
      <button type="button" onClick={open} aria-label="More options"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-zinc-700 hover:bg-zinc-100">
        <ThreeDotIcon />
      </button>

      {isOpen && (
        <FloatingPortal>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={close} aria-hidden="true" />

          {/* Bottom sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-2xl animate-slide-up">
            {/* Drag handle row — close button sits here to avoid adding a second title row */}
            <div className="relative flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-200" />
              <button type="button" onClick={close} aria-label="Close"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* MenuPanelBody owns the panel title + back navigation */}
            <MenuPanelBody
              panel={panel} setPanel={setPanel} task={task} colorCodes={colorCodes}
              moveDate={moveDate} setMoveDate={setMoveDate}
              rangeStart={rangeStart} setRangeStart={setRangeStart}
              rangeEnd={rangeEnd} setRangeEnd={setRangeEnd}
              onDelete={onDelete} onMoveDate={onMoveDate}
              onSetDateRange={onSetDateRange} onUpdateColorCode={onUpdateColorCode}
              close={close}
            />

            {/* iOS safe area spacer */}
            <div style={{ height: 'env(safe-area-inset-bottom)' }} />
          </div>
        </FloatingPortal>
      )}
    </>
  )
}

// ── Public MoreMenu — picks mobile or desktop ─────────────────
function MoreMenu(props: MoreMenuProps) {
  const isMobile = useIsMobile()
  return isMobile ? <MobileMoreMenu {...props} /> : <DesktopMoreMenu {...props} />
}

// ── Date range badge ──────────────────────────────────────────
function DateRangeBadge({ start, end }: { start: string; end: string }) {
  const startD = new Date(start + 'T00:00:00')
  const endD = new Date(end + 'T00:00:00')
  const days = Math.round((endD.getTime() - startD.getTime()) / 86400000) + 1
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <span title={`${fmt(startD)} – ${fmt(endD)}`}
      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 font-medium">
      ↔ {days}d
    </span>
  )
}

// ── TaskItem ──────────────────────────────────────────────────
export function TaskItem({
  task, colorCodes,
  onToggle, onDelete, onAddSubtask, onToggleSubtask, onDeleteSubtask,
  onUpdateNotes, onUpdateSubtaskNotes, onUpdateText, onUpdateSubtaskText,
  onMoveDate, onSetDateRange, onUpdateColorCode,
}: Props) {
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [subtaskInput, setSubtaskInput] = useState('')

  const doneCount = task.subtasks.filter((s) => s.done).length
  const totalSubs = task.subtasks.length
  const hasSubtaskSection = totalSubs > 0 || addingSubtask
  const hasDateRange = !!(task.date_range_start && task.date_range_end)
  const colorCode = colorCodes.find((c) => c.id === task.color_code_id)

  const notesSnippet =
    task.notes?.trim().length > 0
      ? task.notes.trim().length > 60
        ? task.notes.trim().slice(0, 60) + '…'
        : task.notes.trim()
      : null

  function handleAddSubtask() {
    const text = subtaskInput.trim()
    if (!text) return
    onAddSubtask(task.id, text, task.date)
    setSubtaskInput('')
    setAddingSubtask(false)
  }

  function cancelAddSubtask() { setAddingSubtask(false); setSubtaskInput('') }

  return (
    <li className="group/task rounded-xl border border-zinc-200 bg-white overflow-hidden"
      style={colorCode ? { borderLeftColor: colorCode.color, borderLeftWidth: 3 } : undefined}>

      {/* ── Main task row ── */}
      <div className="flex items-center gap-3 px-3 py-3.5 sm:items-start sm:py-3">

        {/* Checkbox */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center sm:h-auto sm:w-auto sm:mt-1">
          <input type="checkbox" checked={task.done}
            onChange={(e) => onToggle(task.id, e.target.checked)}
            aria-label={task.text}
            className="h-5 w-5 shrink-0 cursor-pointer rounded accent-zinc-900" />
        </div>

        {/* Text + snippets */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {task.done ? (
              <span className="text-base leading-snug line-through text-zinc-400 font-normal">{task.text}</span>
            ) : (
              <InlineEdit value={task.text} onSave={(text) => onUpdateText(task.id, text)}
                className="cursor-text text-base leading-snug text-zinc-900 font-semibold"
                inputClassName="w-full rounded-lg border border-zinc-300 px-2 py-1 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-300"
              />
            )}
            {hasDateRange && (
              <DateRangeBadge start={task.date_range_start!} end={task.date_range_end!} />
            )}
            {colorCode && !hasDateRange && (
              <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: colorCode.color }} title={colorCode.name} />
            )}
          </div>
          {notesSnippet && !task.done && (
            <p className="mt-0.5 text-xs italic text-zinc-400 truncate">{notesSnippet}</p>
          )}
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {totalSubs > 0 && (
            <Chip variant="soft" color={doneCount === totalSubs ? 'success' : 'default'} size="sm">
              {doneCount}/{totalSubs}
            </Chip>
          )}
          <div className="flex h-9 w-9 items-center justify-center sm:h-6 sm:w-6">
            <NotePopover notes={task.notes ?? ''} onSave={(notes) => onUpdateNotes(task.id, notes)} />
          </div>
          <MoreMenu
            task={task}
            colorCodes={colorCodes}
            onDelete={() => onDelete(task.id)}
            onMoveDate={(d) => onMoveDate(task.id, d)}
            onSetDateRange={(s, e) => onSetDateRange(task.id, s, e)}
            onUpdateColorCode={(id) => onUpdateColorCode(task.id, id)}
          />
        </div>
      </div>

      {/* ── Subtask section ── */}
      {hasSubtaskSection && (
        <div className="border-t border-zinc-100 bg-zinc-50/60 px-3 pb-3">
          <ul className="pt-2 space-y-0.5">
            {task.subtasks.map((sub) => (
              <li key={sub.id} className="group/sub flex items-center gap-1.5 py-0.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center sm:h-6 sm:w-6">
                  <input type="checkbox" checked={sub.done}
                    onChange={(e) => onToggleSubtask(task.id, sub.id, e.target.checked)}
                    aria-label={sub.text}
                    className="h-4 w-4 cursor-pointer rounded accent-zinc-700" />
                </div>
                {sub.done ? (
                  <span className="flex-1 min-w-0 text-sm line-through text-zinc-400">{sub.text}</span>
                ) : (
                  <InlineEdit value={sub.text} onSave={(text) => onUpdateSubtaskText(task.id, sub.id, text)}
                    className="flex-1 min-w-0 cursor-text text-sm text-zinc-600"
                    inputClassName="flex-1 min-w-0 rounded-lg border border-zinc-300 px-2 py-1 text-[16px] focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                )}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center sm:h-6 sm:w-6">
                  <NotePopover notes={sub.notes ?? ''} placeholder="Add a note for this subtask…"
                    onSave={(notes) => onUpdateSubtaskNotes(task.id, sub.id, notes)} />
                </div>
                <button type="button" onClick={() => onDeleteSubtask(task.id, sub.id)}
                  aria-label="Delete subtask"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:text-red-500 active:bg-red-50 sm:h-6 sm:w-6 sm:opacity-0 sm:group-hover/sub:opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>

          {addingSubtask ? (
            <Form className="flex items-center gap-2 mt-3"
              onSubmit={(e) => { e.preventDefault(); handleAddSubtask() }}>
              <div className="flex flex-1 items-center rounded-xl border border-zinc-300 bg-white focus-within:ring-2 focus-within:ring-zinc-300 overflow-hidden">
                <input value={subtaskInput} onChange={(e) => setSubtaskInput(e.target.value)}
                  autoFocus autoComplete="off" placeholder="Subtask name…" aria-label="New subtask"
                  onKeyDown={(e) => { if (e.key === 'Escape') cancelAddSubtask() }}
                  className="flex-1 bg-transparent px-3 py-2.5 text-[16px] focus:outline-none" />
                <button type="button" onClick={cancelAddSubtask} aria-label="Cancel"
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-zinc-400 hover:text-zinc-700 active:text-zinc-900">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <Button type="submit" variant="primary" size="sm" className="shrink-0 h-10 px-4">Add</Button>
            </Form>
          ) : (
            <button type="button" onClick={() => setAddingSubtask(true)}
              className="mt-2 flex items-center gap-1 py-2 px-1 text-sm text-zinc-400 hover:text-zinc-600 active:text-zinc-800 transition-colors">
              <span className="text-base leading-none">+</span> Add subtask
            </button>
          )}
        </div>
      )}

      {/* Hover-reveal add subtask */}
      {!hasSubtaskSection && (
        <div className="px-3 pb-2.5 pl-12">
          <button type="button" onClick={() => setAddingSubtask(true)}
            className="flex items-center gap-1 py-1 text-xs text-zinc-300 hover:text-zinc-500 active:text-zinc-700 transition-colors sm:opacity-0 sm:group-hover/task:opacity-100">
            + Add subtask
          </button>
        </div>
      )}
    </li>
  )
}

import { useRef, useState } from 'react'
import { Button, Chip, Form } from '@heroui/react'
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
import type { Task } from '../../types'
import { NotePopover } from './NotePopover'

interface Props {
  task: Task
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onAddSubtask: (taskId: string, text: string, date: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string, done: boolean) => void
  onDeleteSubtask: (taskId: string, subtaskId: string) => void
  onUpdateNotes: (taskId: string, notes: string) => void
  onUpdateSubtaskNotes: (taskId: string, subtaskId: string, notes: string) => void
  onUpdateText: (taskId: string, text: string) => void
  onUpdateSubtaskText: (taskId: string, subtaskId: string, text: string) => void
}

// ── Inline editable text ──────────────────────────────────────────────────
function InlineEdit({
  value,
  onSave,
  className,
  inputClassName,
}: {
  value: string
  onSave: (next: string) => void
  className?: string
  inputClassName?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(value)
    setEditing(true)
  }

  function save() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onSave(trimmed)
    setEditing(false)
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); save() }
          if (e.key === 'Escape') { e.preventDefault(); cancel() }
        }}
        className={inputClassName ?? 'flex-1 min-w-0 rounded border border-zinc-300 px-2 py-1 text-base focus:outline-none focus:ring-2 focus:ring-zinc-300'}
      />
    )
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={startEdit}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEdit() }}
      className={className}
    >
      {value}
    </span>
  )
}

// ── Three-dot menu ────────────────────────────────────────────────────────
function MoreMenu({ onDelete }: { onDelete: () => void }) {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    placement: 'bottom-end',
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss])

  return (
    <>
      {/* Always visible on mobile, hover-reveal on desktop */}
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        type="button"
        aria-label="More options"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-zinc-700 hover:bg-zinc-100 sm:h-6 sm:w-6 sm:opacity-0 sm:group-hover/task:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
          className="z-50 min-w-[140px] rounded-xl border border-zinc-200 bg-white py-1 shadow-xl"
        >
          <button
            type="button"
            onClick={() => { setIsOpen(false); onDelete() }}
            className="w-full px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
          >
            Delete task
          </button>
        </div>
      )}
    </>
  )
}

// ── TaskItem ──────────────────────────────────────────────────────────────
export function TaskItem({
  task,
  onToggle,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateNotes,
  onUpdateSubtaskNotes,
  onUpdateText,
  onUpdateSubtaskText,
}: Props) {
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [subtaskInput, setSubtaskInput] = useState('')

  const doneCount = task.subtasks.filter((s) => s.done).length
  const totalSubs = task.subtasks.length
  const hasSubtaskSection = totalSubs > 0 || addingSubtask

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

  function cancelAddSubtask() {
    setAddingSubtask(false)
    setSubtaskInput('')
  }

  return (
    <li className="group/task rounded-xl border border-zinc-200 bg-white overflow-hidden">

      {/* ── Main task row ── */}
      <div className="flex items-center gap-3 px-3 py-3.5 sm:items-start sm:py-3">

        {/* Checkbox — larger tap target on mobile */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center sm:h-auto sm:w-auto sm:mt-1">
          <input
            type="checkbox"
            checked={task.done}
            onChange={(e) => onToggle(task.id, e.target.checked)}
            aria-label={task.text}
            className="h-5 w-5 shrink-0 cursor-pointer rounded accent-zinc-900"
          />
        </div>

        {/* Task text + notes snippet */}
        <div className="flex-1 min-w-0">
          {task.done ? (
            <span className="text-base leading-snug line-through text-zinc-400 font-normal">
              {task.text}
            </span>
          ) : (
            <InlineEdit
              value={task.text}
              onSave={(text) => onUpdateText(task.id, text)}
              className="cursor-text text-base leading-snug text-zinc-900 font-semibold"
              inputClassName="w-full rounded-lg border border-zinc-300 px-2 py-1 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
          )}
          {notesSnippet && !task.done && (
            <p className="mt-0.5 text-xs italic text-zinc-400 truncate">{notesSnippet}</p>
          )}
        </div>

        {/* Right-side icons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {totalSubs > 0 && (
            <Chip
              variant="soft"
              color={doneCount === totalSubs ? 'success' : 'default'}
              size="sm"
            >
              {doneCount}/{totalSubs}
            </Chip>
          )}

          {/* Note icon — wrapped in larger tap target */}
          <div className="flex h-9 w-9 items-center justify-center sm:h-6 sm:w-6">
            <NotePopover
              notes={task.notes ?? ''}
              onSave={(notes) => onUpdateNotes(task.id, notes)}
            />
          </div>

          <MoreMenu onDelete={() => onDelete(task.id)} />
        </div>
      </div>

      {/* ── Subtask section ── */}
      {hasSubtaskSection && (
        <div className="border-t border-zinc-100 bg-zinc-50/60 px-3 pb-3">
          <ul className="pt-2 space-y-0.5">
            {task.subtasks.map((sub) => (
              <li key={sub.id} className="group/sub flex items-center gap-1.5 py-0.5">
                {/* Subtask checkbox */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center sm:h-6 sm:w-6">
                  <input
                    type="checkbox"
                    checked={sub.done}
                    onChange={(e) => onToggleSubtask(task.id, sub.id, e.target.checked)}
                    aria-label={sub.text}
                    className="h-4 w-4 cursor-pointer rounded accent-zinc-700"
                  />
                </div>

                {sub.done ? (
                  <span className="flex-1 min-w-0 text-sm line-through text-zinc-400">{sub.text}</span>
                ) : (
                  <InlineEdit
                    value={sub.text}
                    onSave={(text) => onUpdateSubtaskText(task.id, sub.id, text)}
                    className="flex-1 min-w-0 cursor-text text-sm text-zinc-600"
                    inputClassName="flex-1 min-w-0 rounded-lg border border-zinc-300 px-2 py-1 text-[16px] focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                )}

                {/* Subtask note icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center sm:h-6 sm:w-6">
                  <NotePopover
                    notes={sub.notes ?? ''}
                    onSave={(notes) => onUpdateSubtaskNotes(task.id, sub.id, notes)}
                    placeholder="Add a note for this subtask…"
                  />
                </div>

                {/* Subtask delete */}
                <button
                  type="button"
                  onClick={() => onDeleteSubtask(task.id, sub.id)}
                  aria-label="Delete subtask"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:text-red-500 active:bg-red-50 sm:h-6 sm:w-6 sm:opacity-0 sm:group-hover/sub:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>

          {/* Add subtask form or button */}
          {addingSubtask ? (
            <Form
              className="flex items-center gap-2 mt-3"
              onSubmit={(e) => { e.preventDefault(); handleAddSubtask() }}
            >
              {/* Input + inline X cancel button */}
              <div className="flex flex-1 items-center rounded-xl border border-zinc-300 bg-white focus-within:ring-2 focus-within:ring-zinc-300 overflow-hidden">
                <input
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  autoFocus
                  autoComplete="off"
                  placeholder="Subtask name…"
                  aria-label="New subtask"
                  onKeyDown={(e) => { if (e.key === 'Escape') cancelAddSubtask() }}
                  className="flex-1 bg-transparent px-3 py-2.5 text-[16px] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={cancelAddSubtask}
                  aria-label="Cancel"
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-zinc-400 hover:text-zinc-700 active:text-zinc-900"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <Button type="submit" variant="primary" size="sm" className="shrink-0 h-10 px-4">
                Add
              </Button>
            </Form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingSubtask(true)}
              className="mt-2 flex items-center gap-1 py-2 px-1 text-sm text-zinc-400 hover:text-zinc-600 active:text-zinc-800 transition-colors"
            >
              <span className="text-base leading-none">+</span> Add subtask
            </button>
          )}
        </div>
      )}

      {/* ── Add subtask prompt when no subtasks — always visible (no hover needed) ── */}
      {!hasSubtaskSection && (
        <div className="px-3 pb-2.5 pl-12">
          <button
            type="button"
            onClick={() => setAddingSubtask(true)}
            className="flex items-center gap-1 py-1 text-xs text-zinc-300 hover:text-zinc-500 active:text-zinc-700 transition-colors sm:opacity-0 sm:group-hover/task:opacity-100"
          >
            + Add subtask
          </button>
        </div>
      )}
    </li>
  )
}

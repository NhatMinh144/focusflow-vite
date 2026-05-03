import { useRef, useState } from 'react'
import { Button, Checkbox, Chip, Form } from '@heroui/react'
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
    // Focus happens via autoFocus on the input
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
        className={inputClassName ?? 'flex-1 min-w-0 rounded border border-zinc-300 px-1.5 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300'}
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
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        type="button"
        aria-label="More options"
        className="flex h-5 w-5 items-center justify-center rounded text-zinc-300 opacity-0 transition-all hover:text-zinc-600 group-hover/task:opacity-100"
      >
        {/* Three vertical dots */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
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
          className="z-50 min-w-[120px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            onClick={() => { setIsOpen(false); onDelete() }}
            className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50 transition-colors"
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

  // Notes snippet preview (60 chars, italic, only when not done)
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
      <div className="flex items-start gap-2.5 px-3 py-3">

        {/* Checkbox */}
        <div className="mt-0.5 shrink-0">
          <Checkbox
            variant="primary"
            isSelected={task.done}
            onChange={(isSelected) => onToggle(task.id, isSelected)}
            aria-label={task.text}
          />
        </div>

        {/* Task text + notes snippet */}
        <div className="flex-1 min-w-0">
          {task.done ? (
            <span className="text-base leading-snug line-through text-muted font-normal">
              {task.text}
            </span>
          ) : (
            <InlineEdit
              value={task.text}
              onSave={(text) => onUpdateText(task.id, text)}
              className="cursor-text text-base leading-snug text-zinc-900 font-semibold hover:text-zinc-600 transition-colors"
              inputClassName="w-full rounded border border-zinc-300 px-1.5 py-0.5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
          )}
          {notesSnippet && !task.done && (
            <p className="mt-0.5 text-xs italic text-zinc-400 truncate">{notesSnippet}</p>
          )}
        </div>

        {/* Right-side icons */}
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {/* Subtask count chip */}
          {totalSubs > 0 && (
            <Chip
              variant="soft"
              color={doneCount === totalSubs ? 'success' : 'default'}
              size="sm"
            >
              {doneCount}/{totalSubs}
            </Chip>
          )}

          {/* Notes icon */}
          <NotePopover
            notes={task.notes ?? ''}
            onSave={(notes) => onUpdateNotes(task.id, notes)}
          />

          {/* Three-dot delete menu */}
          <MoreMenu onDelete={() => onDelete(task.id)} />
        </div>
      </div>

      {/* ── Subtask section ── */}
      {hasSubtaskSection && (
        <div className="border-t border-zinc-100 bg-zinc-50/60 px-3 pb-3">
          <ul className="pt-2 space-y-1.5">
            {task.subtasks.map((sub) => (
              <li key={sub.id} className="group/sub flex items-center gap-2 pl-6">
                <Checkbox
                  variant="primary"
                  isSelected={sub.done}
                  onChange={(isSelected) => onToggleSubtask(task.id, sub.id, isSelected)}
                  aria-label={sub.text}
                />
                {sub.done ? (
                  <span className="flex-1 text-sm line-through text-zinc-400">{sub.text}</span>
                ) : (
                  <InlineEdit
                    value={sub.text}
                    onSave={(text) => onUpdateSubtaskText(task.id, sub.id, text)}
                    className="flex-1 cursor-text text-sm text-zinc-600 hover:text-zinc-800 transition-colors"
                    inputClassName="flex-1 min-w-0 rounded border border-zinc-300 px-1.5 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                )}

                {/* Subtask note icon */}
                <NotePopover
                  notes={sub.notes ?? ''}
                  onSave={(notes) => onUpdateSubtaskNotes(task.id, sub.id, notes)}
                  placeholder="Add a note for this subtask…"
                />

                {/* Subtask delete — hover reveal */}
                <button
                  type="button"
                  onClick={() => onDeleteSubtask(task.id, sub.id)}
                  aria-label="Delete subtask"
                  className="flex h-4 w-4 items-center justify-center rounded text-zinc-300 opacity-0 transition-all hover:text-red-500 group-hover/sub:opacity-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="11"
                    height="11"
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
              </li>
            ))}
          </ul>

          {/* Add subtask form or button */}
          {addingSubtask ? (
            <Form
              className="flex gap-2 mt-2.5 pl-6"
              onSubmit={(e) => { e.preventDefault(); handleAddSubtask() }}
            >
              <input
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                autoFocus
                autoComplete="off"
                placeholder="Add a subtask…"
                aria-label="New subtask"
                onKeyDown={(e) => { if (e.key === 'Escape') cancelAddSubtask() }}
                className="flex-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
              />
              <Button type="submit" variant="primary" size="sm">Add</Button>
              <Button type="button" variant="ghost" size="sm" onPress={cancelAddSubtask}>
                Cancel
              </Button>
            </Form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingSubtask(true)}
              className="mt-2 pl-6 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              + Add subtask
            </button>
          )}
        </div>
      )}

      {/* ── Hover-reveal add subtask when none exist ── */}
      {!hasSubtaskSection && (
        <div className="px-3 pb-2 pl-11">
          <button
            type="button"
            onClick={() => setAddingSubtask(true)}
            className="text-xs text-zinc-300 hover:text-zinc-500 transition-colors opacity-0 group-hover/task:opacity-100"
          >
            + Add subtask
          </button>
        </div>
      )}
    </li>
  )
}

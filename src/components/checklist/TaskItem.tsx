import { useState } from 'react'
import { Button, Checkbox, Chip, Form } from '@heroui/react'
import type { Task } from '../../types'
import { NotePopover } from './NotePopover'

interface Props {
  task: Task
  date: string
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onAddSubtask: (taskId: string, text: string, date: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string, done: boolean) => void
  onDeleteSubtask: (taskId: string, subtaskId: string) => void
  onUpdateNotes: (taskId: string, notes: string) => void
  onUpdateSubtaskNotes: (taskId: string, subtaskId: string, notes: string) => void
}

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
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
  )
}

export function TaskItem({
  task,
  date,
  onToggle,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateNotes,
  onUpdateSubtaskNotes,
}: Props) {
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [subtaskInput, setSubtaskInput] = useState('')

  const doneCount = task.subtasks.filter((s) => s.done).length
  const totalSubs = task.subtasks.length
  const hasSubtaskSection = totalSubs > 0 || addingSubtask

  // Truncate notes to 60 chars for inline preview
  const notesSnippet =
    task.notes?.trim().length > 0
      ? task.notes.trim().length > 60
        ? task.notes.trim().slice(0, 60) + '…'
        : task.notes.trim()
      : null

  function handleAddSubtask() {
    const text = subtaskInput.trim()
    if (!text) return
    onAddSubtask(task.id, text, date)
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

        {/* Checkbox — nudged down to align with text baseline */}
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
          <span
            className={[
              'text-base leading-snug',
              task.done
                ? 'line-through text-muted font-normal'
                : 'text-zinc-900 font-semibold',
            ].join(' ')}
          >
            {task.text}
          </span>
          {notesSnippet && !task.done && (
            <p className="mt-0.5 text-xs italic text-zinc-400 truncate">{notesSnippet}</p>
          )}
        </div>

        {/* Right-side icons */}
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {/* Subtask count chip — read-only indicator */}
          {totalSubs > 0 && (
            <Chip
              variant="soft"
              color={doneCount === totalSubs ? 'success' : 'default'}
              size="sm"
            >
              {doneCount}/{totalSubs}
            </Chip>
          )}

          {/* Notes icon — always visible, amber when filled */}
          <NotePopover
            notes={task.notes ?? ''}
            onSave={(notes) => onUpdateNotes(task.id, notes)}
          />

          {/* Delete icon — visible on row hover */}
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
            className="flex h-5 w-5 items-center justify-center rounded text-zinc-300 opacity-0 transition-all hover:text-red-500 group-hover/task:opacity-100"
          >
            <XIcon size={13} />
          </button>
        </div>
      </div>

      {/* ── Subtask section (shown when subtasks exist or adding) ── */}
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
                <span
                  className={[
                    'flex-1 text-sm min-w-0',
                    sub.done ? 'line-through text-zinc-400' : 'text-zinc-600',
                  ].join(' ')}
                >
                  {sub.text}
                </span>

                {/* Subtask note icon */}
                <NotePopover
                  notes={sub.notes ?? ''}
                  onSave={(notes) => onUpdateSubtaskNotes(task.id, sub.id, notes)}
                  placeholder="Add a note for this subtask…"
                />

                {/* Subtask delete — visible on subtask row hover */}
                <button
                  type="button"
                  onClick={() => onDeleteSubtask(task.id, sub.id)}
                  aria-label="Delete subtask"
                  className="flex h-4 w-4 items-center justify-center rounded text-zinc-300 opacity-0 transition-all hover:text-red-500 group-hover/sub:opacity-100"
                >
                  <XIcon size={11} />
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

      {/* ── Add subtask prompt when no subtasks yet — reveals on task hover ── */}
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

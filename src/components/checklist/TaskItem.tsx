import { useEffect, useRef, useState } from 'react'
import type { Task } from '../../types'

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
  const [expanded, setExpanded] = useState(false)
  const [subtaskInput, setSubtaskInput] = useState('')
  const [taskNotesOpen, setTaskNotesOpen] = useState(false)
  const [taskNotes, setTaskNotes] = useState(task.notes ?? '')
  // Map of subtask id → notes open state
  const [subNotesOpen, setSubNotesOpen] = useState<Record<string, boolean>>({})
  // Map of subtask id → notes value
  const [subNotes, setSubNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(task.subtasks.map((s) => [s.id, s.notes ?? ''])),
  )

  // Sync notes when task prop changes (e.g. after refetch)
  useEffect(() => {
    setTaskNotes(task.notes ?? '')
  }, [task.notes])

  useEffect(() => {
    setSubNotes(Object.fromEntries(task.subtasks.map((s) => [s.id, s.notes ?? ''])))
  }, [task.subtasks])

  const subtaskInputRef = useRef<HTMLInputElement>(null)

  const doneCount = task.subtasks.filter((s) => s.done).length
  const totalSubs = task.subtasks.length

  function handleAddSubtask() {
    const text = subtaskInput.trim()
    if (!text) return
    onAddSubtask(task.id, text, date)
    setSubtaskInput('')
    subtaskInputRef.current?.focus()
  }

  return (
    <li className="rounded-xl border border-zinc-200 overflow-hidden">
      {/* ── Main task row ── */}
      <div className="group flex items-center gap-3 px-3 py-2.5">
        <input
          type="checkbox"
          checked={task.done}
          onChange={(e) => onToggle(task.id, e.target.checked)}
          className="h-5 w-5 shrink-0 cursor-pointer accent-zinc-900"
        />

        <span
          className={
            'flex-1 text-sm ' + (task.done ? 'line-through text-zinc-400' : 'text-zinc-800')
          }
        >
          {task.text}
        </span>

        {/* Subtask count badge */}
        {totalSubs > 0 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className={
              'text-xs px-2 py-0.5 rounded-full font-medium transition ' +
              (doneCount === totalSubs
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-zinc-100 text-zinc-600')
            }
          >
            {doneCount}/{totalSubs}
          </button>
        )}

        {/* Notes dot — visible when notes exist */}
        {task.notes && !taskNotesOpen && (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" title="Has notes" />
        )}

        {/* Action buttons on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => setTaskNotesOpen((o) => !o)}
            className={
              'text-xs px-2 py-1 rounded-lg transition ' +
              (taskNotesOpen
                ? 'bg-amber-100 text-amber-700'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600')
            }
          >
            Notes
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition"
          >
            {expanded ? '↑' : '+'} Sub
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition"
          >
            ×
          </button>
        </div>
      </div>

      {/* ── Task notes panel ── */}
      {taskNotesOpen && (
        <div className="border-t border-zinc-100 bg-amber-50/50 px-3 py-2.5">
          <p className="text-xs font-medium text-amber-700 mb-1.5">Notes</p>
          <textarea
            rows={3}
            value={taskNotes}
            onChange={(e) => setTaskNotes(e.target.value)}
            onBlur={() => onUpdateNotes(task.id, taskNotes)}
            placeholder="Add notes for this task…"
            className="w-full text-sm rounded-lg border border-amber-200 bg-white px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          />
        </div>
      )}

      {/* ── Subtask panel ── */}
      {expanded && (
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3">
          {task.subtasks.length > 0 ? (
            <ul className="space-y-1 mb-3">
              {task.subtasks.map((sub) => (
                <li key={sub.id}>
                  {/* Subtask row */}
                  <div className="group/sub flex items-center gap-2 py-0.5">
                    <input
                      type="checkbox"
                      checked={sub.done}
                      onChange={(e) => onToggleSubtask(task.id, sub.id, e.target.checked)}
                      className="h-4 w-4 shrink-0 cursor-pointer accent-zinc-900"
                    />
                    <span
                      className={
                        'flex-1 text-sm ' +
                        (sub.done ? 'line-through text-zinc-400' : 'text-zinc-700')
                      }
                    >
                      {sub.text}
                    </span>

                    {/* Notes dot for subtask */}
                    {sub.notes && !subNotesOpen[sub.id] && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition">
                      <button
                        onClick={() =>
                          setSubNotesOpen((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }))
                        }
                        className={
                          'text-xs px-1.5 py-0.5 rounded-md transition ' +
                          (subNotesOpen[sub.id]
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300')
                        }
                      >
                        Notes
                      </button>
                      <button
                        onClick={() => onDeleteSubtask(task.id, sub.id)}
                        className="text-xs text-zinc-300 hover:text-red-500 transition"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Subtask notes panel */}
                  {subNotesOpen[sub.id] && (
                    <div className="ml-6 mt-1 mb-2">
                      <textarea
                        rows={2}
                        value={subNotes[sub.id] ?? ''}
                        onChange={(e) =>
                          setSubNotes((prev) => ({ ...prev, [sub.id]: e.target.value }))
                        }
                        onBlur={() =>
                          onUpdateSubtaskNotes(task.id, sub.id, subNotes[sub.id] ?? '')
                        }
                        placeholder="Add notes for this subtask…"
                        className="w-full text-sm rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-400 mb-2">No subtasks yet.</p>
          )}

          {/* Add subtask form */}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              handleAddSubtask()
            }}
          >
            <input
              ref={subtaskInputRef}
              value={subtaskInput}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setSubtaskInput(e.target.value)}
              placeholder="Add a subtask…"
              className="flex-1 text-sm rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
            <button
              type="submit"
              className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:opacity-90 transition"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </li>
  )
}

import { useRef, useState } from 'react'
import type { Task } from '../../types'

interface Props {
  task: Task
  date: string
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onAddSubtask: (taskId: string, text: string, date: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string, done: boolean) => void
  onDeleteSubtask: (taskId: string, subtaskId: string) => void
}

export function TaskItem({
  task,
  date,
  onToggle,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [subtaskInput, setSubtaskInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const doneCount = task.subtasks.filter((s) => s.done).length
  const totalSubs = task.subtasks.length

  function handleAddSubtask() {
    const text = subtaskInput.trim()
    if (!text) return
    onAddSubtask(task.id, text, date)
    setSubtaskInput('')
    inputRef.current?.focus()
  }

  function toggleExpanded() {
    setExpanded((e) => !e)
  }

  return (
    <li className="rounded-xl border border-zinc-200 overflow-hidden">
      {/* Main task row */}
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

        {/* Subtask count badge — always visible when subtasks exist */}
        {totalSubs > 0 && (
          <button
            onClick={toggleExpanded}
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

        {/* Action buttons — show on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={toggleExpanded}
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

      {/* Subtask panel */}
      {expanded && (
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3">
          {task.subtasks.length > 0 ? (
            <ul className="space-y-1.5 mb-3">
              {task.subtasks.map((sub) => (
                <li key={sub.id} className="group/sub flex items-center gap-2">
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
                  <button
                    onClick={() => onDeleteSubtask(task.id, sub.id)}
                    className="text-xs text-zinc-300 opacity-0 group-hover/sub:opacity-100 hover:text-red-500 transition"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-400 mb-2">No subtasks yet.</p>
          )}

          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={subtaskInput}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddSubtask()
                }
              }}
              placeholder="Add a subtask…"
              className="flex-1 text-sm rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
            <button
              onClick={handleAddSubtask}
              className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:opacity-90 transition"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

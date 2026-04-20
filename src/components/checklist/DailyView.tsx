import { useState } from 'react'
import { TaskItem } from './TaskItem'
import type { Task } from '../../types'

interface Props {
  date: string
  setDate: (d: string) => void
  tasks: Task[]
  loading: boolean
  onAddTask: (text: string, date: string) => void
  onToggleTask: (id: string, done: boolean) => void
  onDeleteTask: (id: string) => void
  onAddSubtask: (taskId: string, text: string, date: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string, done: boolean) => void
  onDeleteSubtask: (taskId: string, subtaskId: string) => void
}

export function DailyView({
  date,
  setDate,
  tasks,
  loading,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: Props) {
  const [input, setInput] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const isToday = date === today

  const done = tasks.filter((t) => t.done).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  function addTask() {
    const text = input.trim()
    if (!text) return
    onAddTask(text, date)
    setInput('')
  }

  const displayDate = isToday
    ? 'Today'
    : new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold">{displayDate}</h2>
          {tasks.length > 0 && (
            <p className="text-xs text-zinc-500 mt-0.5">
              {done}/{tasks.length} done — {pct}%
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              onClick={() => setDate(today)}
              className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition"
            >
              Go to today
            </button>
          )}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />
        </div>
      </div>

      {/* Add task input */}
      <div className="flex gap-2 mb-5">
        <input
          className="flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
          placeholder="Add a task and press Enter…"
          value={input}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTask()
            }
          }}
        />
        <button
          onClick={addTask}
          className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm hover:opacity-90 transition"
        >
          Add
        </button>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="py-10 text-center text-sm text-zinc-400">Loading…</div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400">
          No tasks for this day. Add one above.
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              date={date}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
              onAddSubtask={onAddSubtask}
              onToggleSubtask={onToggleSubtask}
              onDeleteSubtask={onDeleteSubtask}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Button, Card, Form, Spinner, TextField } from '@heroui/react'
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
  onUpdateTaskNotes: (taskId: string, notes: string) => void
  onUpdateSubtaskNotes: (taskId: string, subtaskId: string, notes: string) => void
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
  onUpdateTaskNotes,
  onUpdateSubtaskNotes,
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
    <Card className="rounded-2xl shadow-sm">
      <Card.Content className="p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold">{displayDate}</h2>
          {tasks.length > 0 && (
            <p className="text-xs text-muted mt-0.5">
              {done}/{tasks.length} done — {pct}%
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isToday && (
            <Button variant="ghost" size="sm" onPress={() => setDate(today)}>
              Go to today
            </Button>
          )}
          {/* Keep native date input — HeroUI DateField uses a different paradigm */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />
        </div>
      </div>

      {/* Add task form */}
      <Form
        className="flex gap-2 mb-5"
        onSubmit={(e) => {
          e.preventDefault()
          addTask()
        }}
      >
        <TextField
          aria-label="New task"
          placeholder="Add a task and press Enter…"
          value={input}
          onChange={setInput}
          autoComplete="off"
          className="flex-1"
        />
        <Button type="submit" variant="primary">
          Add
        </Button>
      </Form>

      {/* Task list */}
      {loading ? (
        <div className="py-10 flex justify-center">
          <Spinner color="current" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center text-sm text-muted">
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
              onUpdateNotes={onUpdateTaskNotes}
              onUpdateSubtaskNotes={onUpdateSubtaskNotes}
            />
          ))}
        </ul>
      )}
      </Card.Content>
    </Card>
  )
}

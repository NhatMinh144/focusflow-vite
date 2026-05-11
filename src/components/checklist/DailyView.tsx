import { useState } from 'react'
import { Button, Card, Form, Spinner } from '@heroui/react'
import { TaskItem } from './TaskItem'
import type { ColorCode, Task } from '../../types'

interface Props {
  date: string
  setDate: (d: string) => void
  tasks: Task[]
  loading: boolean
  colorCodes: ColorCode[]
  onAddTask: (text: string, date: string, colorCodeId?: string | null) => void
  onToggleTask: (id: string, done: boolean) => void
  onDeleteTask: (id: string) => void
  onAddSubtask: (taskId: string, text: string, date: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string, done: boolean) => void
  onDeleteSubtask: (taskId: string, subtaskId: string) => void
  onUpdateTaskNotes: (taskId: string, notes: string) => void
  onUpdateSubtaskNotes: (taskId: string, subtaskId: string, notes: string) => void
  onUpdateTaskText: (taskId: string, text: string) => void
  onUpdateSubtaskText: (taskId: string, subtaskId: string, text: string) => void
  onMoveTask: (taskId: string, date: string) => void
  onSetDateRange: (taskId: string, start: string, end: string) => void
  onUpdateColorCode: (taskId: string, colorCodeId: string | null) => void
  onViewNote: () => void
}

export function DailyView({
  date, setDate, tasks, loading, colorCodes,
  onAddTask, onToggleTask, onDeleteTask, onAddSubtask, onToggleSubtask, onDeleteSubtask,
  onUpdateTaskNotes, onUpdateSubtaskNotes, onUpdateTaskText, onUpdateSubtaskText,
  onMoveTask, onSetDateRange, onUpdateColorCode, onViewNote,
}: Props) {
  const [input, setInput] = useState('')
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const isToday = date === today
  const done = tasks.filter((t) => t.done).length
  const total = tasks.length
  const pct = total ? Math.round((done / total) * 100) : 0

  const selectedColor = colorCodes.find((c) => c.id === selectedColorId)

  function addTask() {
    const text = input.trim()
    if (!text) return
    onAddTask(text, date, selectedColorId)
    setInput('')
    setSelectedColorId(null)
  }

  const displayDateLong = isToday
    ? 'Today'
    : new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      })
  const displayDateShort = isToday
    ? 'Today'
    : new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      })

  return (
    <div className="flex flex-col gap-3">
      <Card className="rounded-2xl shadow-sm">
        <Card.Content className="p-4 sm:p-6">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">
                <span className="sm:hidden">{displayDateShort}</span>
                <span className="hidden sm:inline">{displayDateLong}</span>
              </h2>
              {total > 0 && (
                <p className="text-xs text-zinc-400 mt-0.5">{done}/{total} done — {pct}%</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isToday && (
                <Button variant="ghost" size="sm" onPress={() => setDate(today)}>Today</Button>
              )}
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300" />
            </div>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="mb-4 h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full rounded-full bg-zinc-900 transition-all duration-300"
                style={{ width: `${pct}%` }} />
            </div>
          )}

          {/* ── Daily note button ── */}
          <button type="button" onClick={onViewNote}
            className="mb-4 flex w-full items-center gap-2 rounded-xl border border-dashed border-zinc-200 px-3 py-2.5 text-sm text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Daily note for this day
          </button>

          {/* ── Add task form (desktop) ── */}
          <Form className="hidden sm:flex flex-col gap-2 mb-4"
            onSubmit={(e) => { e.preventDefault(); addTask() }}>
            <div className="flex gap-2">
              <input aria-label="New task" placeholder="Add a task and press Enter…"
                value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off"
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-zinc-300" />
              {/* Color picker toggle */}
              {colorCodes.length > 0 && (
                <div className="relative">
                  <button type="button" onClick={() => setShowColorPicker(!showColorPicker)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
                    title="Assign label">
                    <span className={[
                      'h-4 w-4 rounded-full transition-colors',
                      selectedColor ? '' : 'border-2 border-dashed border-zinc-300',
                    ].join(' ')}
                      style={selectedColor ? { backgroundColor: selectedColor.color } : undefined} />
                  </button>
                  {showColorPicker && (
                    <div className="absolute right-0 top-12 z-20 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg min-w-[140px]">
                      <button type="button" onClick={() => { setSelectedColorId(null); setShowColorPicker(false) }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-zinc-50">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-dashed border-zinc-300" />
                        None
                      </button>
                      {colorCodes.map((cc) => (
                        <button key={cc.id} type="button"
                          onClick={() => { setSelectedColorId(cc.id); setShowColorPicker(false) }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-zinc-50">
                          <span className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: cc.color }} />
                          {cc.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <Button type="submit" variant="primary">Add</Button>
            </div>
          </Form>

          {/* ── Task list ── */}
          {loading ? (
            <div className="py-12 flex justify-center"><Spinner color="current" /></div>
          ) : total === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 py-12 text-center">
              <p className="text-sm text-zinc-400">No tasks yet.</p>
              <p className="text-xs text-zinc-300 mt-1">Add one below ↓</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task} colorCodes={colorCodes}
                  onToggle={onToggleTask} onDelete={onDeleteTask}
                  onAddSubtask={onAddSubtask} onToggleSubtask={onToggleSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onUpdateNotes={onUpdateTaskNotes} onUpdateSubtaskNotes={onUpdateSubtaskNotes}
                  onUpdateText={onUpdateTaskText} onUpdateSubtaskText={onUpdateSubtaskText}
                  onMoveDate={onMoveTask} onSetDateRange={onSetDateRange}
                  onUpdateColorCode={onUpdateColorCode}
                />
              ))}
            </ul>
          )}
        </Card.Content>
      </Card>

      {/* ── Mobile sticky add-task bar ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-200 bg-white/95 backdrop-blur px-4 py-3 safe-area-pb">
        <Form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addTask() }}>
          <input aria-label="New task" placeholder="Add a task…"
            value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off"
            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[16px] focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:bg-white" />
          <Button type="submit" variant="primary" className="shrink-0 px-5 py-3 rounded-xl">Add</Button>
        </Form>
      </div>

      <div className="h-20 sm:hidden" />
    </div>
  )
}

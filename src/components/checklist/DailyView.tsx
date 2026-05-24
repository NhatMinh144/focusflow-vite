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
}

function ChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function DailyView({
  date, setDate, tasks, loading, colorCodes,
  onAddTask, onToggleTask, onDeleteTask, onAddSubtask, onToggleSubtask, onDeleteSubtask,
  onUpdateTaskNotes, onUpdateSubtaskNotes, onUpdateTaskText, onUpdateSubtaskText,
  onMoveTask, onSetDateRange, onUpdateColorCode,
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

  function shiftDate(delta: number) {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    setDate(d.toISOString().slice(0, 10))
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
    <Card className="rounded-2xl shadow-sm">
      <Card.Content className="p-4 sm:p-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-2 mb-1">
          {/* Prev/Next arrows */}
          <button type="button" onClick={() => shiftDate(-1)} aria-label="Previous day"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200 transition-colors shrink-0">
            <ChevronLeft />
          </button>

          {/* Date label — takes all middle space */}
          <div className="flex-1 min-w-0 text-center">
            <h2 className="text-base font-semibold text-slate-900 truncate">
              <span className="sm:hidden">{displayDateShort}</span>
              <span className="hidden sm:inline">{displayDateLong}</span>
            </h2>
          </div>

          <button type="button" onClick={() => shiftDate(1)} aria-label="Next day"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200 transition-colors shrink-0">
            <ChevronRight />
          </button>
        </div>

        {/* Sub-header: progress + Today button */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-xs text-slate-400">
            {total > 0 ? `${done} of ${total} done · ${pct}%` : 'No tasks yet'}
          </p>
          <div className="flex items-center gap-2">
            {!isToday && (
              <button type="button" onClick={() => setDate(today)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 active:bg-slate-100 transition-colors">
                Today
              </button>
            )}
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              aria-label="Pick date"
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mb-4 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${pct}%` }} />
          </div>
        )}

        {/* ── Add task form ── */}
        <Form className="flex flex-col gap-2 mb-4"
          onSubmit={(e) => { e.preventDefault(); addTask() }}>
          <div className="flex gap-2">
            <input
              aria-label="New task"
              placeholder="Add a task…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
              /* text-[16px] prevents iOS Safari zoom on focus */
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[16px] focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors"
            />
            {/* Color picker toggle */}
            {colorCodes.length > 0 && (
              <div className="relative">
                <button type="button" onClick={() => setShowColorPicker(!showColorPicker)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
                  title="Assign label">
                  <span className={[
                    'h-4 w-4 rounded-full transition-colors',
                    selectedColor ? '' : 'border-2 border-dashed border-slate-300',
                  ].join(' ')}
                    style={selectedColor ? { backgroundColor: selectedColor.color } : undefined} />
                </button>
                {showColorPicker && (
                  <div className="absolute right-0 top-12 z-20 rounded-xl border border-slate-200 bg-white p-2 shadow-lg min-w-[140px]">
                    <button type="button" onClick={() => { setSelectedColorId(null); setShowColorPicker(false) }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-slate-50">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-dashed border-slate-300" />
                      None
                    </button>
                    {colorCodes.map((cc) => (
                      <button key={cc.id} type="button"
                        onClick={() => { setSelectedColorId(cc.id); setShowColorPicker(false) }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-slate-50">
                        <span className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: cc.color }} />
                        {cc.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Button type="submit" variant="primary" className="shrink-0 rounded-xl px-4">Add</Button>
          </div>
        </Form>

        {/* ── Task list ── */}
        {loading ? (
          <div className="py-10 flex justify-center"><Spinner color="current" /></div>
        ) : total === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
            <p className="text-sm text-slate-400">Nothing planned yet.</p>
            <p className="text-xs text-slate-300 mt-1">Type a task above to get started.</p>
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
  )
}

import { useState } from 'react'
import type { MonthTask } from '../../types'

interface Props {
  year: number
  month: number
  monthTasks: MonthTask[]
  onNavigate: (year: number, month: number) => void
  onSelectDay: (date: string) => void
  onMoveTask: (taskId: string, newDate: string) => void
  onToggleTask: (taskId: string, done: boolean) => void
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_VISIBLE = 4

export function MonthlyView({
  year,
  month,
  monthTasks,
  onNavigate,
  onSelectDay,
  onMoveTask,
  onToggleTask,
}: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)

  const daysInMonth = new Date(year, month, 0).getDate()
  const startDow = new Date(year, month - 1, 1).getDay()

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = new Date(year, month - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  function pad(n: number) {
    return String(n).padStart(2, '0')
  }

  function dateStr(day: number) {
    return `${year}-${pad(month)}-${pad(day)}`
  }

  function prev() {
    month === 1 ? onNavigate(year - 1, 12) : onNavigate(year, month - 1)
  }

  function next() {
    month === 12 ? onNavigate(year + 1, 1) : onNavigate(year, month + 1)
  }

  const tasksByDate = monthTasks.reduce<Record<string, MonthTask[]>>((acc, t) => {
    if (!acc[t.date]) acc[t.date] = []
    acc[t.date].push(t)
    return acc
  }, {})

  function handleDragStart(e: React.DragEvent, task: MonthTask) {
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.setData('fromDate', task.date)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, ds: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDate(ds)
  }

  function handleDrop(e: React.DragEvent, ds: string) {
    e.preventDefault()
    setDragOverDate(null)
    const taskId = e.dataTransfer.getData('taskId')
    const fromDate = e.dataTransfer.getData('fromDate')
    if (taskId && fromDate !== ds) {
      onMoveTask(taskId, ds)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <h2 className="text-base font-semibold">{monthLabel}</h2>
        <div className="flex gap-1">
          <button
            onClick={prev}
            className="px-3 py-1.5 text-sm rounded-lg bg-zinc-100 hover:bg-zinc-200 transition"
          >
            ←
          </button>
          <button
            onClick={() => {
              const now = new Date()
              onNavigate(now.getFullYear(), now.getMonth() + 1)
            }}
            className="px-3 py-1.5 text-sm rounded-lg bg-zinc-100 hover:bg-zinc-200 transition"
          >
            Today
          </button>
          <button
            onClick={next}
            className="px-3 py-1.5 text-sm rounded-lg bg-zinc-100 hover:bg-zinc-200 transition"
          >
            →
          </button>
        </div>
      </div>

      {/* Day-of-week row */}
      <div className="grid grid-cols-7 border-b border-zinc-100">
        {DOW.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium text-zinc-400"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-zinc-100">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={`e-${i}`} className="min-h-[130px] bg-zinc-50/40" />
          }

          const ds = dateStr(day)
          const isToday = ds === today
          const isDragOver = dragOverDate === ds
          const dayTasks = tasksByDate[ds] ?? []
          const visibleTasks = dayTasks.slice(0, MAX_VISIBLE)
          const overflow = dayTasks.length - MAX_VISIBLE

          return (
            <div
              key={ds}
              onDragOver={(e) => handleDragOver(e, ds)}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={(e) => handleDrop(e, ds)}
              className={
                'min-h-[130px] p-1.5 flex flex-col gap-1 transition-colors ' +
                (isDragOver ? 'bg-blue-50' : 'bg-white')
              }
            >
              {/* Day number */}
              <button
                onClick={() => onSelectDay(ds)}
                className="self-start"
              >
                <span
                  className={
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition ' +
                    (isToday
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100')
                  }
                >
                  {day}
                </span>
              </button>

              {/* Task pills */}
              <div className="flex flex-col gap-0.5 flex-1">
                {visibleTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className={
                      'group flex items-center gap-1 rounded-md px-1.5 py-0.5 cursor-grab active:cursor-grabbing active:opacity-50 transition-opacity ' +
                      (task.done ? 'bg-zinc-100' : 'bg-zinc-900')
                    }
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={(e) => {
                        e.stopPropagation()
                        onToggleTask(task.id, e.target.checked)
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="h-2.5 w-2.5 shrink-0 cursor-pointer accent-zinc-500"
                    />
                    <span
                      className={
                        'text-xs truncate flex-1 ' +
                        (task.done ? 'line-through text-zinc-400' : 'text-white')
                      }
                    >
                      {task.text}
                    </span>
                  </div>
                ))}

                {overflow > 0 && (
                  <button
                    onClick={() => onSelectDay(ds)}
                    className="text-left text-xs text-zinc-400 px-1.5 hover:text-zinc-600 transition"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>

              {/* Drop hint */}
              {isDragOver && (
                <div className="rounded-md border-2 border-dashed border-blue-300 h-5 flex items-center justify-center">
                  <span className="text-xs text-blue-400">Drop here</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer hint */}
      <div className="px-5 py-2.5 border-t border-zinc-100 text-xs text-zinc-400 flex items-center gap-4">
        <span>Click a day number to add tasks</span>
        <span>·</span>
        <span>Drag tasks to reschedule</span>
      </div>
    </div>
  )
}

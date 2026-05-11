import { useState } from 'react'
import { Button, Card } from '@heroui/react'
import type { ColorCode, MonthTask } from '../../types'

interface Props {
  year: number
  month: number
  monthTasks: MonthTask[]
  colorCodes: ColorCode[]
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
  colorCodes,
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

  function pad(n: number) { return String(n).padStart(2, '0') }
  function dateStr(day: number) { return `${year}-${pad(month)}-${pad(day)}` }
  function prev() { month === 1 ? onNavigate(year - 1, 12) : onNavigate(year, month - 1) }
  function next() { month === 12 ? onNavigate(year + 1, 1) : onNavigate(year, month + 1) }

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
    if (taskId && fromDate !== ds) onMoveTask(taskId, ds)
  }

  return (
    <Card className="rounded-2xl shadow-sm overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <h2 className="text-base font-semibold">{monthLabel}</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onPress={prev}>←</Button>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              const now = new Date()
              onNavigate(now.getFullYear(), now.getMonth() + 1)
            }}
          >
            Today
          </Button>
          <Button variant="ghost" size="sm" onPress={next}>→</Button>
        </div>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 border-b border-zinc-100">
        {DOW.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-zinc-100">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="min-h-[130px] bg-zinc-50/40" />

          const ds = dateStr(day)
          const isToday = ds === today
          const isDragOver = dragOverDate === ds
          const dayTasks = tasksByDate[ds] ?? []
          const visibleTasks = dayTasks.slice(0, MAX_VISIBLE)
          const overflow = dayTasks.length - MAX_VISIBLE
          const doneTasks = dayTasks.filter((t) => t.done).length

          return (
            <div
              key={ds}
              onDragOver={(e) => handleDragOver(e, ds)}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={(e) => handleDrop(e, ds)}
              className={
                'min-h-[80px] sm:min-h-[130px] p-1 sm:p-1.5 flex flex-col gap-1 transition-colors ' +
                (isDragOver ? 'bg-blue-50' : 'bg-white')
              }
            >
              {/* Day number — tap to open */}
              <Button
                variant="ghost"
                size="sm"
                onPress={() => onSelectDay(ds)}
                className={
                  'self-start h-6 w-6 min-w-0 rounded-full p-0 text-xs font-medium ' +
                  (isToday ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'text-zinc-600')
                }
              >
                {day}
              </Button>

              {/* Mobile: dot indicators only */}
              {dayTasks.length > 0 && (
                <div className="flex sm:hidden flex-wrap gap-0.5 px-0.5">
                  {dayTasks.slice(0, 6).map((task) => (
                    <span
                      key={task.id}
                      className={
                        'h-1.5 w-1.5 rounded-full ' +
                        (task.done ? 'bg-zinc-300' : 'bg-zinc-800')
                      }
                    />
                  ))}
                  {dayTasks.length > 6 && (
                    <span className="text-[9px] text-zinc-400 leading-none self-center">+{dayTasks.length - 6}</span>
                  )}
                </div>
              )}

              {/* Desktop: full task pills */}
              <div className="hidden sm:flex flex-col gap-0.5 flex-1">
                {visibleTasks.map((task) => {
                  const cc = colorCodes.find((c) => c.id === task.color_code_id)
                  const bg = task.done ? '#f4f4f5' : (cc?.color ?? '#18181b')
                  const textColor = task.done ? '#a1a1aa' : (cc ? '#fff' : '#fff')
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className="group flex items-center gap-1 rounded-md px-1.5 py-0.5 cursor-grab active:cursor-grabbing active:opacity-50 transition-opacity"
                      style={{ backgroundColor: bg }}
                    >
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={(e) => { e.stopPropagation(); onToggleTask(task.id, e.target.checked) }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="h-2.5 w-2.5 shrink-0 cursor-pointer accent-zinc-500"
                      />
                      <span className="text-xs truncate flex-1" style={{ color: textColor,
                        textDecoration: task.done ? 'line-through' : undefined }}>
                        {task.text}
                        {task.date_range_start && task.date_range_end && ' ↔'}
                      </span>
                    </div>
                  )
                })}
                {overflow > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => onSelectDay(ds)}
                    className="text-xs text-muted px-1.5 h-auto justify-start hover:text-zinc-600"
                  >
                    +{overflow} more
                  </Button>
                )}
              </div>

              {/* Mobile: task count summary */}
              {dayTasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectDay(ds)}
                  className="sm:hidden mt-auto text-[9px] text-zinc-400 text-left px-0.5"
                >
                  {doneTasks}/{dayTasks.length}
                </button>
              )}

              {isDragOver && (
                <div className="rounded-md border-2 border-dashed border-blue-300 h-5 flex items-center justify-center">
                  <span className="text-xs text-blue-400">Drop</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-zinc-100 text-xs text-zinc-400 flex items-center gap-3">
        <span>Tap a day to add tasks</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">Drag tasks to reschedule</span>
      </div>
    </Card>
  )
}

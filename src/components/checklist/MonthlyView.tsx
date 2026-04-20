import type { TaskSummary } from '../../types'

interface Props {
  year: number
  month: number
  summaries: TaskSummary[]
  onNavigate: (year: number, month: number) => void
  onSelectDay: (date: string) => void
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthlyView({ year, month, summaries, onNavigate, onSelectDay }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const summaryMap = new Map(summaries.map((s) => [s.date, s]))

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

  function goToToday() {
    const now = new Date()
    onNavigate(now.getFullYear(), now.getMonth() + 1)
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">{monthLabel}</h2>
        <div className="flex gap-1">
          <button
            onClick={prev}
            className="px-3 py-1.5 text-sm rounded-lg bg-zinc-100 hover:bg-zinc-200 transition"
          >
            ←
          </button>
          <button
            onClick={goToToday}
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

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-1">
        {DOW.map((d) => (
          <div key={d} className="text-center text-xs text-zinc-400 py-1.5 font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />

          const ds = dateStr(day)
          const summary = summaryMap.get(ds)
          const isToday = ds === today

          let indicator: React.ReactNode = null
          if (summary) {
            const allDone = summary.done === summary.total
            indicator = (
              <span
                className={
                  'h-1.5 w-1.5 rounded-full ' +
                  (allDone ? 'bg-emerald-400' : 'bg-amber-400')
                }
              />
            )
          }

          return (
            <button
              key={ds}
              onClick={() => onSelectDay(ds)}
              className={
                'relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-sm transition ' +
                (isToday
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800 font-semibold'
                  : 'text-zinc-700 hover:bg-zinc-100')
              }
            >
              <span>{day}</span>
              {indicator ?? <span className="h-1.5 w-1.5" />}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 flex items-center gap-5 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          All done
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          In progress
        </div>
        <p className="ml-auto text-zinc-400">Click a day to view tasks</p>
      </div>
    </div>
  )
}

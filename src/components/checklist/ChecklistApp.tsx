import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useTasks } from '../../hooks/useTasks'
import { DailyView } from './DailyView'
import { MonthlyView } from './MonthlyView'

interface Props {
  user: User
  view: 'daily' | 'monthly'
  setView: (v: 'daily' | 'monthly') => void
}

export function ChecklistApp({ user, view, setView }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1)

  const {
    tasks,
    monthTasks,
    loading,
    fetchDayTasks,
    fetchMonthTasks,
    addTask,
    toggleTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    moveTask,
    toggleMonthTask,
  } = useTasks(user.id)

  useEffect(() => {
    if (view === 'daily') fetchDayTasks(date)
  }, [view, date, fetchDayTasks])

  useEffect(() => {
    if (view === 'monthly') fetchMonthTasks(calYear, calMonth)
  }, [view, calYear, calMonth, fetchMonthTasks])

  function handleSelectDay(selectedDate: string) {
    setDate(selectedDate)
    setView('daily')
  }

  function handleNavigate(y: number, m: number) {
    setCalYear(y)
    setCalMonth(m)
  }

  return (
    <main className="mx-auto max-w-5xl p-4 md:p-8">
      {view === 'daily' ? (
        <DailyView
          date={date}
          setDate={setDate}
          tasks={tasks}
          loading={loading}
          onAddTask={addTask}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          onAddSubtask={addSubtask}
          onToggleSubtask={toggleSubtask}
          onDeleteSubtask={deleteSubtask}
        />
      ) : (
        <MonthlyView
          year={calYear}
          month={calMonth}
          monthTasks={monthTasks}
          onNavigate={handleNavigate}
          onSelectDay={handleSelectDay}
          onMoveTask={moveTask}
          onToggleTask={toggleMonthTask}
        />
      )}
    </main>
  )
}

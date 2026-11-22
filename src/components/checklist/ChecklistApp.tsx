import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useTasks } from '../../hooks/useTasks'
import { useDailyNotes } from '../../hooks/useDailyNotes'
import { DailyView } from './DailyView'
import { MonthlyView } from './MonthlyView'
import { NotesView } from '../notes/NotesView'
import { FloatingWidget } from '../widget/FloatingWidget'
import type { AppView } from '../layout/Header'
import type { ColorCode } from '../../types'

interface Props {
  user: User
  view: AppView
  setView: (v: AppView) => void
  colorCodes: ColorCode[]
  onUpdateColorCode: (id: string, name: string, color: string) => void
}

export function ChecklistApp({ user, view, setView, colorCodes, onUpdateColorCode: _updateCC }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(() => today)
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1)

  const {
    tasks, monthTasks, loading,
    fetchDayTasks, fetchMonthTasks,
    addTask, toggleTask, deleteTask,
    addSubtask, toggleSubtask, deleteSubtask,
    updateTaskText, updateSubtaskText,
    updateTaskNotes, updateSubtaskNotes,
    updateTaskColorCode,
    autoCarryForward,
    moveTask, setTaskDateRange, toggleMonthTask,
  } = useTasks(user.id)

  const { note, noteLoading, noteSaving, fetchNote, saveNoteDebounced } = useDailyNotes(user.id)

  // Fetch tasks + notes whenever date changes in planner view
  useEffect(() => {
    if (view === 'planner') {
      if (date === today) autoCarryForward(today)
      fetchDayTasks(date)
      fetchNote(date)
    }
  }, [view, date, fetchDayTasks, fetchNote, autoCarryForward, today])

  useEffect(() => {
    if (view === 'monthly') fetchMonthTasks(calYear, calMonth)
  }, [view, calYear, calMonth, fetchMonthTasks])

  function handleSelectDay(selectedDate: string) {
    setDate(selectedDate)
    setView('planner')
  }

  function handleNavigate(y: number, m: number) {
    setCalYear(y)
    setCalMonth(m)
  }

  return (
    <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 md:px-6 md:py-6">
      {view === 'monthly' && (
        <MonthlyView
          year={calYear} month={calMonth}
          monthTasks={monthTasks} colorCodes={colorCodes}
          onNavigate={handleNavigate} onSelectDay={handleSelectDay}
          onMoveTask={moveTask} onToggleTask={toggleMonthTask}
        />
      )}

      <FloatingWidget tasks={tasks} date={date} onToggleTask={toggleTask} />

      {view === 'planner' && (
        <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
          {/* Left panel — tasks */}
          <div className="flex-none w-full lg:w-[420px] xl:w-[460px]">
            <DailyView
              date={date} setDate={setDate}
              tasks={tasks} loading={loading} colorCodes={colorCodes}
              onAddTask={addTask} onToggleTask={toggleTask} onDeleteTask={deleteTask}
              onAddSubtask={addSubtask} onToggleSubtask={toggleSubtask} onDeleteSubtask={deleteSubtask}
              onUpdateTaskNotes={updateTaskNotes} onUpdateSubtaskNotes={updateSubtaskNotes}
              onUpdateTaskText={updateTaskText} onUpdateSubtaskText={updateSubtaskText}
              onMoveTask={moveTask} onSetDateRange={setTaskDateRange}
              onUpdateColorCode={updateTaskColorCode}
            />
          </div>

          {/* Right panel — daily note */}
          <div className="flex-1 min-w-0">
            <NotesView
              date={date}
              note={note} noteLoading={noteLoading} noteSaving={noteSaving}
              onSave={saveNoteDebounced}
            />
          </div>
        </div>
      )}
    </main>
  )
}

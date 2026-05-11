import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useTasks } from '../../hooks/useTasks'
import { useDailyNotes } from '../../hooks/useDailyNotes'
import { DailyView } from './DailyView'
import { MonthlyView } from './MonthlyView'
import { NotesView } from '../notes/NotesView'
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
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().slice(0, 10))
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
    moveTask, setTaskDateRange, toggleMonthTask,
  } = useTasks(user.id)

  const { note, noteLoading, noteSaving, fetchNote, saveNoteDebounced } = useDailyNotes(user.id)

  useEffect(() => {
    if (view === 'daily') fetchDayTasks(date)
  }, [view, date, fetchDayTasks])

  useEffect(() => {
    if (view === 'monthly') fetchMonthTasks(calYear, calMonth)
  }, [view, calYear, calMonth, fetchMonthTasks])

  useEffect(() => {
    if (view === 'notes') fetchNote(noteDate)
  }, [view, noteDate, fetchNote])

  function handleSelectDay(selectedDate: string) {
    setDate(selectedDate)
    setView('daily')
  }

  function handleNavigate(y: number, m: number) {
    setCalYear(y)
    setCalMonth(m)
  }

  function handleViewNote() {
    setNoteDate(date)
    setView('notes')
  }

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 sm:px-4 md:px-8 md:py-8">
      {view === 'notes' && (
        <NotesView
          date={noteDate} setDate={setNoteDate}
          note={note} noteLoading={noteLoading} noteSaving={noteSaving}
          onSave={saveNoteDebounced}
        />
      )}

      {view === 'daily' && (
        <DailyView
          date={date} setDate={setDate}
          tasks={tasks} loading={loading} colorCodes={colorCodes}
          onAddTask={addTask} onToggleTask={toggleTask} onDeleteTask={deleteTask}
          onAddSubtask={addSubtask} onToggleSubtask={toggleSubtask} onDeleteSubtask={deleteSubtask}
          onUpdateTaskNotes={updateTaskNotes} onUpdateSubtaskNotes={updateSubtaskNotes}
          onUpdateTaskText={updateTaskText} onUpdateSubtaskText={updateSubtaskText}
          onMoveTask={moveTask} onSetDateRange={setTaskDateRange}
          onUpdateColorCode={updateTaskColorCode}
          onViewNote={handleViewNote}
        />
      )}

      {view === 'monthly' && (
        <MonthlyView
          year={calYear} month={calMonth}
          monthTasks={monthTasks} colorCodes={colorCodes}
          onNavigate={handleNavigate} onSelectDay={handleSelectDay}
          onMoveTask={moveTask} onToggleTask={toggleMonthTask}
        />
      )}
    </main>
  )
}

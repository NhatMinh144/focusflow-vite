import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
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
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(() => today)
  const [noteDate, setNoteDate] = useState(() => today)
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1)
  const [hasNoteForDate, setHasNoteForDate] = useState(false)

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

  useEffect(() => {
    if (view === 'daily') {
      // Carry forward undone tasks from yesterday (once per day)
      if (date === today) autoCarryForward(today)
      fetchDayTasks(date)
    }
  }, [view, date, fetchDayTasks, autoCarryForward, today])

  // Check if a non-empty note exists for the current daily-view date.
  // Tiptap stores an empty document as "<p></p>", so we strip HTML tags
  // and check for actual text before showing the amber indicator.
  useEffect(() => {
    if (view !== 'daily') return
    supabase
      .from('daily_notes')
      .select('content')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle()
      .then(({ data }) => {
        const hasText = !!(data?.content?.replace(/<[^>]*>/g, '').trim())
        setHasNoteForDate(hasText)
      })
  }, [date, view, user.id])

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
          hasNote={hasNoteForDate}
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

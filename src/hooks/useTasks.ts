import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { MonthTask, Subtask, Task, TaskSummary } from '../types'

export function useTasks(userId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [monthSummary, setMonthSummary] = useState<TaskSummary[]>([])
  const [monthTasks, setMonthTasks] = useState<MonthTask[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDayTasks = useCallback(async (date: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*, subtasks(*)')
      .eq('date', date)
      .order('created_at', { ascending: true })

    if (data) {
      setTasks(
        (data as any[]).map((t) => ({
          ...t,
          subtasks: [...(t.subtasks ?? [])].sort(
            (a: Subtask, b: Subtask) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          ),
        })) as Task[],
      )
    }
    setLoading(false)
  }, [])

  const fetchMonthSummary = useCallback(async (year: number, month: number) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const start = `${year}-${pad(month)}-01`
    const end = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`

    const { data } = await supabase
      .from('tasks')
      .select('date, done')
      .gte('date', start)
      .lte('date', end)

    if (data) {
      const map = new Map<string, { total: number; done: number }>()
      ;(data as { date: string; done: boolean }[]).forEach((t) => {
        const entry = map.get(t.date) ?? { total: 0, done: 0 }
        entry.total++
        if (t.done) entry.done++
        map.set(t.date, entry)
      })
      setMonthSummary(
        Array.from(map.entries()).map(([date, { total, done }]) => ({ date, total, done })),
      )
    }
  }, [])

  const fetchMonthTasks = useCallback(async (year: number, month: number) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const start = `${year}-${pad(month)}-01`
    const end = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`

    const { data } = await supabase
      .from('tasks')
      .select('id, text, date, done')
      .gte('date', start)
      .lte('date', end)
      .order('created_at', { ascending: true })

    if (data) setMonthTasks(data as MonthTask[])
  }, [])

  const moveTask = useCallback(async (taskId: string, newDate: string) => {
    setMonthTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, date: newDate } : t)),
    )
    await supabase.from('tasks').update({ date: newDate }).eq('id', taskId)
  }, [])

  const toggleMonthTask = useCallback(async (taskId: string, done: boolean) => {
    setMonthTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, done } : t)),
    )
    await supabase.from('tasks').update({ done }).eq('id', taskId)
  }, [])

  const addTask = useCallback(
    async (text: string, date: string) => {
      await supabase.from('tasks').insert({ user_id: userId, text, date, done: false })
      await fetchDayTasks(date)
    },
    [userId, fetchDayTasks],
  )

  const toggleTask = useCallback(async (id: string, done: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)))
    await supabase.from('tasks').update({ done }).eq('id', id)
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }, [])

  const addSubtask = useCallback(
    async (taskId: string, text: string, date: string) => {
      await supabase.from('subtasks').insert({ task_id: taskId, text, done: false })
      await fetchDayTasks(date)
    },
    [fetchDayTasks],
  )

  const toggleSubtask = useCallback(
    async (taskId: string, subtaskId: string, done: boolean) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, done } : s)) }
            : t,
        ),
      )
      await supabase.from('subtasks').update({ done }).eq('id', subtaskId)
    },
    [],
  )

  const deleteSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }
          : t,
      ),
    )
    await supabase.from('subtasks').delete().eq('id', subtaskId)
  }, [])

  const updateTaskText = useCallback(async (taskId: string, text: string) => {
    const prev = tasks.find((t) => t.id === taskId)?.text ?? ''
    setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, text } : t)))
    const { error } = await supabase.from('tasks').update({ text }).eq('id', taskId)
    if (error) {
      // Revert on failure
      setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, text: prev } : t)))
    }
  }, [tasks])

  const updateSubtaskText = useCallback(
    async (taskId: string, subtaskId: string, text: string) => {
      const prevText =
        tasks.find((t) => t.id === taskId)?.subtasks.find((s) => s.id === subtaskId)?.text ?? ''
      setTasks((ts) =>
        ts.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, text } : s)) }
            : t,
        ),
      )
      const { error } = await supabase.from('subtasks').update({ text }).eq('id', subtaskId)
      if (error) {
        setTasks((ts) =>
          ts.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((s) =>
                    s.id === subtaskId ? { ...s, text: prevText } : s,
                  ),
                }
              : t,
          ),
        )
      }
    },
    [tasks],
  )

  const updateTaskNotes = useCallback(async (taskId: string, notes: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, notes } : t)))
    await supabase.from('tasks').update({ notes }).eq('id', taskId)
  }, [])

  const updateSubtaskNotes = useCallback(
    async (taskId: string, subtaskId: string, notes: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, notes } : s)) }
            : t,
        ),
      )
      await supabase.from('subtasks').update({ notes }).eq('id', subtaskId)
    },
    [],
  )

  return {
    tasks,
    monthSummary,
    monthTasks,
    loading,
    fetchDayTasks,
    fetchMonthSummary,
    fetchMonthTasks,
    addTask,
    toggleTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    updateTaskText,
    updateSubtaskText,
    updateTaskNotes,
    updateSubtaskNotes,
    moveTask,
    toggleMonthTask,
  }
}

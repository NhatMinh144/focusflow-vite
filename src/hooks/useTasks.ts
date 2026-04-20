import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Subtask, Task, TaskSummary } from '../types'

export function useTasks(userId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [monthSummary, setMonthSummary] = useState<TaskSummary[]>([])
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

  return {
    tasks,
    monthSummary,
    loading,
    fetchDayTasks,
    fetchMonthSummary,
    addTask,
    toggleTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  }
}

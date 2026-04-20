export interface Subtask {
  id: string
  task_id: string
  text: string
  done: boolean
  notes: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  text: string
  date: string
  done: boolean
  notes: string
  created_at: string
  subtasks: Subtask[]
}

export interface TaskSummary {
  date: string
  total: number
  done: number
}

export interface MonthTask {
  id: string
  text: string
  date: string
  done: boolean
}

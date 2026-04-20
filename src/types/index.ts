export interface Subtask {
  id: string
  task_id: string
  text: string
  done: boolean
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  text: string
  date: string
  done: boolean
  created_at: string
  subtasks: Subtask[]
}

export interface TaskSummary {
  date: string
  total: number
  done: number
}

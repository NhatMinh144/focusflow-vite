export interface Subtask {
  id: string
  task_id: string
  text: string
  done: boolean
  notes: string
  created_at: string
}

export interface ColorCode {
  id: string
  user_id: string
  name: string
  color: string          // hex, e.g. '#3b82f6'
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
  color_code_id: string | null
  date_range_start: string | null
  date_range_end: string | null
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
  color_code_id: string | null
  date_range_start: string | null
  date_range_end: string | null
}

export interface DailyNote {
  id: string
  user_id: string
  date: string
  content: string
  created_at: string
  updated_at: string
}

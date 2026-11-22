import type { Task } from '../../types'

interface Props {
  tasks: Task[]
  date: string
  onToggleTask: (id: string, done: boolean) => void
}

export function MiniTaskView({ tasks, date, onToggleTask }: Props) {
  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'numeric',
  })
  const done = tasks.filter(t => t.done).length
  const total = tasks.length

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: '#f0f4f9',
      minHeight: '100vh',
      padding: '16px',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: '#2563eb', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 11,
          }}>FF</div>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>FocusFlow</span>
        </div>
        <div style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{dateLabel}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
          {done}/{total} task hoàn thành
        </div>
        {/* Progress bar */}
        <div style={{ height: 4, background: '#e2e8f0', borderRadius: 9999, marginTop: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 9999, background: '#2563eb',
            width: total > 0 ? `${(done / total) * 100}%` : '0%',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tasks.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '24px 0',
            color: '#94a3b8', fontSize: 13,
          }}>
            Không có task nào hôm nay
          </div>
        ) : tasks.map(task => (
          <div
            key={task.id}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: '#fff', borderRadius: 10, padding: '10px 12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              opacity: task.done ? 0.6 : 1,
              cursor: 'pointer',
            }}
            onClick={() => onToggleTask(task.id, task.done)}
          >
            {/* Checkbox */}
            <div style={{
              width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
              border: task.done ? 'none' : '2px solid #cbd5e1',
              background: task.done ? '#2563eb' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {task.done && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            {/* Text */}
            <span style={{
              fontSize: 13, color: '#1e293b', lineHeight: 1.4, flex: 1,
              textDecoration: task.done ? 'line-through' : 'none',
            }}>
              {task.text}
            </span>
            {/* Subtask count */}
            {task.subtasks.length > 0 && (
              <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
                {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

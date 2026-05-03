import { useEffect, useState } from 'react'
import { Button, Checkbox, Chip, Form, TextArea } from '@heroui/react'
import type { Task } from '../../types'

interface Props {
  task: Task
  date: string
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onAddSubtask: (taskId: string, text: string, date: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string, done: boolean) => void
  onDeleteSubtask: (taskId: string, subtaskId: string) => void
  onUpdateNotes: (taskId: string, notes: string) => void
  onUpdateSubtaskNotes: (taskId: string, subtaskId: string, notes: string) => void
}

export function TaskItem({
  task,
  date,
  onToggle,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateNotes,
  onUpdateSubtaskNotes,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [subtaskInput, setSubtaskInput] = useState('')
  const [taskNotesOpen, setTaskNotesOpen] = useState(false)
  const [taskNotes, setTaskNotes] = useState(task.notes ?? '')
  const [subNotesOpen, setSubNotesOpen] = useState<Record<string, boolean>>({})
  const [subNotes, setSubNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(task.subtasks.map((s) => [s.id, s.notes ?? ''])),
  )

  useEffect(() => { setTaskNotes(task.notes ?? '') }, [task.notes])
  useEffect(() => {
    setSubNotes(Object.fromEntries(task.subtasks.map((s) => [s.id, s.notes ?? ''])))
  }, [task.subtasks])

  const doneCount = task.subtasks.filter((s) => s.done).length
  const totalSubs = task.subtasks.length

  function handleAddSubtask() {
    const text = subtaskInput.trim()
    if (!text) return
    onAddSubtask(task.id, text, date)
    setSubtaskInput('')
  }

  return (
    <li className="rounded-xl border border-zinc-200 overflow-hidden">
      {/* ── Main task row ── */}
      <div className="group flex items-center gap-3 px-3 py-2.5">
        <Checkbox
          isSelected={task.done}
          onChange={(isSelected) => onToggle(task.id, isSelected)}
          aria-label={task.text}
          className="shrink-0"
        />

        <span
          className={
            'flex-1 text-sm ' + (task.done ? 'line-through text-muted' : 'text-zinc-800')
          }
        >
          {task.text}
        </span>

        {/* Subtask count badge */}
        {totalSubs > 0 && (
          <Chip
            variant="soft"
            color={doneCount === totalSubs ? 'success' : 'default'}
            size="sm"
            className="cursor-pointer"
            onClick={() => setExpanded((e) => !e)}
          >
            {doneCount}/{totalSubs}
          </Chip>
        )}

        {/* Notes dot — shows when notes exist and panel is closed */}
        {task.notes && !taskNotesOpen && (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" title="Has notes" />
        )}

        {/* Action buttons — reveal on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setTaskNotesOpen((o) => !o)}
            className={
              'text-xs h-auto py-1 ' +
              (taskNotesOpen ? 'bg-amber-100 text-amber-700' : 'text-muted')
            }
          >
            Notes
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setExpanded((e) => !e)}
            className="text-xs h-auto py-1 text-muted"
          >
            {expanded ? '↑' : '+'} Sub
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => onDelete(task.id)}
            className="text-xs h-auto py-1 text-red-500 hover:bg-red-50"
          >
            ×
          </Button>
        </div>
      </div>

      {/* ── Task notes panel ── */}
      {taskNotesOpen && (
        <div className="border-t border-zinc-100 bg-amber-50/50 px-3 py-2.5">
          <p className="text-xs font-medium text-amber-700 mb-1.5">Notes</p>
          <TextArea
            aria-label="Task notes"
            value={taskNotes}
            onChange={(e) => setTaskNotes(e.target.value)}
            onBlur={() => onUpdateNotes(task.id, taskNotes)}
            placeholder="Add notes for this task…"
            rows={3}
            className="w-full"
          />
        </div>
      )}

      {/* ── Subtask panel ── */}
      {expanded && (
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3">
          {task.subtasks.length > 0 ? (
            <ul className="space-y-1 mb-3">
              {task.subtasks.map((sub) => (
                <li key={sub.id}>
                  <div className="group/sub flex items-center gap-2 py-0.5">
                    <Checkbox
                      isSelected={sub.done}
                      onChange={(isSelected) => onToggleSubtask(task.id, sub.id, isSelected)}
                      aria-label={sub.text}
                      className="shrink-0"
                    />
                    <span
                      className={
                        'flex-1 text-sm ' +
                        (sub.done ? 'line-through text-muted' : 'text-zinc-700')
                      }
                    >
                      {sub.text}
                    </span>

                    {sub.notes && !subNotesOpen[sub.id] && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition">
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() =>
                          setSubNotesOpen((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }))
                        }
                        className={
                          'text-xs h-auto py-0.5 ' +
                          (subNotesOpen[sub.id]
                            ? 'bg-amber-100 text-amber-700'
                            : 'text-muted')
                        }
                      >
                        Notes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => onDeleteSubtask(task.id, sub.id)}
                        className="text-xs h-auto py-0.5 text-zinc-300 hover:text-red-500"
                      >
                        ×
                      </Button>
                    </div>
                  </div>

                  {subNotesOpen[sub.id] && (
                    <div className="ml-6 mt-1 mb-2">
                      <TextArea
                        aria-label="Subtask notes"
                        value={subNotes[sub.id] ?? ''}
                        onChange={(e) => setSubNotes((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                        onBlur={() =>
                          onUpdateSubtaskNotes(task.id, sub.id, subNotes[sub.id] ?? '')
                        }
                        placeholder="Add notes for this subtask…"
                        rows={2}
                        className="w-full"
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted mb-2">No subtasks yet.</p>
          )}

          {/* Add subtask */}
          <Form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              handleAddSubtask()
            }}
          >
            <input
              aria-label="New subtask"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              autoComplete="off"
              placeholder="Add a subtask…"
              className="flex-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
            <Button type="submit" variant="primary" size="sm">
              Add
            </Button>
          </Form>
        </div>
      )}
    </li>
  )
}

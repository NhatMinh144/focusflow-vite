import { useState } from 'react'
import { Button, Card } from '@heroui/react'
import type { ColorCode } from '../../types'

const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#14b8a6', '#6b7280',
]

interface Props {
  colorCodes: ColorCode[]
  onAdd: (name: string, color: string) => void
  onUpdate: (id: string, name: string, color: string) => void
  onDelete: (id: string) => void
}

function ColorSwatch({ color, selected, onSelect }: {
  color: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="h-7 w-7 rounded-full transition-transform hover:scale-110 active:scale-95 focus:outline-none"
      style={{ backgroundColor: color, boxShadow: selected ? `0 0 0 3px white, 0 0 0 5px ${color}` : undefined }}
      aria-label={color}
    />
  )
}

function ColorCodeRow({ code, onUpdate, onDelete }: {
  code: ColorCode
  onUpdate: (id: string, name: string, color: string) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(code.name)
  const [color, setColor] = useState(code.color)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function save() {
    if (name.trim()) onUpdate(code.id, name.trim(), color)
    setEditing(false)
  }

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <span className="flex-1 text-sm text-red-700">Delete "{code.name}"?</span>
        <Button size="sm" variant="primary" onPress={() => onDelete(code.id)}
          className="bg-red-500 text-white">Yes, delete</Button>
        <Button size="sm" variant="ghost" onPress={() => setConfirmDelete(false)}>Cancel</Button>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Label name"
          autoFocus
          className="rounded-lg border border-zinc-200 px-3 py-2 text-[16px] focus:outline-none focus:ring-2 focus:ring-zinc-300"
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        />
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c) => (
            <ColorSwatch key={c} color={c} selected={color === c} onSelect={() => setColor(c)} />
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onPress={save} isDisabled={!name.trim()}>Save</Button>
          <Button size="sm" variant="ghost" onPress={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: code.color }} />
      <span className="flex-1 text-sm font-medium text-zinc-800">{code.name}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-zinc-400 hover:text-zinc-700 px-2 py-1 rounded transition-colors"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded transition-colors"
      >
        Delete
      </button>
    </div>
  )
}

function AddColorCodeForm({ onAdd }: { onAdd: (name: string, color: string) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PALETTE[5])

  function submit() {
    if (!name.trim()) return
    onAdd(name.trim(), color)
    setName('')
    setColor(PALETTE[5])
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-colors"
      >
        <span className="text-lg leading-none">+</span> Add label
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Label name (e.g. Work, Personal)"
        autoFocus
        className="rounded-lg border border-zinc-200 px-3 py-2 text-[16px] focus:outline-none focus:ring-2 focus:ring-zinc-300"
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false) }}
      />
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((c) => (
          <ColorSwatch key={c} color={c} selected={color === c} onSelect={() => setColor(c)} />
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="primary" onPress={submit} isDisabled={!name.trim()}>Add</Button>
        <Button size="sm" variant="ghost" onPress={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  )
}

export function SettingsView({ colorCodes, onAdd, onUpdate, onDelete }: Props) {
  return (
    <div className="mx-auto max-w-lg">
      <Card className="rounded-2xl shadow-sm">
        <Card.Content className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-1">Task Labels</h2>
          <p className="text-sm text-zinc-400 mb-5">
            Create color labels to organize your tasks by category.
          </p>

          <div className="flex flex-col gap-2">
            {colorCodes.length === 0 && (
              <p className="py-4 text-center text-sm text-zinc-400">
                No labels yet. Add one below.
              </p>
            )}
            {colorCodes.map((code) => (
              <ColorCodeRow
                key={code.id}
                code={code}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
            <AddColorCodeForm onAdd={onAdd} />
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}

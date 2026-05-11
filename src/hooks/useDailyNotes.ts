import { useCallback, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { DailyNote } from '../types'

export function useDailyNotes(userId: string) {
  const [note, setNote] = useState<DailyNote | null>(null)
  const [noteLoading, setNoteLoading] = useState(false)
  const [noteSaving, setNoteSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchNote = useCallback(
    async (date: string) => {
      setNoteLoading(true)
      const { data } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle()
      setNote((data as DailyNote | null) ?? null)
      setNoteLoading(false)
    },
    [userId],
  )

  const saveNote = useCallback(
    async (date: string, content: string) => {
      setNoteSaving(true)
      const { data } = await supabase
        .from('daily_notes')
        .upsert(
          { user_id: userId, date, content, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,date' },
        )
        .select()
        .single()
      if (data) setNote(data as DailyNote)
      setNoteSaving(false)
    },
    [userId],
  )

  /** Optimistically update local state and debounce the DB write (500ms) */
  const saveNoteDebounced = useCallback(
    (date: string, content: string) => {
      // Update local state immediately so the editor stays responsive
      setNote((prev) =>
        prev
          ? { ...prev, content }
          : { id: '', user_id: userId, date, content, created_at: '', updated_at: '' },
      )
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => saveNote(date, content), 500)
    },
    [userId, saveNote],
  )

  return { note, noteLoading, noteSaving, fetchNote, saveNote, saveNoteDebounced }
}

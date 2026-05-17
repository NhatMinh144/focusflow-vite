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
      const { data, error } = await supabase
        .from('daily_notes')
        .upsert(
          { user_id: userId, date, content, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,date' },
        )
        .select()
        .single()
      if (error) {
        console.error('[useDailyNotes] save failed:', error.message, error.details)
      }
      if (data) setNote(data as DailyNote)
      setNoteSaving(false)
    },
    [userId],
  )

  /**
   * Debounce the DB write without touching React state.
   * The Tiptap editor owns its own content — mirroring it into React state
   * on every keystroke causes re-renders that disrupt typing, especially
   * for IME languages (Vietnamese, Chinese, Japanese, Korean).
   */
  const saveNoteDebounced = useCallback(
    (date: string, content: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => saveNote(date, content), 1000)
    },
    [saveNote],
  )

  return { note, noteLoading, noteSaving, fetchNote, saveNote, saveNoteDebounced }
}

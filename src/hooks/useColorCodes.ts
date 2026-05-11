import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ColorCode } from '../types'

export function useColorCodes(userId: string) {
  const [colorCodes, setColorCodes] = useState<ColorCode[]>([])

  const fetchColorCodes = useCallback(async () => {
    const { data } = await supabase
      .from('color_codes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (data) setColorCodes(data as ColorCode[])
  }, [userId])

  useEffect(() => { fetchColorCodes() }, [fetchColorCodes])

  const addColorCode = useCallback(
    async (name: string, color: string) => {
      const { data } = await supabase
        .from('color_codes')
        .insert({ user_id: userId, name, color })
        .select()
        .single()
      if (data) setColorCodes((prev) => [...prev, data as ColorCode])
    },
    [userId],
  )

  const updateColorCode = useCallback(async (id: string, name: string, color: string) => {
    setColorCodes((prev) => prev.map((c) => (c.id === id ? { ...c, name, color } : c)))
    await supabase.from('color_codes').update({ name, color }).eq('id', id)
  }, [])

  const deleteColorCode = useCallback(async (id: string) => {
    setColorCodes((prev) => prev.filter((c) => c.id !== id))
    await supabase.from('color_codes').delete().eq('id', id)
  }, [])

  return { colorCodes, fetchColorCodes, addColorCode, updateColorCode, deleteColorCode }
}

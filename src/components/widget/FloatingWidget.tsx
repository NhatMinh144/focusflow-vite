import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import type { Task } from '../../types'
import { MiniTaskView } from './MiniTaskView'

interface Props {
  tasks: Task[]
  date: string
  onToggleTask: (id: string, done: boolean) => void
}

declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow(options: { width: number; height: number }): Promise<Window>
      window: Window | null
    }
  }
}

export function FloatingWidget({ tasks, date, onToggleTask }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const pipWindowRef = useRef<Window | null>(null)
  const rootRef = useRef<Root | null>(null)

  // Re-render into PiP window whenever tasks or date change
  useEffect(() => {
    if (pipWindowRef.current && rootRef.current) {
      rootRef.current.render(
        <MiniTaskView tasks={tasks} date={date} onToggleTask={onToggleTask} />
      )
    }
  }, [tasks, date, onToggleTask])

  async function openWidget() {
    if (!window.documentPictureInPicture) {
      alert('Tính năng này chỉ hỗ trợ trên Chrome 116 trở lên.')
      return
    }

    try {
      const pipWin = await window.documentPictureInPicture.requestWindow({
        width: 320,
        height: 500,
      })

      pipWindowRef.current = pipWin

      // Copy all injected styles (Tailwind / HeroUI)
      ;[...document.styleSheets].forEach(sheet => {
        try {
          const cssText = [...sheet.cssRules].map(r => r.cssText).join('\n')
          const style = pipWin.document.createElement('style')
          style.textContent = cssText
          pipWin.document.head.appendChild(style)
        } catch {
          // skip cross-origin sheets
        }
      })

      // Set up body
      pipWin.document.body.style.cssText = 'margin:0;padding:0;'

      const container = pipWin.document.createElement('div')
      pipWin.document.body.appendChild(container)

      const root = createRoot(container)
      rootRef.current = root
      root.render(
        <MiniTaskView tasks={tasks} date={date} onToggleTask={onToggleTask} />
      )

      setIsOpen(true)

      pipWin.addEventListener('pagehide', () => {
        rootRef.current = null
        pipWindowRef.current = null
        setIsOpen(false)
      })
    } catch (err) {
      console.error('PiP error:', err)
    }
  }

  function closeWidget() {
    pipWindowRef.current?.close()
  }

  return (
    <button
      onClick={isOpen ? closeWidget : openWidget}
      title={isOpen ? 'Đóng widget' : 'Xem task hôm nay'}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: isOpen ? '#1d4ed8' : '#2563eb',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'background 0.2s, transform 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {isOpen ? (
        // X icon
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      ) : (
        // Checklist icon
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="6" x2="21" y2="6"/>
          <line x1="10" y1="12" x2="21" y2="12"/>
          <line x1="10" y1="18" x2="21" y2="18"/>
          <polyline points="3 6 4 7 6 5"/>
          <polyline points="3 12 4 13 6 11"/>
          <polyline points="3 18 4 19 6 17"/>
        </svg>
      )}
    </button>
  )
}

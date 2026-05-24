import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Card, Spinner } from '@heroui/react'
import type { DailyNote } from '../../types'

interface Props {
  date: string
  note: DailyNote | null
  noteLoading: boolean
  noteSaving: boolean
  onSave: (date: string, content: string) => void
}

// ── Toolbar button ─────────────────────────────────────────────
function ToolbarBtn({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={[
        'flex h-7 w-7 items-center justify-center rounded text-sm font-semibold transition-colors',
        active
          ? 'bg-slate-900 text-white'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export function NotesView({ date, note, noteLoading, noteSaving, onSave }: Props) {
  // Always hold the latest `date` so the stale onUpdate closure uses the right one
  const dateRef = useRef(date)
  useEffect(() => { dateRef.current = date }, [date])

  // Suppress saves triggered by programmatic setContent (not user edits)
  const suppressRef = useRef(false)

  // Track noteLoading transitions so we only reload editor content when a
  // *fetch* completes (navigating to a different date), never when a *save*
  // response arrives. Without this guard, a slow save response can return
  // stale content after the user has already typed more, causing setContent
  // to silently delete characters.
  const prevLoadingRef = useRef(noteLoading)

  const editor = useEditor({
    extensions: [StarterKit],
    content: note?.content ?? '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[240px] px-1',
      },
    },
    onUpdate: ({ editor }) => {
      if (suppressRef.current) return
      onSave(dateRef.current, editor.getHTML())
    },
  })

  // Only reload editor content when noteLoading transitions true → false,
  // meaning a fresh fetch just completed (e.g. user navigated to a new date).
  // Ignores setNote calls that come from saveNote DB responses.
  useEffect(() => {
    if (!editor) return
    const wasLoading = prevLoadingRef.current
    prevLoadingRef.current = noteLoading
    if (wasLoading && !noteLoading) {
      const incoming = note?.content ?? ''
      suppressRef.current = true
      editor.commands.setContent(incoming)
      setTimeout(() => { suppressRef.current = false }, 0)
    }
  }, [noteLoading, note, editor])

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <Card className="rounded-2xl shadow-sm h-full">
      <Card.Content className="p-4 sm:p-5 flex flex-col h-full">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Daily Note</h2>
            <p className="text-xs text-slate-400 mt-0.5">{displayDate}</p>
          </div>
          <div className="text-xs shrink-0">
            {noteSaving ? (
              <span className="text-slate-400">Saving…</span>
            ) : note?.updated_at ? (
              <span className="text-emerald-500 font-medium">Saved ✓</span>
            ) : (
              <span className="text-slate-300">Auto-saves as you type</span>
            )}
          </div>
        </div>

        {noteLoading ? (
          <div className="flex flex-1 justify-center items-center py-16">
            <Spinner color="current" />
          </div>
        ) : (
          <div className="flex flex-col flex-1 gap-3">
            {/* ── Toolbar ── */}
            {editor && (
              <div className="flex flex-wrap items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 px-1.5 py-1">
                <ToolbarBtn
                  active={editor.isActive('bold')}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                >
                  B
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor.isActive('italic')}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                  <em>I</em>
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor.isActive('strike')}
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                  <s>S</s>
                </ToolbarBtn>

                <div className="mx-1 h-4 w-px bg-slate-200" />

                <ToolbarBtn
                  active={editor.isActive('heading', { level: 2 })}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                  H
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor.isActive('bulletList')}
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                  •≡
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor.isActive('orderedList')}
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                  1≡
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor.isActive('blockquote')}
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                  "
                </ToolbarBtn>

                <div className="mx-1 h-4 w-px bg-slate-200" />

                <ToolbarBtn onClick={() => editor.chain().focus().undo().run()}>↩</ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().redo().run()}>↪</ToolbarBtn>
              </div>
            )}

            {/* ── Editor ── */}
            <div className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-blue-300 transition-shadow cursor-text"
              onClick={() => editor?.commands.focus()}>
              <EditorContent editor={editor} />
            </div>
          </div>
        )}
      </Card.Content>
    </Card>
  )
}

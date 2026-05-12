import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Card, Spinner } from '@heroui/react'
import type { DailyNote } from '../../types'

interface Props {
  date: string
  setDate: (d: string) => void
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
        'flex h-8 w-8 items-center justify-center rounded text-sm font-semibold transition-colors',
        active
          ? 'bg-zinc-900 text-white'
          : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export function NotesView({ date, setDate, note, noteLoading, noteSaving, onSave }: Props) {
  const today = new Date().toISOString().slice(0, 10)

  // Always hold the latest `date` so the stale onUpdate closure uses the right one
  const dateRef = useRef(date)
  useEffect(() => { dateRef.current = date }, [date])

  // Suppress saves triggered by programmatic setContent (not user edits)
  const suppressRef = useRef(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: note?.content ?? '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-1',
      },
    },
    onUpdate: ({ editor }) => {
      if (suppressRef.current) return
      onSave(dateRef.current, editor.getHTML())
    },
  })

  // Reload editor content when the fetched note or date changes.
  // We suppress onUpdate so loading content doesn't fire a redundant save.
  useEffect(() => {
    if (!editor) return
    const incoming = note?.content ?? ''
    if (editor.getHTML() !== incoming) {
      suppressRef.current = true
      editor.commands.setContent(incoming)
      // Reset after the synchronous setContent flush completes
      setTimeout(() => { suppressRef.current = false }, 0)
    }
  }, [note, editor])

  const displayDate = date === today
    ? 'Today'
    : new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      })

  return (
    <Card className="rounded-2xl shadow-sm">
      <Card.Content className="p-4 sm:p-6">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-semibold">{displayDate}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {noteSaving ? 'Saving…' : note?.updated_at ? 'Auto-saved' : 'Start typing to create a note'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {date !== today && (
              <button type="button" onClick={() => setDate(today)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 active:bg-zinc-100 transition-colors">
                Today
              </button>
            )}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
          </div>
        </div>

        {noteLoading ? (
          <div className="flex justify-center py-16">
            <Spinner color="current" />
          </div>
        ) : (
          <>
            {/* ── Toolbar ── */}
            {editor && (
              <div className="mb-3 flex flex-wrap items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-1.5">
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

                <div className="mx-1 h-5 w-px bg-zinc-200" />

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

                <div className="mx-1 h-5 w-px bg-zinc-200" />

                <ToolbarBtn onClick={() => editor.chain().focus().undo().run()}>↩</ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().redo().run()}>↪</ToolbarBtn>
              </div>
            )}

            {/* ── Editor ── */}
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-zinc-300">
              <EditorContent editor={editor} />
            </div>
          </>
        )}
      </Card.Content>
    </Card>
  )
}

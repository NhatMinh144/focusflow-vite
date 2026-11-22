# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## How to work with this user

- The user is non-technical. Explain things in simple, plain **Vietnamese** — no unexplained jargon, no assuming they know how to use dashboards.
- Before editing multiple files, describe the plan in plain Vietnamese and get their OK first. Small, single-file fixes don't need this.
- Never print, log, or commit real secrets (Supabase keys, passwords, `.env` contents). The user is very concerned about leaking credentials — when showing env-related code, use placeholders, not real values from `.env`.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # tsc -b && vite build (type-checks, then builds)
npm run lint      # eslint .
npm run preview   # preview production build locally
```

There is no test suite configured in this project.

## Environment

Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` (see `.env.example`). `.env` is gitignored — never commit it or paste its contents into chat/code.

## Architecture

React 19 + TypeScript + Vite 7 app, all data persisted in Supabase (Postgres + RLS, no custom backend).

**Auth gate (`src/App.tsx`)**: `useAuth()` drives top-level routing — loading spinner → password-recovery screen → `AuthScreen` (logged out) → main app (logged in). There's no router library; view state is plain `useState`.

**Main layout**: Split-panel planner.
- `ChecklistApp` (`src/components/checklist/ChecklistApp.tsx`) is the main authenticated shell, switching between `'planner'` and `'monthly'` views (`AppView` type, defined in `Header.tsx`).
- Planner view = `DailyView` (left, fixed ~420px, the task checklist for one date) + `NotesView` (right, flex-1, Tiptap rich-text daily journal), both driven by one shared `date` state.
- `MonthlyView` is a calendar/month grid with drag-to-reschedule.

**Data layer**: One custom hook per Supabase table/concern, all under `src/hooks/`:
- `useAuth.ts` — session, sign in/up/out, password reset/recovery
- `useTasks.ts` (largest hook) — tasks + nested subtasks CRUD, including auto carry-forward of yesterday's undone tasks (runs once per day, tracked via localStorage)
- `useDailyNotes.ts` — the Tiptap journal content per date, autosaves with debounce
- `useColorCodes.ts` — user-defined task color labels

Components call these hooks and receive data + mutator functions as props — there is no global state manager (no Redux/Zustand/Context beyond what's implicit in hook composition).

**Types**: `src/types/index.ts` defines the shared domain shapes (`Task`, `Subtask`, `DailyNote`, `ColorCode`, `MonthTask`, `TaskSummary`) — these should mirror the Supabase schema in `supabase/schema.sql`.

**Supabase schema**: `supabase/schema.sql` (base tables: `tasks`, `subtasks`, both RLS-enabled) plus incremental changes in `supabase/add-notes.sql` and `supabase/migrations/`. When changing the data model, add a new migration file rather than editing `schema.sql` in place.

**UI kit**: HeroUI v3 (compound components, `onPress` not `onClick`, no Provider needed) + Tailwind CSS v4 + `@floating-ui/react` for popovers (see `NotePopover.tsx` for the floating note-editor pattern used on both desktop popover and mobile bottom sheet).

**Deployment**: Vercel, auto-deploys from `main` on push (project `NhatMinh144/focusflow-vite`). `vercel.json` rewrites all routes to `index.html` for SPA routing. Supabase Auth redirect URLs must include the Vercel domain for login to work in production.

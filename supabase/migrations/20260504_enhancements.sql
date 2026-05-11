-- ============================================================
-- FocusFlow enhancements: date ranges, color codes, daily notes
-- Run this in Supabase SQL Editor (project → SQL Editor → New query)
-- ============================================================

-- ── Feature 1: Task date ranges ──────────────────────────────
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS date_range_start date,
  ADD COLUMN IF NOT EXISTS date_range_end   date;

-- ── Feature 2: Color codes ───────────────────────────────────
CREATE TABLE IF NOT EXISTS color_codes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        text        NOT NULL,
  color       text        NOT NULL,   -- hex, e.g. '#3b82f6'
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE color_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'color_codes' AND policyname = 'users manage own color codes'
  ) THEN
    CREATE POLICY "users manage own color codes"
      ON color_codes FOR ALL
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS color_code_id uuid REFERENCES color_codes(id) ON DELETE SET NULL;

-- ── Feature 3: Daily notes ───────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_notes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date        date        NOT NULL,
  content     text        NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_notes' AND policyname = 'users manage own daily notes'
  ) THEN
    CREATE POLICY "users manage own daily notes"
      ON daily_notes FOR ALL
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── Rollback (run manually if needed) ────────────────────────
-- ALTER TABLE tasks DROP COLUMN IF EXISTS date_range_start;
-- ALTER TABLE tasks DROP COLUMN IF EXISTS date_range_end;
-- ALTER TABLE tasks DROP COLUMN IF EXISTS color_code_id;
-- DROP TABLE IF EXISTS color_codes;
-- DROP TABLE IF EXISTS daily_notes;

-- Run this in Supabase SQL Editor to add notes to tasks and subtasks
ALTER TABLE tasks    ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';

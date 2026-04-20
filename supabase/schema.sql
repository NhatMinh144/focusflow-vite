-- Run this in your Supabase SQL editor (https://supabase.com/dashboard → SQL Editor)

create table tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  text        text not null,
  date        date not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

create table subtasks (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid references tasks(id) on delete cascade not null,
  text        text not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Indexes for common queries
create index tasks_user_date on tasks (user_id, date);
create index subtasks_task_id on subtasks (task_id);

-- Row Level Security — users can only see/modify their own data
alter table tasks    enable row level security;
alter table subtasks enable row level security;

create policy "users manage own tasks"
  on tasks for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own subtasks"
  on subtasks for all
  using  (exists (select 1 from tasks where tasks.id = subtasks.task_id and tasks.user_id = auth.uid()))
  with check (exists (select 1 from tasks where tasks.id = subtasks.task_id and tasks.user_id = auth.uid()));

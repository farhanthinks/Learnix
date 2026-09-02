-- Freeform calendar entries (manually added sessions/tasks/revisions/exams)
-- that aren't tied to an auto-extracted syllabus topic, unlike study_plans
-- rows. The Calendar page merges this table with study_plans to build one
-- unified view; each row carries its own time (study_plans rows borrow
-- their subject's slot time instead).
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  event_type text not null default 'study'
    check (event_type in ('study', 'revision', 'practice', 'exam', 'other')),
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  scheduled_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'done')),
  notes text,
  google_event_id text,
  created_at timestamp with time zone default now()
);

alter table public.calendar_events enable row level security;

create policy "Users can view own calendar events"
  on public.calendar_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own calendar events"
  on public.calendar_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update own calendar events"
  on public.calendar_events for update
  using (auth.uid() = user_id);

create policy "Users can delete own calendar events"
  on public.calendar_events for delete
  using (auth.uid() = user_id);

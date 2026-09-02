create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  topic_id uuid references topics(id) on delete cascade not null,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone,
  duration_minutes integer,
  created_at timestamp with time zone default now()
);

alter table study_sessions enable row level security;
create policy "Users manage own study sessions" on study_sessions
  for all using (auth.uid() = user_id);

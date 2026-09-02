create table study_plans (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade not null,
  topic_id uuid references topics(id) on delete cascade not null,
  scheduled_date date not null,
  planned_minutes integer default 45,
  created_at timestamp with time zone default now()
);

alter table study_plans enable row level security;

create policy "Users manage own study plans" on study_plans
  for all using (
    exists (select 1 from subjects where subjects.id = study_plans.subject_id and subjects.user_id = auth.uid())
  );

-- Add study preferences to profiles (daily available hours, preferred study days)
alter table profiles add column daily_study_minutes integer default 90;
alter table profiles add column study_days text[] default array['mon','tue','wed','thu','fri','sat'];

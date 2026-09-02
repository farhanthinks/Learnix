create table topic_notes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete cascade not null,
  content text not null, -- markdown-formatted notes
  generated_at timestamp with time zone default now()
);

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete cascade not null,
  generated_at timestamp with time zone default now()
);

create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade not null,
  question text not null,
  question_type text check (question_type in ('mcq', 'short_answer')) not null,
  options text[], -- null for short_answer
  correct_answer text not null,
  explanation text,
  order_index integer not null
);

create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  score integer not null,
  total_questions integer not null,
  answers jsonb not null, -- {question_id: user_answer}
  completed_at timestamp with time zone default now()
);

alter table topic_notes enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;

create policy "Users manage own topic notes" on topic_notes
  for all using (exists (select 1 from topics t join subjects s on s.id = t.subject_id where t.id = topic_notes.topic_id and s.user_id = auth.uid()));

create policy "Users manage own quizzes" on quizzes
  for all using (exists (select 1 from topics t join subjects s on s.id = t.subject_id where t.id = quizzes.topic_id and s.user_id = auth.uid()));

create policy "Users manage own quiz questions" on quiz_questions
  for all using (exists (select 1 from quizzes q join topics t on t.id = q.topic_id join subjects s on s.id = t.subject_id where q.id = quiz_questions.quiz_id and s.user_id = auth.uid()));

create policy "Users manage own quiz attempts" on quiz_attempts
  for all using (auth.uid() = user_id);

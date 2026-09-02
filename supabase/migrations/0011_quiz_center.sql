-- Quizzes page redesign: distinguishes topic quizzes from full-syllabus mock
-- tests, and turns quiz_attempts into a resumable record (not just a
-- completed-attempt log) so "Continue Practice" can show in-progress quizzes.

alter table quizzes
  alter column topic_id drop not null,
  add column subject_id uuid references subjects(id) on delete cascade,
  add column quiz_type text not null default 'topic' check (quiz_type in ('topic', 'mock')),
  add column title text not null default '',
  add column difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  add column time_limit_minutes integer,
  add column question_count integer not null default 0;

update quizzes q
set subject_id = t.subject_id
from topics t
where q.topic_id = t.id and q.subject_id is null;

update quizzes q
set question_count = (select count(*) from quiz_questions where quiz_id = q.id)
where q.question_count = 0;

update quizzes q
set title = coalesce((select t.title || ' Quiz' from topics t where t.id = q.topic_id), 'Quiz')
where q.title = '';

update quizzes q
set difficulty = t.difficulty::text
from topics t
where q.topic_id = t.id and q.difficulty is null;

alter table quizzes
  add constraint quizzes_type_ref_check check (
    (quiz_type = 'topic' and topic_id is not null and subject_id is not null)
    or (quiz_type = 'mock' and topic_id is null and subject_id is not null)
  );

alter table quiz_questions
  add column topic_id uuid references topics(id) on delete set null;

update quiz_questions qq
set topic_id = q.topic_id
from quizzes q
where qq.quiz_id = q.id and q.topic_id is not null;

alter table quiz_attempts
  alter column score set default 0,
  alter column answers set default '{}'::jsonb,
  add column started_at timestamp with time zone default now(),
  add column is_completed boolean not null default true,
  add column current_question_index integer not null default 0,
  add column flagged_questions jsonb not null default '[]'::jsonb,
  add column time_taken_seconds integer;

update quiz_attempts set started_at = completed_at where started_at is null;

create index quiz_attempts_user_incomplete_idx on quiz_attempts (user_id, is_completed);
create index quizzes_subject_id_idx on quizzes (subject_id);
create index quiz_questions_topic_id_idx on quiz_questions (topic_id);

drop policy "Users manage own quizzes" on quizzes;
create policy "Users manage own quizzes" on quizzes
  for all using (
    (topic_id is not null and exists (
      select 1 from topics t join subjects s on s.id = t.subject_id
      where t.id = quizzes.topic_id and s.user_id = auth.uid()
    ))
    or (subject_id is not null and exists (
      select 1 from subjects s where s.id = quizzes.subject_id and s.user_id = auth.uid()
    ))
  );

drop policy "Users manage own quiz questions" on quiz_questions;
create policy "Users manage own quiz questions" on quiz_questions
  for all using (
    exists (
      select 1 from quizzes q
      where q.id = quiz_questions.quiz_id
      and (
        (q.topic_id is not null and exists (
          select 1 from topics t join subjects s on s.id = t.subject_id
          where t.id = q.topic_id and s.user_id = auth.uid()
        ))
        or (q.subject_id is not null and exists (
          select 1 from subjects s where s.id = q.subject_id and s.user_id = auth.uid()
        ))
      )
    )
  );

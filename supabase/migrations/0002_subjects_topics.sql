create extension if not exists pgcrypto;

create table subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  exam_date date,
  syllabus_file_url text,
  -- Extraction lifecycle, needed so the UI can show "processing" / a specific
  -- failure reason (e.g. scanned PDF) and let the user retry without
  -- re-uploading. Not in the original spec's schema, but required to satisfy
  -- the error-handling acceptance criteria.
  extraction_status text check (extraction_status in ('pending', 'processing', 'done', 'failed')) default 'pending',
  extraction_error text,
  extraction_warning text,
  created_at timestamp with time zone default now()
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade not null,
  unit_no integer,
  -- Human-readable unit label. The base schema only stores unit_no (an
  -- integer), which loses the AI-generated unit title needed to render
  -- "units → topics" grouping on the subject page. Denormalized onto each
  -- topic row rather than introducing a separate units table, consistent
  -- with how subtopics are already stored inline as text[].
  unit_title text,
  title text not null,
  subtopics text[], -- array of subtopic strings
  difficulty text check (difficulty in ('easy', 'medium', 'hard')) default 'medium',
  status text check (status in ('pending', 'in_progress', 'done')) default 'pending',
  created_at timestamp with time zone default now()
);

alter table subjects enable row level security;
alter table topics enable row level security;

create policy "Users manage own subjects" on subjects
  for all using (auth.uid() = user_id);

create policy "Users manage own topics" on topics
  for all using (
    exists (select 1 from subjects where subjects.id = topics.subject_id and subjects.user_id = auth.uid())
  );

-- Storage bucket for uploaded syllabus PDFs, private by default. Objects are
-- stored at "{user_id}/{subject_id}.pdf" so folder-based RLS below can scope
-- access to each user's own files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('syllabi', 'syllabi', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

create policy "Users manage own syllabi"
  on storage.objects for all
  using (bucket_id = 'syllabi' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'syllabi' and (storage.foldername(name))[1] = auth.uid()::text);

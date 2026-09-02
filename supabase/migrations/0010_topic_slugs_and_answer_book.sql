-- Clean topic URLs for the AI Answer Book
-- (/dashboard/answer-book/computer-networks/osi-reference-model), mirroring
-- the subject slug design: unique per subject (not globally), UUID stays
-- the real key.
alter table topics add column slug text;

do $$
declare
  r record;
  base_slug text;
  candidate text;
  suffix int;
begin
  for r in select id, subject_id, title from topics order by created_at loop
    base_slug := lower(regexp_replace(r.title, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then
      base_slug := 'topic';
    end if;

    candidate := base_slug;
    suffix := 2;
    while exists (
      select 1 from topics
      where subject_id = r.subject_id and slug = candidate and id <> r.id
    ) loop
      candidate := base_slug || '-' || suffix;
      suffix := suffix + 1;
    end loop;

    update topics set slug = candidate where id = r.id;
  end loop;
end $$;

alter table topics alter column slug set not null;
create unique index topics_subject_id_slug_key on topics (subject_id, slug);

-- The AI Answer Book shows genuinely distinct content per tab, not the same
-- notes blob relabeled — these columns hold the extra generated sections.
-- `content` (existing) is the Study Notes tab; the rest are new.
alter table topic_notes add column summary text;
alter table topic_notes add column key_points text[];
alter table topic_notes add column examples text;
alter table topic_notes add column qa jsonb; -- [{ "question": "...", "answer": "..." }]

-- Lets a student bookmark a generated material for the Answer Book
-- library's "Saved Materials" section.
alter table topic_notes add column is_saved boolean not null default false;

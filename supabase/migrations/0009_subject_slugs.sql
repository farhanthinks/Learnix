-- Clean, slug-based subject URLs (/dashboard/subjects/computer-networks)
-- instead of raw UUIDs. The UUID stays the primary key and every foreign
-- key; the slug is purely a routing/display alias, unique per user (not
-- globally — two different users can each have a "computer-networks").
alter table subjects add column slug text;

-- Backfill existing rows. Done procedurally since generating a
-- collision-free slug per row (numbering only actual duplicates) isn't a
-- simple set-based update.
do $$
declare
  r record;
  base_slug text;
  candidate text;
  suffix int;
begin
  for r in select id, user_id, name from subjects order by created_at loop
    base_slug := lower(regexp_replace(r.name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then
      base_slug := 'subject';
    end if;

    candidate := base_slug;
    suffix := 2;
    while exists (
      select 1 from subjects
      where user_id = r.user_id and slug = candidate and id <> r.id
    ) loop
      candidate := base_slug || '-' || suffix;
      suffix := suffix + 1;
    end loop;

    update subjects set slug = candidate where id = r.id;
  end loop;
end $$;

alter table subjects alter column slug set not null;
create unique index subjects_user_id_slug_key on subjects (user_id, slug);

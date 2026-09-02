-- Each subject now owns its own recurring daily study slot instead of
-- drawing from one global daily budget (profiles.daily_study_minutes /
-- study_days). Nullable because subjects created before this migration
-- won't have one set yet — the UI treats a missing slot as "needs setup"
-- rather than assuming a default, since silently picking a time could
-- create an invisible conflict with another subject.
alter table subjects add column slot_start_time time;
alter table subjects add column slot_end_time time;
alter table subjects add column slot_days text[];

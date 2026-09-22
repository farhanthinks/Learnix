-- Study-plan generation now asks about breaks between sessions and chains
-- same-day sessions sequentially (instead of every row independently
-- starting at the subject's slot start time), so study_plans rows need
-- their own explicit times. Nullable: legacy rows fall back to the old
-- slot-derived rendering at read time (see lib/calendar/session.ts).
alter table study_plans
  add column start_time time,
  add column end_time time;

-- Per-subject break preferences, reused (not re-asked) on every regenerate.
alter table subjects
  add column break_enabled boolean not null default false,
  add column break_minutes integer,
  add column break_frequency integer;

-- Breaks are stored as calendar_events rows (topic_id/subject-agnostic
-- infrastructure already exists there) so they're independently editable
-- and deletable like any other manually-added entry.
alter table calendar_events drop constraint calendar_events_event_type_check;
alter table calendar_events add constraint calendar_events_event_type_check
  check (event_type in ('study', 'revision', 'practice', 'exam', 'other', 'break'));

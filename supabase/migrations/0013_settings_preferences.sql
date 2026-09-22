-- Settings page preferences. These persist the user's choice even though a
-- few of the underlying features aren't implemented app-wide yet (there is
-- no notification-delivery system, and the app currently ships one light
-- theme only) — the Settings UI discloses this; the value is still saved
-- for when those features exist.
alter table profiles
  add column study_reminders_enabled boolean not null default true,
  add column exam_reminders_enabled boolean not null default true,
  add column app_lock_enabled boolean not null default false,
  add column theme_preference text not null default 'light'
    check (theme_preference in ('light', 'dark', 'system'));

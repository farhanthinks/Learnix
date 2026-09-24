-- Simple textbook/reference-book names (no URLs) generated alongside a
-- topic's study notes, shown in the AI Answer Book's References tab.
alter table topic_notes
  add column textbook_references text[] not null default '{}';

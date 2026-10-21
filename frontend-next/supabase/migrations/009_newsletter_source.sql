-- Which blog or white paper a subscriber joined from.
-- Safe to run more than once.
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS source_slug TEXT,
  ADD COLUMN IF NOT EXISTS source_title TEXT;

-- Optional insight captured on the public unsubscribe form
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_reason TEXT;

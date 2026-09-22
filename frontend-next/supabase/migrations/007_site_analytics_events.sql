-- First-party site analytics events (GDPR retention ~180 days)
CREATE TABLE IF NOT EXISTS site_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('page_view', 'consent', 'custom')),
  session_id TEXT NOT NULL,
  path TEXT,
  referrer TEXT,
  user_agent TEXT,
  consent_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  marketing_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  custom_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_analytics_created ON site_analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_analytics_kind_created ON site_analytics_events(kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_analytics_session ON site_analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_site_analytics_path ON site_analytics_events(path);

ALTER TABLE site_analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only site analytics" ON site_analytics_events;
-- No public policies: inserts/reads go through service-role API routes only

-- Enrich consent_events for backward compatibility (optional columns)
ALTER TABLE consent_events
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS path TEXT,
  ADD COLUMN IF NOT EXISTS pseudonymized_ip TEXT,
  ADD COLUMN IF NOT EXISTS consent_status TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT;

CREATE INDEX IF NOT EXISTS idx_consent_events_session ON consent_events(session_id);

-- GDPR retention ~180 days (15552000 seconds). Call periodically (e.g. daily cron / Supabase schedule).
CREATE OR REPLACE FUNCTION cleanup_site_analytics_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM site_analytics_events
  WHERE created_at < now() - interval '180 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

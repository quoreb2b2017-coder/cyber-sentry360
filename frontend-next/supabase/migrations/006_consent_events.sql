-- Anonymous cookie consent decisions for GDPR/CCPA admin reporting (no PII)
CREATE TABLE IF NOT EXISTS consent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  choice TEXT NOT NULL CHECK (choice IN ('accept_all', 'reject_all', 'custom')),
  necessary BOOLEAN NOT NULL DEFAULT true,
  analytics BOOLEAN NOT NULL DEFAULT false,
  marketing BOOLEAN NOT NULL DEFAULT false,
  consent_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_events_created ON consent_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_events_choice ON consent_events(choice);

ALTER TABLE consent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert consent events" ON consent_events;
CREATE POLICY "Public insert consent events"
  ON consent_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin read consent events" ON consent_events;
CREATE POLICY "Admin read consent events"
  ON consent_events FOR SELECT
  TO authenticated
  USING (true);

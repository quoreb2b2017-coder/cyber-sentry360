-- Resources library (white papers, reports, case studies, webinars, guides)
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  offered_by TEXT DEFAULT 'cybersentry360',
  author TEXT,
  category TEXT NOT NULL CHECK (category IN ('whitepaper', 'report', 'case_study', 'webinar', 'guide')),
  vertical TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[] DEFAULT '{}',
  overview TEXT,
  inside_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  pdf_url TEXT,
  pdf_path TEXT,
  cover_url TEXT,
  cover_path TEXT,
  form_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_vertical ON resources(vertical);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS resource_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE resource_downloads ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

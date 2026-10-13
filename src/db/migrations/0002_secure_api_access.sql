-- Compatibility with existing installations of the initial schema.
ALTER TABLE public.svg_assets ADD COLUMN IF NOT EXISTS style TEXT;
ALTER TABLE public.svg_assets ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'vectorhub-core';
ALTER TABLE public.svg_assets ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE public.svg_assets ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;
ALTER TABLE public.svg_assets ADD COLUMN IF NOT EXISTS storage_path TEXT;
-- All access goes through the server API, which checks administrator rights.
-- Run after 0001_init.sql in the Supabase SQL Editor.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.categories FROM anon, authenticated;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.collections FROM anon, authenticated;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.licenses FROM anon, authenticated;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.tags FROM anon, authenticated;
ALTER TABLE public.svg_assets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.svg_assets FROM anon, authenticated;
ALTER TABLE public.svg_asset_tags ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.svg_asset_tags FROM anon, authenticated;

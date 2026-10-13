/**
 * PostgreSQL Database Schema for VectorHub SVG Library
 * Compatible with PostgreSQL 15+, Supabase, and Drizzle ORM
 */

export interface DbSvgAsset {
  id: string; // UUID primary key
  name: string;
  slug: string;
  description: string;
  svg_content: string;
  thumbnail_path: string;
  collection_id: string;
  category_id: string;
  license_id: string;
  width: number;
  height: number;
  view_box: string;
  file_size: number; // in bytes
  status: 'published' | 'draft' | 'archived';
  style?: string | null; // e.g. 'solid', 'regular', 'light', 'thin', 'duotone', 'brands', 'sharp-solid'
  source?: string | null; // e.g. 'font-awesome-pro', 'local-import', 'vectorhub-core'
  storage_path?: string | null; // Local preserved filesystem path
  content_hash?: string | null; // SHA-256 content digest for duplicate detection
  is_pro?: boolean | null; // Font Awesome Pro or proprietary asset flag
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface DbCategory {
  id: string; // UUID
  name: string;
  slug: string;
  description: string;
}

export interface DbCollection {
  id: string; // UUID
  name: string;
  slug: string;
  description: string;
  source_url: string;
  author: string;
}

export interface DbLicense {
  id: string; // UUID
  name: string;
  license_url: string;
  attribution_required: boolean;
  commercial_use_allowed: boolean;
}

export interface DbTag {
  id: string; // UUID
  name: string;
  slug: string;
}

export interface DbSvgAssetTag {
  asset_id: string;
  tag_id: string;
}

export interface DbProfile {
  id: string; // UUID / auth.uid
  display_name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

/**
 * SQL Migration DDL definition for PostgreSQL / Supabase
 */
export const POSTGRES_MIGRATION_SQL = `
-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Auth Users & Roles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT ''
);

-- 3. Collections Table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  author TEXT NOT NULL DEFAULT 'VectorHub Open Source'
);

-- 4. Licenses Table
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  license_url TEXT DEFAULT '',
  attribution_required BOOLEAN NOT NULL DEFAULT FALSE,
  commercial_use_allowed BOOLEAN NOT NULL DEFAULT TRUE
);

-- 5. Tags Table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- 6. SVG Assets Table
CREATE TABLE IF NOT EXISTS svg_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  svg_content TEXT NOT NULL,
  thumbnail_path TEXT DEFAULT '',
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
  width INTEGER NOT NULL DEFAULT 24,
  height INTEGER NOT NULL DEFAULT 24,
  view_box TEXT NOT NULL DEFAULT '0 0 24 24',
  file_size INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  style TEXT,
  source TEXT DEFAULT 'vectorhub-core',
  storage_path TEXT,
  content_hash TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SVG Asset Tags Join Table
CREATE TABLE IF NOT EXISTS svg_asset_tags (
  asset_id UUID REFERENCES svg_assets(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (asset_id, tag_id)
);

-- Compatibility with existing installations of the initial schema.
ALTER TABLE public.svg_assets ADD COLUMN IF NOT EXISTS style TEXT;
ALTER TABLE public.svg_assets ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'vectorhub-core';
ALTER TABLE public.svg_assets ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE public.svg_assets ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;
ALTER TABLE public.svg_assets ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Indexes for high-performance directory querying & pagination
CREATE INDEX IF NOT EXISTS idx_svg_assets_status_created ON svg_assets (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_svg_assets_category ON svg_assets (category_id);
CREATE INDEX IF NOT EXISTS idx_svg_assets_collection ON svg_assets (collection_id);
CREATE INDEX IF NOT EXISTS idx_svg_assets_slug ON svg_assets (slug);
CREATE INDEX IF NOT EXISTS idx_svg_assets_style ON svg_assets (style);
CREATE INDEX IF NOT EXISTS idx_svg_assets_content_hash ON svg_assets (content_hash);
CREATE INDEX IF NOT EXISTS idx_svg_assets_source ON svg_assets (source);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags (slug);
CREATE INDEX IF NOT EXISTS idx_svg_asset_tags_tag ON svg_asset_tags (tag_id);

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
`;

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { dbStore } from './database.js';
import { POSTGRES_MIGRATION_SQL } from './schema.js';

export interface SupabaseConfigInfo {
  isConfigured: boolean;
  supabaseUrl: string | null;
  hasSecretKey: boolean;
  hasPublishableKey: boolean;
  hasDatabaseUrl: boolean;
  databaseUrlRequiresPassword: boolean;
  databaseHost: string | null;
}

function getCredentials() {
  const url = process.env.SVG_SUPABASE_URL || '';
  const key =
    process.env.SVG_SUPABASE_SECRET_KEY ||
    process.env.SVG_SUPABASE_SERVICE_ROLE_KEY ||
    '';
  return { url, key };
}

// Lazy/singleton client
let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;
  const { url, key } = getCredentials();
  if (!url || !key) return null;

  try {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return clientInstance;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function getSupabaseConfigInfo(): SupabaseConfigInfo {
  const dbUrl = process.env.SVG_DATABASE_URL || '';
  const url = process.env.SVG_SUPABASE_URL || '';
  const secretKey = process.env.SVG_SUPABASE_SECRET_KEY || process.env.SVG_SUPABASE_SERVICE_ROLE_KEY || '';
  const pubKey = process.env.SVG_SUPABASE_PUBLISHABLE_KEY || process.env.SVG_SUPABASE_ANON_KEY || '';

  const requiresPassword = dbUrl.includes('[YOUR-PASSWORD]');
  let dbHost: string | null = null;
  if (dbUrl) {
    const match = dbUrl.match(/@([^:/]+)/);
    if (match) dbHost = match[1];
  }

  return {
    isConfigured: Boolean(url && secretKey),
    supabaseUrl: url || null,
    hasSecretKey: Boolean(secretKey),
    hasPublishableKey: Boolean(pubKey),
    hasDatabaseUrl: Boolean(dbUrl),
    databaseUrlRequiresPassword: requiresPassword,
    databaseHost: dbHost,
  };
}

export interface SupabaseHealthCheck {
  connected: boolean;
  url: string;
  tablesStatus: {
    svg_assets: boolean;
    categories: boolean;
    collections: boolean;
    licenses: boolean;
    profiles: boolean;
  };
  remoteCounts: {
    svg_assets?: number;
    categories?: number;
    collections?: number;
  };
  tablesExist: boolean;
  message: string;
  error?: string;
  migrationSql: string;
}

export async function checkSupabaseHealth(): Promise<SupabaseHealthCheck> {
  const client = getSupabaseClient();
  const info = getSupabaseConfigInfo();

  if (!client || !info.supabaseUrl) {
    return {
      connected: false,
      url: info.supabaseUrl || 'Not configured',
      tablesStatus: {
        svg_assets: false,
        categories: false,
        collections: false,
        licenses: false,
        profiles: false,
      },
      remoteCounts: {},
      tablesExist: false,
      message: 'Supabase credentials are not configured in environment variables.',
      migrationSql: POSTGRES_MIGRATION_SQL,
    };
  }

  const tablesStatus = {
    svg_assets: false,
    categories: false,
    collections: false,
    licenses: false,
    profiles: false,
  };
  const remoteCounts: Record<string, number> = {};

  try {
    // Check svg_assets table
    const { error: assetErr } = await client.from('svg_assets').select('id').limit(1);
    if (!assetErr) {
      tablesStatus.svg_assets = true;
      const { count } = await client.from('svg_assets').select('*', { count: 'exact', head: true });
      remoteCounts.svg_assets = count || 0;
    }

    // Check categories table
    const { error: catErr } = await client.from('categories').select('id').limit(1);
    if (!catErr) {
      tablesStatus.categories = true;
      const { count } = await client.from('categories').select('*', { count: 'exact', head: true });
      remoteCounts.categories = count || 0;
    }

    // Check collections table
    const { error: colErr } = await client.from('collections').select('id').limit(1);
    if (!colErr) {
      tablesStatus.collections = true;
      const { count } = await client.from('collections').select('*', { count: 'exact', head: true });
      remoteCounts.collections = count || 0;
    }

    // Check licenses
    const { error: licErr } = await client.from('licenses').select('id').limit(1);
    if (!licErr) tablesStatus.licenses = true;

    // Check profiles
    const { error: profErr } = await client.from('profiles').select('id').limit(1);
    if (!profErr) tablesStatus.profiles = true;

    const allExist = Object.values(tablesStatus).every(Boolean);

    return {
      connected: Object.values(tablesStatus).some(Boolean),
      url: info.supabaseUrl,
      tablesStatus,
      remoteCounts,
      tablesExist: allExist,
      message: allExist
        ? `Successfully connected to Supabase (${info.supabaseUrl}). All required tables are active.`
        : `Connected to Supabase endpoint (${info.supabaseUrl}), but database tables are not created yet. Copy and run the SQL migration schema in your Supabase SQL Editor.`,
      migrationSql: POSTGRES_MIGRATION_SQL,
    };
  } catch (err: any) {
    return {
      connected: false,
      url: info.supabaseUrl,
      tablesStatus,
      remoteCounts,
      tablesExist: false,
      message: 'Failed to communicate with Supabase API: ' + (err?.message || String(err)),
      error: err?.message || String(err),
      migrationSql: POSTGRES_MIGRATION_SQL,
    };
  }
}

export interface SyncResult {
  success: boolean;
  categoriesSynced: number;
  collectionsSynced: number;
  licensesSynced: number;
  assetsSynced: number;
  errors: string[];
  durationMs: number;
}

/**
 * Syncs local database collections, categories, licenses, and SVG assets to Supabase
 */
export async function syncLocalDatabaseToSupabase(): Promise<SyncResult> {
  const start = Date.now();
  const client = getSupabaseClient();
  const errors: string[] = [];

  if (!client) {
    return {
      success: false,
      categoriesSynced: 0,
      collectionsSynced: 0,
      licensesSynced: 0,
      assetsSynced: 0,
      errors: ['Supabase client not configured'],
      durationMs: 0,
    };
  }

  const health = await checkSupabaseHealth();
  if (!health.tablesExist) {
    return {
      success: false,
      categoriesSynced: 0,
      collectionsSynced: 0,
      licensesSynced: 0,
      assetsSynced: 0,
      errors: [
        'Database tables do not exist in Supabase yet. Please click "Copy SQL Migration DDL" in the Admin Dashboard and execute it in your Supabase SQL Editor, then retry syncing.'
      ],
      durationMs: Date.now() - start,
    };
  }

  let categoriesSynced = 0;
  let collectionsSynced = 0;
  let licensesSynced = 0;
  let assetsSynced = 0;

  try {
    const mappings: Record<string, Map<string, string>> = {};
    for (const [table, rows, conflict] of [
      ['categories', dbStore.getCategories(), 'slug'],
      ['collections', dbStore.getCollections(), 'slug'],
      ['licenses', dbStore.getLicenses(), 'name'],
    ] as const) {
      mappings[table] = new Map();
      for (const row of rows) {
        const { id, count: _count, ...fields } = row as any;
        const { data, error } = await client.from(table).upsert(fields, { onConflict: conflict }).select('id').single();
        if (error || !data) { errors.push(`${table}: synchronization failed`); continue; }
        mappings[table].set(id, data.id);
        if (table === 'categories') categoriesSynced++;
        if (table === 'collections') collectionsSynced++;
        if (table === 'licenses') licensesSynced++;
      }
    }
    const tagIds = new Map<string, string>();
    for (const tag of dbStore.getTags()) {
      const { data, error } = await client.from('tags').upsert({ name: tag.name, slug: tag.slug }, { onConflict: 'slug' }).select('id').single();
      if (error || !data) errors.push('Tag synchronization failed');
      else tagIds.set(tag.name, data.id);
    }
    // The local store caps each page at 100; walk every page, including drafts.
    const firstPage = dbStore.getSvgAssets({ status: 'all', page: 1, limit: 100 });
    for (let page = 1; page <= firstPage.totalPages; page++) {
      const assets = page === 1 ? firstPage.items : dbStore.getSvgAssets({ status: 'all', page, limit: 100 }).items;
      for (const asset of assets) {
        const { id, category, collection, license, tags, ...row } = asset as any;
        row.category_id = mappings.categories.get(asset.category_id) || null;
        row.collection_id = mappings.collections.get(asset.collection_id) || null;
        row.license_id = mappings.licenses.get(asset.license_id) || null;
        const { data, error } = await client.from('svg_assets').upsert(row, { onConflict: 'slug' }).select('id').single();
        if (error || !data) { errors.push(`Asset ${asset.slug}: synchronization failed`); continue; }
        const { error: deleteError } = await client.from('svg_asset_tags').delete().eq('asset_id', data.id);
        const links = tags.filter((name: string) => tagIds.has(name)).map((name: string) => ({ asset_id: data.id, tag_id: tagIds.get(name)! }));
        const linkResult = links.length ? await client.from('svg_asset_tags').insert(links) : { error: null };
        if (deleteError || linkResult.error) errors.push(`Asset ${asset.slug}: tag synchronization failed`);
        else assetsSynced++;
      }
    }
  } catch (err: any) {
    errors.push('Sync exception: ' + (err?.message || String(err)));
  }

  return {
    success: errors.length === 0,
    categoriesSynced,
    collectionsSynced,
    licensesSynced,
    assetsSynced,
    errors,
    durationMs: Date.now() - start,
  };
}

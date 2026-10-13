import { randomUUID } from 'node:crypto';
import { dbStore } from './database.js';
import { getSupabaseClient } from './supabaseClient.js';

const selection = '*,category:categories(name,slug),collection:collections(name,slug,author),license:licenses(name,license_url),svg_asset_tags(tags(name,slug))';
function enrich(row: any) {
  const { svg_asset_tags = [], ...asset } = row;
  return { ...asset, tags: svg_asset_tags.map((link: any) => link.tags?.name).filter(Boolean) };
}
function client() {
  const remote = getSupabaseClient();
  if (!remote && (process.env.VERCEL || process.env.NODE_ENV === 'production')) throw new Error('Configure SVG_SUPABASE_URL and SVG_SUPABASE_SECRET_KEY');
  return remote;
}
function check(error: any) { if (error) throw new Error('Database operation failed'); }

export const assetRepository = {
  async getSvgAssets(params: Parameters<typeof dbStore.getSvgAssets>[0] = {}) {
    const remote = client();
    if (!remote) return dbStore.getSvgAssets(params);
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(1000, Math.max(1, Number(params.limit) || 24));
    let query = remote.from('svg_assets').select(selection, { count: 'exact' });
    if (params.status !== 'all') query = query.eq('status', params.status || 'published');
    for (const [slug, table, column] of [[params.categorySlug, 'categories', 'category_id'], [params.collectionSlug, 'collections', 'collection_id']] as const) {
      if (slug && slug !== 'all') {
        const { data, error } = await remote.from(table).select('id').eq('slug', slug).maybeSingle(); check(error);
        if (!data) return { items: [], total: 0, page, limit, totalPages: 1 };
        query = query.eq(column, data.id);
      }
    }
    if (params.tagSlug) {
      const { data: tag, error } = await remote.from('tags').select('id').eq('slug', params.tagSlug).maybeSingle(); check(error);
      if (!tag) return { items: [], total: 0, page, limit, totalPages: 1 };
      const { data: links, error: linkError } = await remote.from('svg_asset_tags').select('asset_id').eq('tag_id', tag.id); check(linkError);
      if (!links?.length) return { items: [], total: 0, page, limit, totalPages: 1 };
      query = query.in('id', links.map(link => link.asset_id));
    }
    if (params.style && params.style !== 'all') query = query.eq('style', params.style);
    if (params.source && params.source !== 'all') query = query.eq('source', params.source);
    if (params.is_pro !== undefined) query = query.eq('is_pro', params.is_pro);
    if (params.search?.trim()) {
      // Remove PostgREST filter syntax; only literal text enters the search filter.
      const text = params.search.trim().replace(/[%,()."\\]/g, ' ').slice(0, 100);
      query = query.or(`name.ilike.%${text}%,slug.ilike.%${text}%,description.ilike.%${text}%`);
    }
    const sorts: Record<string, [string, boolean]> = { 'name-asc': ['name', true], 'name-desc': ['name', false], 'size-asc': ['file_size', true], 'size-desc': ['file_size', false] };
    const [column, ascending] = sorts[params.sort || ''] || ['created_at', false];
    const { data, error, count } = await query.order(column, { ascending }).order('id').range((page - 1) * limit, page * limit - 1); check(error);
    return { items: (data || []).map(enrich), total: count || 0, page, limit, totalPages: Math.max(1, Math.ceil((count || 0) / limit)) };
  },
  async getSvgAssetById(id: string) {
    const remote = client();
    if (!remote) return dbStore.getSvgAssetById(id);
    let query = remote.from('svg_assets').select(selection);
    query = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id) ? query.eq('id', id) : query.eq('slug', id);
    const { data, error } = await query.maybeSingle(); check(error);
    return data ? enrich(data) : null;
  },
  async taxonomy(table: 'categories' | 'collections' | 'licenses' | 'tags') {
    const remote = client();
    if (!remote) return ({ categories: () => dbStore.getCategories(), collections: () => dbStore.getCollections(), licenses: () => dbStore.getLicenses(), tags: () => dbStore.getTags() })[table]();
    const { data, error } = await remote.from(table).select('*').order('name'); check(error); return data || [];
  },
  async getStyles() {
    const remote = client();
    if (!remote) return dbStore.getStyles();
    const rows: any[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await remote.from('svg_assets').select('style').eq('status', 'published').order('id').range(offset, offset + 999); check(error);
      rows.push(...(data || [])); if (!data || data.length < 1000) break;
    }
    return [...new Set(rows.map(row => row.style).filter(Boolean))].sort();
  },
  async createSvgAsset(input: Parameters<typeof dbStore.createSvgAsset>[0]) {
    const remote = client();
    if (!remote) return dbStore.createSvgAsset(input);
    const { tags, ...row } = input;
    row.slug = row.slug || `${row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'svg'}-${randomUUID().slice(0, 8)}`;
    for (const key of ['category_id', 'collection_id', 'license_id'] as const) if (!row[key]) delete row[key];
    const { data, error } = await remote.from('svg_assets').insert(row).select('*').single(); check(error);
    try { if (tags) await replaceTags(data.id, tags); }
    catch (error) { await remote.from('svg_assets').delete().eq('id', data.id); throw error; }
    return data;
  },
  async updateSvgAsset(id: string, input: any) {
    const remote = client();
    if (!remote) return dbStore.updateSvgAsset(id, input);
    const current = await this.getSvgAssetById(id); if (!current) return null;
    const { tags, ...row } = input;
    for (const key of ['category_id', 'collection_id', 'license_id']) if (row[key] === '') row[key] = null;
    const { data, error } = await remote.from('svg_assets').update({ ...row, updated_at: new Date().toISOString() }).eq('id', current.id).select('*').single(); check(error);
    if (tags) await replaceTags(current.id, tags);
    return data;
  },
  async deleteSvgAsset(id: string) {
    const remote = client(); if (!remote) return dbStore.deleteSvgAsset(id);
    const current = await this.getSvgAssetById(id); if (!current) return false;
    const { error } = await remote.from('svg_assets').delete().eq('id', current.id); check(error); return true;
  },
  async getAdminStats() {
    const remote = client(); if (!remote) return dbStore.getAdminStats();
    const counts = await Promise.all(['svg_assets', 'categories', 'collections', 'tags'].map(async table => {
      const { count, error } = await remote.from(table).select('*', { count: 'exact', head: true }); check(error); return count || 0;
    }));
    const rows: any[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await remote.from('svg_assets').select('file_size,status,is_pro').order('id').range(offset, offset + 999); check(error);
      rows.push(...(data || [])); if (!data || data.length < 1000) break;
    }
    const recent = await this.getSvgAssets({ status: 'all', limit: 5 });
    return { totalAssets: counts[0], categoriesCount: counts[1], collectionsCount: counts[2], tagsCount: counts[3], publishedAssets: rows.filter(row => row.status === 'published').length, draftAssets: rows.filter(row => row.status === 'draft').length, proAssets: rows.filter(row => row.is_pro).length, totalBytes: rows.reduce((sum, row) => sum + row.file_size, 0), recentAssets: recent.items };
  },
};

async function replaceTags(assetId: string, names: string[]) {
  const remote = client()!;
  const tags = [...new Set(names.map(name => name.trim()).filter(Boolean))];
  const ids: string[] = [];
  for (const name of tags) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `tag-${randomUUID()}`;
    const { data, error } = await remote.from('tags').upsert({ name, slug }, { onConflict: 'slug' }).select('id').single(); check(error); if (!data) throw new Error('Tag creation failed'); ids.push(data.id);
  }
  const { error } = await remote.from('svg_asset_tags').delete().eq('asset_id', assetId); check(error);
  if (ids.length) { const { error } = await remote.from('svg_asset_tags').insert(ids.map(tag_id => ({ asset_id: assetId, tag_id }))); check(error); }
}

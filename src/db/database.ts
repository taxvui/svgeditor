import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  DbSvgAsset,
  DbCategory,
  DbCollection,
  DbLicense,
  DbTag,
  DbSvgAssetTag,
  DbProfile,
} from './schema.js';
import { iconDataset } from '../data/iconDataset.js';

export interface DatabaseState {
  svg_assets: DbSvgAsset[];
  categories: DbCategory[];
  collections: DbCollection[];
  licenses: DbLicense[];
  tags: DbTag[];
  svg_asset_tags: DbSvgAssetTag[];
  profiles: DbProfile[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'vectorhub_db.json');

class DatabaseStore {
  private state: DatabaseState = {
    svg_assets: [],
    categories: [],
    collections: [],
    licenses: [],
    tags: [],
    svg_asset_tags: [],
    profiles: [],
  };

  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        // In-memory fallback if filesystem restricted
      }
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.state = JSON.parse(raw);
        this.deduplicateState();
        this.save();
        this.initialized = true;
        return;
      } catch (err) {
        console.warn('Failed to read database file, re-seeding:', err);
      }
    }

    this.seed();
    this.save();
    this.initialized = true;
  }

  private deduplicateState() {
    if (!this.state || !Array.isArray(this.state.svg_assets)) return;

    const seenAssetIds = new Set<string>();
    const uniqueAssets: DbSvgAsset[] = [];
    for (const asset of this.state.svg_assets) {
      if (!seenAssetIds.has(asset.id)) {
        seenAssetIds.add(asset.id);
        uniqueAssets.push(asset);
      }
    }
    this.state.svg_assets = uniqueAssets;

    if (Array.isArray(this.state.svg_asset_tags)) {
      const seenTags = new Set<string>();
      const uniqueAssetTags: DbSvgAssetTag[] = [];
      for (const at of this.state.svg_asset_tags) {
        const key = `${at.asset_id}:${at.tag_id}`;
        if (!seenTags.has(key)) {
          seenTags.add(key);
          uniqueAssetTags.push(at);
        }
      }
      this.state.svg_asset_tags = uniqueAssetTags;
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not persist database to disk (operating in-memory):', err);
    }
  }

  private seed() {
    // 1. Seed Categories
    const categories: DbCategory[] = [
      { id: 'cat-1', name: 'UI Actions', slug: 'ui-actions', description: 'Core user interface interactive glyphs and action icons' },
      { id: 'cat-2', name: 'Tech Logos', slug: 'tech-logos', description: 'Programming languages, frameworks, and cloud developer emblems' },
      { id: 'cat-3', name: 'System & Devices', slug: 'system-devices', description: 'Hardware devices, terminal consoles, and server equipment' },
      { id: 'cat-4', name: 'Media & Controls', slug: 'media-controls', description: 'Audio, video, broadcast transmitters, and streaming controls' },
      { id: 'cat-5', name: 'Science & Molecules', slug: 'science-molecules', description: 'Chemical compounds, biomolecules, and scientific laboratory graphics' },
    ];

    // 2. Seed Collections
    const collections: DbCollection[] = [
      { id: 'col-1', name: 'VectorHub Core', slug: 'vectorhub-core', description: 'Primary curated developer icon set', source_url: 'https://vectorhub.dev', author: 'VectorHub Open Source' },
      { id: 'col-2', name: 'Dev & Cloud Badges', slug: 'dev-cloud', description: 'Open-source technology emblems', source_url: 'https://github.com', author: 'Community Standards' },
      { id: 'col-3', name: 'Hardware & IoT', slug: 'hardware-iot', description: 'Electronics and devices schematics', source_url: 'https://vectorhub.dev', author: 'VectorHub Lab' },
      { id: 'col-4', name: 'PubChem Science Vectors', slug: 'pubchem-science', description: 'Scientific molecular formulas and chemical graphs', source_url: 'https://pubchem.ncbi.nlm.nih.gov', author: 'Google DeepMind Science / PubChem' },
      { id: 'col-5', name: 'Font Awesome Pro', slug: 'font-awesome-pro', description: 'Locally owned Font Awesome Pro vector icon collection', source_url: 'https://fontawesome.com', author: 'Fonticons, Inc. (Locally Licensed)' },
    ];

    // 3. Seed Licenses
    const licenses: DbLicense[] = [
      { id: 'lic-1', name: 'MIT License', license_url: 'https://opensource.org/licenses/MIT', attribution_required: false, commercial_use_allowed: true },
      { id: 'lic-2', name: 'Apache 2.0', license_url: 'https://www.apache.org/licenses/LICENSE-2.0', attribution_required: true, commercial_use_allowed: true },
      { id: 'lic-3', name: 'CC0 Public Domain', license_url: 'https://creativecommons.org/publicdomain/zero/1.0/', attribution_required: false, commercial_use_allowed: true },
      { id: 'lic-4', name: 'Font Awesome Pro License', license_url: 'https://fontawesome.com/license', attribution_required: true, commercial_use_allowed: true },
    ];

    // 4. Seed Admin Profile
    const profiles: DbProfile[] = [
      {
        id: 'usr-admin-1',
        email: 'admin@vectorhub.dev',
        display_name: 'Lead Architect',
        role: 'admin',
        created_at: new Date('2026-01-01').toISOString(),
      },
      {
        id: 'usr-editor-1',
        email: 'editor@vectorhub.dev',
        display_name: 'Curator',
        role: 'editor',
        created_at: new Date('2026-01-02').toISOString(),
      },
    ];

    // 5. Seed Tags & Assets from iconDataset
    const tagsMap = new Map<string, DbTag>();
    const assetTags: DbSvgAssetTag[] = [];
    const assets: DbSvgAsset[] = [];

    const getCategoryId = (catSlug: string) => {
      const match = categories.find((c) => c.slug === catSlug);
      return match ? match.id : categories[0].id;
    };

    const getCollectionId = (colName: string) => {
      if (colName.includes('Tech')) return collections[1].id;
      if (colName.includes('Device') || colName.includes('System')) return collections[2].id;
      if (colName.includes('Science') || colName.includes('Molecules')) return collections[3].id;
      if (colName.includes('Font Awesome')) return collections[4].id;
      return collections[0].id;
    };

    const getLicenseId = (licName: string) => {
      if (licName.includes('CC0')) return licenses[2].id;
      if (licName.includes('Apache')) return licenses[1].id;
      if (licName.includes('Font Awesome')) return licenses[3].id;
      return licenses[0].id;
    };

    const seenAssetIds = new Set<string>();

    for (const icon of iconDataset) {
      const assetId = `asset-${icon.id}`;
      if (seenAssetIds.has(assetId)) continue;
      seenAssetIds.add(assetId);

      const isScience = icon.categorySlug === 'science-molecules';

      const asset: DbSvgAsset = {
        id: assetId,
        name: icon.name,
        slug: icon.slug,
        description: isScience
          ? `Scientific vector depiction of ${icon.name}, verified via PubChem PUG REST database.`
          : `High-quality ${icon.name} vector asset for production web and application interfaces.`,
        svg_content: icon.svgContent,
        thumbnail_path: `/thumbnails/${icon.slug}.svg`,
        collection_id: getCollectionId(icon.collection),
        category_id: getCategoryId(icon.categorySlug),
        license_id: getLicenseId(icon.license),
        width: isScience ? 100 : 24,
        height: isScience ? 100 : 24,
        view_box: icon.viewBox,
        file_size: icon.rawBytes,
        status: 'published',
        created_at: new Date(icon.createdAt).toISOString(),
        updated_at: new Date(icon.createdAt).toISOString(),
        published_at: new Date(icon.createdAt).toISOString(),
      };

      assets.push(asset);

      for (const tagName of icon.tags) {
        let tag = tagsMap.get(tagName);
        if (!tag) {
          tag = {
            id: `tag-${crypto.randomUUID().slice(0, 8)}`,
            name: tagName,
            slug: tagName.toLowerCase().replace(/\s+/g, '-'),
          };
          tagsMap.set(tagName, tag);
        }
        assetTags.push({ asset_id: assetId, tag_id: tag.id });
      }
    }

    this.state = {
      categories,
      collections,
      licenses,
      profiles,
      tags: Array.from(tagsMap.values()),
      svg_assets: assets,
      svg_asset_tags: assetTags,
    };
  }

  // ==========================================
  // Public Query and Mutation APIs
  // ==========================================

  public getSvgAssets(params: {
    page?: number;
    limit?: number;
    categorySlug?: string;
    collectionSlug?: string;
    tagSlug?: string;
    style?: string;
    source?: string;
    is_pro?: boolean;
    status?: string;
    search?: string;
    sort?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 24));
    let items = [...this.state.svg_assets];

    // Status filter (default to 'published' for public queries unless explicitly requested or admin)
    if (params.status && params.status !== 'all') {
      items = items.filter((a) => a.status === params.status);
    } else if (!params.status) {
      items = items.filter((a) => a.status === 'published');
    }

    // Style filter (Font Awesome & multi-style icons)
    if (params.style && params.style !== 'all') {
      const targetStyle = params.style.toLowerCase().trim();
      items = items.filter((a) => a.style && a.style.toLowerCase() === targetStyle);
    }

    // Source filter
    if (params.source && params.source !== 'all') {
      items = items.filter((a) => a.source === params.source);
    }

    // Pro filter
    if (params.is_pro !== undefined) {
      items = items.filter((a) => Boolean(a.is_pro) === params.is_pro);
    }

    // Category filter
    if (params.categorySlug && params.categorySlug !== 'all') {
      const cat = this.state.categories.find((c) => c.slug === params.categorySlug);
      if (cat) {
        items = items.filter((a) => a.category_id === cat.id);
      }
    }

    // Collection filter
    if (params.collectionSlug && params.collectionSlug !== 'all') {
      const col = this.state.collections.find((c) => c.slug === params.collectionSlug);
      if (col) {
        items = items.filter((a) => a.collection_id === col.id);
      }
    }

    // Tag filter
    if (params.tagSlug) {
      const tag = this.state.tags.find((t) => t.slug === params.tagSlug);
      if (tag) {
        const matchingAssetIds = new Set(
          this.state.svg_asset_tags.filter((at) => at.tag_id === tag.id).map((at) => at.asset_id)
        );
        items = items.filter((a) => matchingAssetIds.has(a.id));
      }
    }

    // Search query
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      items = items.filter((a) => {
        if (a.name.toLowerCase().includes(q)) return true;
        if (a.slug.toLowerCase().includes(q)) return true;
        if (a.description.toLowerCase().includes(q)) return true;

        // Check tags
        const assetTagIds = this.state.svg_asset_tags
          .filter((at) => at.asset_id === a.id)
          .map((at) => at.tag_id);
        const assetTags = this.state.tags.filter((t) => assetTagIds.includes(t.id));
        return assetTags.some((t) => t.name.toLowerCase().includes(q));
      });
    }

    // Sorting
    items.sort((a, b) => {
      switch (params.sort) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'size-asc':
          return a.file_size - b.file_size;
        case 'size-desc':
          return b.file_size - a.file_size;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginatedItems = items.slice((page - 1) * limit, page * limit);

    // Enrich items with category, collection, license, and tags info
    const enriched = paginatedItems.map((asset) => this.enrichAsset(asset));

    return {
      items: enriched,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public getSvgAssetById(id: string) {
    const asset = this.state.svg_assets.find(
      (a) => a.id === id || a.id === `asset-${id}` || a.id.replace(/^asset-/, '') === id || a.slug === id
    );
    if (!asset) return null;
    return this.enrichAsset(asset);
  }

  public getSvgAssetBySlug(slug: string) {
    const asset = this.state.svg_assets.find((a) => a.slug === slug);
    if (!asset) return null;
    return this.enrichAsset(asset);
  }

  public findByContentHash(hash: string): DbSvgAsset | null {
    if (!hash) return null;
    return this.state.svg_assets.find((a) => a.content_hash === hash) || null;
  }

  public findBySlugAndStyle(slug: string, style?: string): DbSvgAsset | null {
    return (
      this.state.svg_assets.find((a) => {
        if (a.slug !== slug) return false;
        if (style && a.style && a.style.toLowerCase() !== style.toLowerCase()) return false;
        return true;
      }) || null
    );
  }

  public getStyles(): string[] {
    const stylesSet = new Set<string>();
    for (const a of this.state.svg_assets) {
      if (a.style && a.style.trim()) {
        stylesSet.add(a.style.toLowerCase().trim());
      }
    }
    return Array.from(stylesSet).sort();
  }

  public createSvgAsset(data: {
    name: string;
    slug?: string;
    description?: string;
    svg_content: string;
    collection_id?: string;
    category_id?: string;
    license_id?: string;
    width?: number;
    height?: number;
    view_box?: string;
    file_size?: number;
    status?: 'published' | 'draft' | 'archived';
    style?: string | null;
    source?: string | null;
    storage_path?: string | null;
    content_hash?: string | null;
    is_pro?: boolean | null;
    tags?: string[];
  }): DbSvgAsset {
    const rawBytes = new TextEncoder().encode(data.svg_content).length;
    const baseSlug = (data.slug || data.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug || `svg-${Date.now()}`;
    let counter = 1;
    while (this.state.svg_assets.some((a) => a.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const id = `asset-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const newAsset: DbSvgAsset = {
      id,
      name: data.name,
      slug,
      description: data.description || '',
      svg_content: data.svg_content,
      thumbnail_path: `/thumbnails/${slug}.svg`,
      collection_id: data.collection_id || this.state.collections[0].id,
      category_id: data.category_id || this.state.categories[0].id,
      license_id: data.license_id || this.state.licenses[0].id,
      width: data.width || 24,
      height: data.height || 24,
      view_box: data.view_box || '0 0 24 24',
      file_size: data.file_size || rawBytes,
      status: data.status || 'published',
      style: data.style || null,
      source: data.source || 'vectorhub-core',
      storage_path: data.storage_path || null,
      content_hash: data.content_hash || null,
      is_pro: data.is_pro ?? false,
      created_at: now,
      updated_at: now,
      published_at: data.status === 'published' ? now : null,
    };

    this.state.svg_assets.unshift(newAsset);

    // Handle tags
    if (data.tags && Array.isArray(data.tags)) {
      for (const tName of data.tags) {
        const cleanT = tName.trim().toLowerCase();
        if (!cleanT) continue;
        let tag = this.state.tags.find((t) => t.name.toLowerCase() === cleanT);
        if (!tag) {
          tag = { id: `tag-${crypto.randomUUID().slice(0, 8)}`, name: cleanT, slug: cleanT.replace(/\s+/g, '-') };
          this.state.tags.push(tag);
        }
        this.state.svg_asset_tags.push({ asset_id: id, tag_id: tag.id });
      }
    }

    this.save();
    return newAsset;
  }

  public upsertSvgAsset(data: {
    name: string;
    slug?: string;
    description?: string;
    svg_content: string;
    collection_id?: string;
    category_id?: string;
    license_id?: string;
    width?: number;
    height?: number;
    view_box?: string;
    file_size?: number;
    status?: 'published' | 'draft' | 'archived';
    style?: string | null;
    source?: string | null;
    storage_path?: string | null;
    content_hash?: string | null;
    is_pro?: boolean | null;
    tags?: string[];
  }): { asset: DbSvgAsset; action: 'created' | 'updated' | 'unchanged' } {
    // Check if an asset with this content hash already exists
    if (data.content_hash) {
      const existingByHash = this.findByContentHash(data.content_hash);
      if (existingByHash) {
        // If content is identical, check if metadata needs updating
        let needsUpdate = false;
        if (data.storage_path && existingByHash.storage_path !== data.storage_path) {
          existingByHash.storage_path = data.storage_path;
          needsUpdate = true;
        }
        if (data.style && existingByHash.style !== data.style) {
          existingByHash.style = data.style;
          needsUpdate = true;
        }
        if (data.name && existingByHash.name !== data.name) {
          existingByHash.name = data.name;
          needsUpdate = true;
        }
        if (needsUpdate) {
          existingByHash.updated_at = new Date().toISOString();
          this.save();
          return { asset: existingByHash, action: 'updated' };
        }
        return { asset: existingByHash, action: 'unchanged' };
      }
    }

    // Check if an asset with this slug and style already exists
    if (data.slug) {
      const existingBySlug = this.findBySlugAndStyle(data.slug, data.style || undefined);
      if (existingBySlug) {
        // Update the existing asset safely
        existingBySlug.name = data.name;
        existingBySlug.svg_content = data.svg_content;
        existingBySlug.file_size = data.file_size || new TextEncoder().encode(data.svg_content).length;
        if (data.view_box) existingBySlug.view_box = data.view_box;
        if (data.width) existingBySlug.width = data.width;
        if (data.height) existingBySlug.height = data.height;
        if (data.storage_path) existingBySlug.storage_path = data.storage_path;
        if (data.content_hash) existingBySlug.content_hash = data.content_hash;
        if (data.style) existingBySlug.style = data.style;
        if (data.source) existingBySlug.source = data.source;
        if (data.is_pro !== undefined) existingBySlug.is_pro = data.is_pro;
        existingBySlug.updated_at = new Date().toISOString();

        // Update tags
        if (data.tags && Array.isArray(data.tags)) {
          this.state.svg_asset_tags = this.state.svg_asset_tags.filter((at) => at.asset_id !== existingBySlug.id);
          for (const tName of data.tags) {
            const cleanT = tName.trim().toLowerCase();
            if (!cleanT) continue;
            let tag = this.state.tags.find((t) => t.name.toLowerCase() === cleanT);
            if (!tag) {
              tag = { id: `tag-${crypto.randomUUID().slice(0, 8)}`, name: cleanT, slug: cleanT.replace(/\s+/g, '-') };
              this.state.tags.push(tag);
            }
            this.state.svg_asset_tags.push({ asset_id: existingBySlug.id, tag_id: tag.id });
          }
        }

        this.save();
        return { asset: existingBySlug, action: 'updated' };
      }
    }

    // Create new
    const created = this.createSvgAsset(data);
    return { asset: created, action: 'created' };
  }

  public updateSvgAsset(
    id: string,
    data: Partial<DbSvgAsset> & { tags?: string[] }
  ): DbSvgAsset | null {
    const idx = this.state.svg_assets.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const current = this.state.svg_assets[idx];
    const now = new Date().toISOString();

    const updated: DbSvgAsset = {
      ...current,
      ...data,
      updated_at: now,
      published_at:
        data.status === 'published' && !current.published_at ? now : current.published_at,
    };

    if (data.svg_content) {
      updated.file_size = new TextEncoder().encode(data.svg_content).length;
    }

    this.state.svg_assets[idx] = updated;

    // Update tags if provided
    if (data.tags && Array.isArray(data.tags)) {
      this.state.svg_asset_tags = this.state.svg_asset_tags.filter((at) => at.asset_id !== id);
      for (const tName of data.tags) {
        const cleanT = tName.trim().toLowerCase();
        if (!cleanT) continue;
        let tag = this.state.tags.find((t) => t.name.toLowerCase() === cleanT);
        if (!tag) {
          tag = { id: `tag-${crypto.randomUUID().slice(0, 8)}`, name: cleanT, slug: cleanT.replace(/\s+/g, '-') };
          this.state.tags.push(tag);
        }
        this.state.svg_asset_tags.push({ asset_id: id, tag_id: tag.id });
      }
    }

    this.save();
    return updated;
  }

  public deleteSvgAsset(id: string): boolean {
    const idx = this.state.svg_assets.findIndex((a) => a.id === id);
    if (idx === -1) return false;

    this.state.svg_assets.splice(idx, 1);
    this.state.svg_asset_tags = this.state.svg_asset_tags.filter((at) => at.asset_id !== id);
    this.save();
    return true;
  }

  public getCategories() {
    return this.state.categories.map((c) => ({
      ...c,
      count: this.state.svg_assets.filter((a) => a.category_id === c.id && a.status === 'published').length,
    }));
  }

  public getCollections() {
    return this.state.collections.map((col) => ({
      ...col,
      count: this.state.svg_assets.filter((a) => a.collection_id === col.id && a.status === 'published').length,
    }));
  }

  public getLicenses() {
    return this.state.licenses;
  }

  public getTags() {
    return this.state.tags;
  }

  public getAdminStats() {
    const totalAssets = this.state.svg_assets.length;
    const publishedAssets = this.state.svg_assets.filter((a) => a.status === 'published').length;
    const draftAssets = this.state.svg_assets.filter((a) => a.status === 'draft').length;
    const proAssets = this.state.svg_assets.filter((a) => Boolean(a.is_pro)).length;
    const totalBytes = this.state.svg_assets.reduce((sum, a) => sum + (a.file_size || 0), 0);
    const styles = this.getStyles();

    return {
      totalAssets,
      publishedAssets,
      draftAssets,
      proAssets,
      stylesCount: styles.length,
      styles,
      categoriesCount: this.state.categories.length,
      collectionsCount: this.state.collections.length,
      tagsCount: this.state.tags.length,
      totalBytes,
      recentAssets: this.state.svg_assets.slice(0, 5).map((a) => this.enrichAsset(a)),
    };
  }

  public getProfileByEmail(email: string) {
    return this.state.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  }

  public getProfileById(id: string) {
    return this.state.profiles.find((p) => p.id === id);
  }

  private enrichAsset(asset: DbSvgAsset) {
    const category = this.state.categories.find((c) => c.id === asset.category_id);
    const collection = this.state.collections.find((c) => c.id === asset.collection_id);
    const license = this.state.licenses.find((l) => l.id === asset.license_id);
    const tagIds = this.state.svg_asset_tags
      .filter((at) => at.asset_id === asset.id)
      .map((at) => at.tag_id);
    const tags = this.state.tags.filter((t) => tagIds.includes(t.id));

    return {
      ...asset,
      category: category ? { name: category.name, slug: category.slug } : null,
      collection: collection ? { name: collection.name, slug: collection.slug, author: collection.author } : null,
      license: license ? { name: license.name, license_url: license.license_url } : null,
      tags: tags.map((t) => t.name),
    };
  }
}

export const dbStore = new DatabaseStore();

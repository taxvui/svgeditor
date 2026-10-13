import express, { Request, Response, Router } from 'express';
import { z } from 'zod';
import { assetRepository } from '../db/assetRepository.js';
import { authenticateUser, protectOperations, login, logout } from './auth.js';
import { sanitizeAndValidateSvg } from './svgSecurity.js';
import { runSvgoOptimization } from './svgoService.js';
import { queryPubChemCompound } from './scienceService.js';
import { runFontAwesomeImport } from '../../scripts/import-font-awesome.js';
import {
  checkSupabaseHealth,
  syncLocalDatabaseToSupabase,
  getSupabaseConfigInfo,
} from '../db/supabaseClient.js';

export const apiRouter = Router();

// ==========================================
// Zod Schemas for Request Validation
// ==========================================

const createSvgSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().optional(),
  description: z.string().max(500).optional(),
  svg_content: z.string().min(10, 'Valid SVG content is required'),
  collection_id: z.string().optional(),
  category_id: z.string().optional(),
  license_id: z.string().optional(),
  status: z.enum(['published', 'draft', 'archived']).default('published'),
  style: z.string().max(50).optional(),
  source: z.string().max(50).optional(),
  storage_path: z.string().max(500).optional(),
  content_hash: z.string().max(64).optional(),
  is_pro: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

const updateSvgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  svg_content: z.string().min(10).optional(),
  collection_id: z.string().optional(),
  category_id: z.string().optional(),
  license_id: z.string().optional(),
  status: z.enum(['published', 'draft', 'archived']).optional(),
  style: z.string().max(50).optional(),
  source: z.string().max(50).optional(),
  storage_path: z.string().max(500).optional(),
  content_hash: z.string().max(64).optional(),
  is_pro: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

const optimizeSchema = z.object({
  svg: z.string().min(1, 'SVG content is required'),
  multipass: z.boolean().optional(),
  precision: z.number().min(0).max(5).optional(),
});

const importBatchSchema = z.object({
  assets: z.array(
    z.object({
      name: z.string().min(1),
      svg_content: z.string().min(10),
      description: z.string().optional(),
      category_slug: z.string().optional(),
      collection_slug: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
  ).min(1).max(100),
});

const scienceQuerySchema = z.object({
  compound_name: z.string().min(1, 'Compound name or identifier is required'),
});

apiRouter.use(authenticateUser);
apiRouter.use(protectOperations);

// ==========================================
// 1. SVG Assets Endpoints
// ==========================================

// GET /api/svg - List, search, filter, sort, paginate
apiRouter.get('/svg', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 24;
    const categorySlug = req.query.category as string | undefined;
    const collectionSlug = req.query.collection as string | undefined;
    const tagSlug = req.query.tag as string | undefined;
    const style = req.query.style as string | undefined;
    const source = req.query.source as string | undefined;
    const isProQuery = req.query.is_pro as string | undefined;
    const is_pro = isProQuery === 'true' ? true : isProQuery === 'false' ? false : undefined;
    const search = req.query.q as string | undefined;
    const sort = req.query.sort as string | undefined;
    const status = (req as any).user?.role === 'admin' ? req.query.status as string | undefined : 'published';

    const result = await assetRepository.getSvgAssets({
      page,
      limit,
      categorySlug,
      collectionSlug,
      tagSlug,
      style,
      source,
      is_pro,
      search,
      sort,
      status,
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching SVGs:', err);
    res.status(500).json({ error: 'Failed to retrieve SVG assets' });
  }
});

// GET /api/search - Dedicated Search API
apiRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 24;

    const result = await assetRepository.getSvgAssets({
      page,
      limit,
      search: q,
      status: 'published',
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/svg/:id - Retrieve SVG details
apiRouter.get('/svg/:id', async (req: Request, res: Response) => {
  try {
    const asset = await assetRepository.getSvgAssetById(req.params.id);
    if (!asset || (asset.status !== 'published' && (req as any).user?.role !== 'admin')) {
      return res.status(404).json({ error: 'SVG asset not found' });
    }
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve asset details' });
  }
});

// POST /api/svg - Create an SVG asset (Security Sanitization + Zod Validation)
apiRouter.post('/svg', async (req: Request, res: Response) => {
  try {
    const validationResult = createSvgSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const {
      name,
      slug,
      description,
      svg_content,
      collection_id,
      category_id,
      license_id,
      status,
      style,
      source,
      storage_path,
      content_hash,
      is_pro,
      tags,
    } = validationResult.data;

    // Security sanitization
    const security = sanitizeAndValidateSvg(svg_content);
    if (!security.isValid) {
      return res.status(400).json({
        error: 'SVG Security validation failed',
        violations: security.violations,
      });
    }

    const newAsset = await assetRepository.createSvgAsset({
      name,
      slug,
      description,
      svg_content: security.sanitizedSvg,
      collection_id,
      category_id,
      license_id,
      width: security.width,
      height: security.height,
      view_box: security.viewBox,
      file_size: security.fileSizeBytes,
      status,
      style,
      source,
      storage_path,
      content_hash,
      is_pro,
      tags,
    });

    res.status(201).json({
      message: 'SVG created successfully',
      asset: await assetRepository.getSvgAssetById(newAsset.id),
      securityNotes: security.violations.length > 0 ? security.violations : undefined,
    });
  } catch (err) {
    console.error('Error creating SVG:', err);
    res.status(500).json({ error: 'Failed to create SVG asset' });
  }
});

// PATCH /api/svg/:id - Update an SVG asset
apiRouter.patch('/svg/:id', async (req: Request, res: Response) => {
  try {
    const parseRes = updateSvgSchema.safeParse(req.body);
    if (!parseRes.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseRes.error.issues,
      });
    }

    const updateData: any = { ...parseRes.data };

    if (updateData.svg_content) {
      const security = sanitizeAndValidateSvg(updateData.svg_content);
      if (!security.isValid) {
        return res.status(400).json({
          error: 'SVG security check failed',
          violations: security.violations,
        });
      }
      updateData.svg_content = security.sanitizedSvg;
      updateData.width = security.width;
      updateData.height = security.height;
      updateData.view_box = security.viewBox;
      updateData.file_size = security.fileSizeBytes;
    }

    const updated = await assetRepository.updateSvgAsset(req.params.id, updateData);
    if (!updated) {
      return res.status(404).json({ error: 'SVG asset not found' });
    }

    res.json({
      message: 'SVG updated successfully',
      asset: await assetRepository.getSvgAssetById(updated.id),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update SVG asset' });
  }
});

// DELETE /api/svg/:id - Delete an SVG asset
apiRouter.delete('/svg/:id', async (req: Request, res: Response) => {
  try {
    const success = await assetRepository.deleteSvgAsset(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'SVG asset not found' });
    }
    res.json({ message: 'SVG asset deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete SVG asset' });
  }
});

// ==========================================
// 2. Taxonomy Endpoints
// ==========================================

apiRouter.get('/categories', async (_req: Request, res: Response) => {
  try { res.json(await assetRepository.taxonomy('categories')); } catch { res.status(503).json({ error: 'Database unavailable' }); }
});

apiRouter.get('/collections', async (_req: Request, res: Response) => {
  try { res.json(await assetRepository.taxonomy('collections')); } catch { res.status(503).json({ error: 'Database unavailable' }); }
});

apiRouter.get('/licenses', async (_req: Request, res: Response) => {
  try { res.json(await assetRepository.taxonomy('licenses')); } catch { res.status(503).json({ error: 'Database unavailable' }); }
});

apiRouter.get('/tags', async (_req: Request, res: Response) => {
  try { res.json(await assetRepository.taxonomy('tags')); } catch { res.status(503).json({ error: 'Database unavailable' }); }
});

apiRouter.get('/styles', async (_req: Request, res: Response) => {
  try { res.json(await assetRepository.getStyles()); } catch { res.status(503).json({ error: 'Database unavailable' }); }
});

// ==========================================
// 3. Optimization & Import Endpoints
// ==========================================

// POST /api/svg/optimize - SVGO optimization
apiRouter.post('/svg/optimize', async (req: Request, res: Response) => {
  try {
    const parseRes = optimizeSchema.safeParse(req.body);
    if (!parseRes.success) {
      return res.status(400).json({ error: 'Invalid optimization request', details: parseRes.error.issues });
    }

    const { svg, multipass, precision } = parseRes.data;
    const result = runSvgoOptimization(svg, { multipass, precision });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Optimization service error' });
  }
});

// POST /api/svg/import - Batch Import
apiRouter.post('/svg/import', async (req: Request, res: Response) => {
  try {
    const parseRes = importBatchSchema.safeParse(req.body);
    if (!parseRes.success) {
      return res.status(400).json({ error: 'Invalid batch format', details: parseRes.error.issues });
    }

    const { assets } = parseRes.data;
    const imported: any[] = [];
    const errors: Array<{ name: string; error: string }> = [];

    const categories = await assetRepository.taxonomy('categories');
    const collections = await assetRepository.taxonomy('collections');

    for (const item of assets) {
      try {
        const security = sanitizeAndValidateSvg(item.svg_content);
        if (!security.isValid) {
          errors.push({ name: item.name, error: security.violations.join(', ') });
          continue;
        }

        const category = categories.find((c) => c.slug === item.category_slug) || categories[0];
        const collection = collections.find((col) => col.slug === item.collection_slug) || collections[0];

        const created = await assetRepository.createSvgAsset({
          name: item.name,
          description: item.description,
          svg_content: security.sanitizedSvg,
          category_id: category?.id,
          collection_id: collection?.id,
          width: security.width,
          height: security.height,
          view_box: security.viewBox,
          file_size: security.fileSizeBytes,
          status: 'published',
          tags: item.tags,
        });

        imported.push(await assetRepository.getSvgAssetById(created.id));
      } catch (e) {
        errors.push({ name: item.name, error: e instanceof Error ? e.message : 'Unknown error' });
      }
    }

    res.json({
      success: true,
      importedCount: imported.length,
      failedCount: errors.length,
      imported,
      errors,
    });
  } catch (err) {
    res.status(500).json({ error: 'Batch import failed' });
  }
});

// ==========================================
// 4. Admin & Auth Endpoints
// ==========================================

apiRouter.get('/admin/stats', async (_req: Request, res: Response) => {
  try { res.json(await assetRepository.getAdminStats()); } catch { res.status(503).json({ error: 'Database unavailable' }); }
});

// POST /api/admin/import-fa - Run or trigger Font Awesome Pro local directory import
apiRouter.post('/admin/import-fa', async (req: Request, res: Response) => {
  try {
    const dir = req.body.dir || process.env.SVG_FA_PRO_DIR || './assets/sample-fa-pro';
    const dryRun = Boolean(req.body.dryRun);
    const force = Boolean(req.body.force);
    const batchSize = parseInt(req.body.batchSize, 10) || 50;

    const result = await runFontAwesomeImport({
      dir,
      dryRun,
      batchSize,
      resumeFile: './.import-cache/fa-import-resume.json',
      collectionName: req.body.collectionName || 'Font Awesome Pro',
      force,
      help: false,
    });

    if (getSupabaseConfigInfo().isConfigured && !dryRun) {
      const sync = await syncLocalDatabaseToSupabase();
      return res.json({ ...result, supabaseSync: sync });
    }
    res.json(result);
  } catch (err) {
    console.error('Error in Font Awesome import:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Import failed' });
  }
});

apiRouter.post('/auth/login', login);
apiRouter.get('/auth/me', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  const profile = (req as any).user || null;
  res.json({ profile, authenticated: Boolean(profile) });
});
apiRouter.post('/auth/logout', logout);

// ==========================================
// 5. Science Skill Integration Endpoint
// ==========================================

apiRouter.post('/science/fetch-chemical-svg', async (req: Request, res: Response) => {
  try {
    const parseRes = scienceQuerySchema.safeParse(req.body);
    if (!parseRes.success) {
      return res.status(400).json({ error: 'Compound identifier is required' });
    }

    const { compound_name } = parseRes.data;
    const compoundInfo = await queryPubChemCompound(compound_name);

    res.json({
      success: true,
      compound: compoundInfo,
    });
  } catch (err) {
    console.error('PubChem resolution error:', err);
    res.status(404).json({
      error: err instanceof Error ? err.message : 'Could not resolve chemical compound',
    });
  }
});

// ==========================================
// 6. Supabase / PostgreSQL Integration Endpoints
// ==========================================

apiRouter.get('/admin/supabase-status', async (_req: Request, res: Response) => {
  try {
    const configInfo = getSupabaseConfigInfo();
    const health = await checkSupabaseHealth();
    res.json({
      config: configInfo,
      health,
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to query Supabase status',
    });
  }
});

apiRouter.post('/admin/supabase-sync', async (_req: Request, res: Response) => {
  try {
    const syncResult = await syncLocalDatabaseToSupabase();
    res.json(syncResult);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to sync to Supabase',
    });
  }
});


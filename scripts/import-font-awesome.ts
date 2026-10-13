/**
 * Server-Side Font Awesome Pro SVG Importer
 *
 * Recursively scans local Font Awesome Pro directories, extracts icon styles,
 * sanitizes SVG markup, detects duplicates via SHA-256 content hashes,
 * and securely updates PostgreSQL / VectorHub database records.
 *
 * Usage:
 *   npx tsx scripts/import-font-awesome.ts --dir ./assets/sample-fa-pro
 *   npx tsx scripts/import-font-awesome.ts --dir ./fa-pro --dry-run
 *   npx tsx scripts/import-font-awesome.ts --dir ./fa-pro --batch-size 100 --resume-file .import-cache/resume.json
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { dbStore } from '../src/db/database.js';
import { sanitizeAndValidateSvg } from '../src/server/svgSecurity.js';
import { getSupabaseClient } from '../src/db/supabaseClient.js';

interface CliArgs {
  dir: string;
  dryRun: boolean;
  batchSize: number;
  resumeFile: string;
  collectionName: string;
  force: boolean;
  help: boolean;
}

const KNOWN_STYLES = new Set([
  'solid',
  'regular',
  'light',
  'thin',
  'duotone',
  'brands',
  'sharp-solid',
  'sharp-regular',
  'sharp-light',
  'sharp-thin',
]);

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    dir: process.env.SVG_FA_PRO_DIR || './assets/sample-fa-pro',
    dryRun: false,
    batchSize: 50,
    resumeFile: './.import-cache/fa-import-resume.json',
    collectionName: 'Font Awesome Pro',
    force: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--dry-run' || arg === '-n') {
      result.dryRun = true;
    } else if (arg === '--force' || arg === '-f') {
      result.force = true;
    } else if (arg === '--dir' || arg === '-d') {
      result.dir = args[++i];
    } else if (arg === '--batch-size' || arg === '-b') {
      result.batchSize = parseInt(args[++i], 10) || 50;
    } else if (arg === '--resume-file' || arg === '-r') {
      result.resumeFile = args[++i];
    } else if (arg === '--collection' || arg === '-c') {
      result.collectionName = args[++i];
    }
  }

  return result;
}

function showHelp() {
  console.log(`
VectorHub Font Awesome Pro Import Utility
==========================================

Recursively imports local Font Awesome Pro SVG files into the VectorHub database.
Preserves original files, extracts styles, sanitizes SVGs, and prevents duplicates.

Options:
  --dir, -d <path>         Source directory containing Font Awesome SVG files.
                           (Defaults to SVG_FA_PRO_DIR env var or ./assets/sample-fa-pro)
  --dry-run, -n            Simulate import without writing to database.
  --batch-size, -b <num>   Number of files to process per transaction/save batch (default: 50).
  --resume-file, -r <path> Path to cache file tracking processed SVGs (default: ./.import-cache/fa-import-resume.json).
  --collection, -c <name>  Collection name in database (default: "Font Awesome Pro").
  --force, -f              Ignore resume cache and re-process all files.
  --help, -h               Show this documentation.

Examples:
  npx tsx scripts/import-font-awesome.ts --dir /path/to/fontawesome-pro-svgs --dry-run
  npx tsx scripts/import-font-awesome.ts --dir /path/to/fontawesome-pro-svgs --batch-size 100
`);
}

/**
 * Determine icon style from directory hierarchy
 * e.g. /svgs/solid/user.svg -> "solid"
 *      /duotone/bolt.svg -> "duotone"
 *      /sharp-solid/star.svg -> "sharp-solid"
 */
function extractStyleFromPath(filePath: string, rootDir: string): string {
  const relative = path.relative(rootDir, filePath).toLowerCase();
  const segments = relative.split(path.sep);

  for (const seg of segments) {
    if (KNOWN_STYLES.has(seg)) {
      return seg;
    }
    // Check aliases like "sharp_solid" or "duotone-solid"
    const normalized = seg.replace(/_/g, '-');
    if (KNOWN_STYLES.has(normalized)) {
      return normalized;
    }
  }

  // Fallback: parent folder name
  const parentFolder = path.basename(path.dirname(filePath)).toLowerCase().replace(/_/g, '-');
  if (parentFolder && parentFolder !== '.' && parentFolder !== 'svgs' && parentFolder !== 'svg') {
    return parentFolder;
  }

  return 'solid';
}

/**
 * Format human-readable title from slug / filename
 * e.g. "circle-check" -> "Circle Check"
 *      "arrow-up-right-from-square" -> "Arrow Up Right From Square"
 */
function formatIconName(baseName: string): string {
  return baseName
    .replace(/\.svg$/i, '')
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Recursively find all .svg files in a folder
 */
function findSvgFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findSvgFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

interface ResumeState {
  processedPaths: Record<string, string>; // path -> content_hash
  lastRun: string;
}

function loadResumeState(filePath: string): ResumeState {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`Could not read resume file ${filePath}, starting fresh.`);
  }
  return { processedPaths: {}, lastRun: new Date().toISOString() };
}

function saveResumeState(filePath: string, state: ResumeState) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`Could not save resume file ${filePath}:`, err);
  }
}

export async function runFontAwesomeImport(cliArgs: CliArgs) {
  const startTime = Date.now();
  console.log('=====================================================');
  console.log('🚀 VectorHub — Font Awesome Pro Asset Importer');
  console.log('=====================================================');
  console.log(`📂 Source Directory : ${path.resolve(cliArgs.dir)}`);
  console.log(`⚙️  Dry-Run Mode     : ${cliArgs.dryRun ? 'YES (Simulated)' : 'NO (Live DB writes)'}`);
  console.log(`📦 Batch Size       : ${cliArgs.batchSize}`);
  console.log(`💾 Resume Cache     : ${cliArgs.resumeFile}`);
  console.log(`🏷️  Target Collection: ${cliArgs.collectionName}`);
  console.log('-----------------------------------------------------');

  if (!fs.existsSync(cliArgs.dir)) {
    console.error(`❌ Error: Source directory does not exist: ${cliArgs.dir}`);
    return {
      success: false,
      error: `Directory not found: ${cliArgs.dir}`,
    };
  }

  // 1. Discover all SVG files
  console.log('🔍 Scanning directory hierarchy for SVG assets...');
  const allSvgFiles = findSvgFiles(cliArgs.dir);
  console.log(`📊 Discovered ${allSvgFiles.length} SVG candidate file(s).`);

  if (allSvgFiles.length === 0) {
    console.warn('⚠️  No .svg files found in directory.');
    return { success: true, total: 0, imported: 0, updated: 0, skipped: 0, errors: [] };
  }

  // 2. Load Resume State
  const resumeState = cliArgs.force ? { processedPaths: {}, lastRun: '' } : loadResumeState(cliArgs.resumeFile);
  const alreadyProcessed = new Set(Object.keys(resumeState.processedPaths));
  if (alreadyProcessed.size > 0 && !cliArgs.force) {
    console.log(`🔄 Found ${alreadyProcessed.size} previously processed files in resume cache.`);
  }

  // 3. Ensure target Collection and License exist in DB
  const collections = dbStore.getCollections();
  let targetCol = collections.find(
    (c) => c.slug === 'font-awesome-pro' || c.name.toLowerCase() === cliArgs.collectionName.toLowerCase()
  );
  if (!targetCol && !cliArgs.dryRun) {
    targetCol = {
      id: `col-fa-pro-${Date.now()}`,
      name: cliArgs.collectionName,
      slug: 'font-awesome-pro',
      description: 'Locally licensed Font Awesome Pro vector icon collection',
      source_url: 'https://fontawesome.com',
      author: 'Fonticons, Inc. (Locally Licensed)',
      count: 0,
    };
  }

  const licenses = dbStore.getLicenses();
  const targetLic = licenses.find((l) => l.name.includes('Font Awesome') || l.id === 'lic-4') || licenses[0];
  const categories = dbStore.getCategories();
  const defaultCategory = categories.find((c) => c.slug === 'ui-actions') || categories[0];

  // 4. Statistics Tracking
  const stats = {
    scanned: allSvgFiles.length,
    processed: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    skippedCache: 0,
    invalidSecurity: 0,
    stylesDetected: {} as Record<string, number>,
    errors: [] as Array<{ file: string; reason: string }>,
  };

  // 5. Batch processing loop
  for (let i = 0; i < allSvgFiles.length; i++) {
    const filePath = allSvgFiles[i];

    // Check resume cache
    if (!cliArgs.force && alreadyProcessed.has(filePath)) {
      stats.skippedCache++;
      continue;
    }

    try {
      // Step A: Preserve original file - READ ONLY
      const rawContent = fs.readFileSync(filePath, 'utf-8');
      const fileSizeBytes = Buffer.byteLength(rawContent, 'utf-8');

      // Step B: Style detection & name normalization
      const style = extractStyleFromPath(filePath, cliArgs.dir);
      stats.stylesDetected[style] = (stats.stylesDetected[style] || 0) + 1;

      const baseName = path.basename(filePath, path.extname(filePath));
      const iconName = formatIconName(baseName);
      const normalizedSlug = `fa-${style}-${baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      // Step C: Content hashing for duplicate tracking
      const contentHash = crypto.createHash('sha256').update(rawContent).digest('hex');

      // Step D: Strict SVG Security validation & sanitization
      const security = sanitizeAndValidateSvg(rawContent);
      if (!security.isValid) {
        stats.invalidSecurity++;
        stats.errors.push({
          file: filePath,
          reason: `Security violations: ${security.violations.join('; ')}`,
        });
        continue;
      }

      // Step E: Database persistence (unless dry-run)
      if (!cliArgs.dryRun) {
        const result = dbStore.upsertSvgAsset({
          name: iconName,
          slug: normalizedSlug,
          description: `Font Awesome Pro (${style}) icon: ${iconName}. Locally owned and verified asset.`,
          svg_content: security.sanitizedSvg,
          collection_id: targetCol?.id,
          category_id: defaultCategory?.id,
          license_id: targetLic?.id,
          width: security.width || 24,
          height: security.height || 24,
          view_box: security.viewBox || '0 0 512 512',
          file_size: security.fileSizeBytes || fileSizeBytes,
          status: 'published',
          style: style,
          source: 'font-awesome-pro',
          storage_path: path.resolve(filePath), // Local preserved path
          content_hash: contentHash,
          is_pro: true, // Mark as Pro licensed
          tags: [style, 'font-awesome', 'pro', ...baseName.split(/[-_]+/).filter((w) => w.length > 2)],
        });

        if (result.action === 'created') stats.created++;
        else if (result.action === 'updated') stats.updated++;
        else stats.unchanged++;

        // Update resume state
        resumeState.processedPaths[filePath] = contentHash;

        // Save resume state periodically
        if (stats.processed % cliArgs.batchSize === 0) {
          saveResumeState(cliArgs.resumeFile, resumeState);
        }
      } else {
        // In dry-run mode, simulate duplicate check
        const existing = dbStore.findByContentHash(contentHash);
        if (existing) {
          stats.unchanged++;
        } else {
          stats.created++;
        }
      }

      stats.processed++;
    } catch (err) {
      stats.errors.push({
        file: filePath,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Final resume state save
  if (!cliArgs.dryRun) {
    resumeState.lastRun = new Date().toISOString();
    saveResumeState(cliArgs.resumeFile, resumeState);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // 6. Summary Output
  console.log('\n=====================================================');
  console.log('✅ Font Awesome Pro Import Completed');
  console.log('=====================================================');
  console.log(`⏱️  Duration            : ${duration}s`);
  console.log(`📁 Files Scanned       : ${stats.scanned}`);
  console.log(`⚡ Files Processed     : ${stats.processed}`);
  console.log(`✨ New Icons Created   : ${stats.created}`);
  console.log(`🔄 Existing Updated    : ${stats.updated}`);
  console.log(`⏸️  Unchanged Duplicates: ${stats.unchanged}`);
  console.log(`⏩ Skipped by Cache    : ${stats.skippedCache}`);
  console.log(`🛡️  Security Violations : ${stats.invalidSecurity}`);
  console.log('\n🎨 Styles Breakdown:');
  for (const [st, count] of Object.entries(stats.stylesDetected)) {
    console.log(`   - ${st.padEnd(16)} : ${count} icons`);
  }

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors Encountered (${stats.errors.length}):`);
    stats.errors.slice(0, 10).forEach((e, idx) => {
      console.log(`   ${idx + 1}. [${path.basename(e.file)}] ${e.reason}`);
    });
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more.`);
    }
  }
  console.log('=====================================================\n');

  return {
    success: stats.errors.length === 0,
    duration,
    stats,
  };
}

// Direct execution via CLI
if (process.argv[1] && process.argv[1].endsWith('import-font-awesome.ts')) {
  const cliArgs = parseArgs(process.argv.slice(2));
  if (cliArgs.help) {
    showHelp();
    process.exit(0);
  }
  runFontAwesomeImport(cliArgs)
    .then((res) => {
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal import error:', err);
      process.exit(1);
    });
}

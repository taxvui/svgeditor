# Font Awesome Pro SVG Asset Importer Guide

This guide details how to configure, execute, and monitor the server-side Font Awesome Pro SVG importer in **VectorHub**.

---

## 1. Overview & Design Principles

The VectorHub Font Awesome Pro Importer is a headless, server-side utility designed to ingest privately licensed Font Awesome Pro vector collections into the database:

- **Original File Preservation**: The importer operates in **read-only mode** on your local files. Original SVG files on disk are never altered, renamed, or deleted.
- **Automated Style Detection**: Subdirectory hierarchies are parsed automatically to categorize icons into their respective Font Awesome Pro styles (`solid`, `regular`, `light`, `thin`, `duotone`, `brands`, `sharp-solid`, `sharp-regular`, `sharp-light`, `sharp-thin`).
- **Cryptographic Duplicate Detection**: Computes SHA-256 hashes for all SVG payloads. If an identical asset already exists in the database, it is safely marked unchanged or updated without duplicate proliferation.
- **Strict Vector Sanitization**: All SVG files pass through an AST sanitizer that strips dangerous tags (`<script>`, `<foreignObject>`, `<iframe>`), malicious inline event handlers (`onload`, `onclick`, `onerror`), and external entity expansions before database insertion.
- **Resumable Batch Ingestion**: Progress is automatically cached in `.import-cache/fa-import-resume.json`. If an import session is interrupted, re-running the command resumes immediately from the last scanned file.
- **Zero Public Bucket Uploads**: By default, privately licensed Font Awesome Pro assets remain stored and served through your local server environment and are flagged with non-redistribution license badges.

---

## 2. Directory Structure

The importer is built to understand both standard Font Awesome Pro npm package distributions and extracted zip archives:

```text
my-font-awesome-pro/
├── svgs/
│   ├── solid/
│   │   ├── camera.svg
│   │   ├── shield-check.svg
│   │   └── user.svg
│   ├── regular/
│   │   ├── heart.svg
│   │   └── bookmark.svg
│   ├── light/
│   │   ├── bell.svg
│   │   └── compass.svg
│   ├── thin/
│   │   └── star.svg
│   ├── duotone/
│   │   ├── bolt.svg
│   │   └── cloud-arrow-up.svg
│   ├── brands/
│   │   └── github.svg
│   └── sharp-solid/
│       └── key.svg
```

*Note: Subdirectories directly at root (e.g. `solid/*.svg`, `duotone/*.svg`) without an intermediate `svgs/` folder are also automatically recognized.*

---

## 3. Configuration & Environment Variables

You can configure the source directory via environment variable or CLI arguments:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `SVG_FA_PRO_DIR` | Absolute or relative path to local Font Awesome Pro folder | `./assets/sample-fa-pro` |
| `SQL_HOST` / `SQL_DB_NAME` | Database connection variables (PostgreSQL) | Configured in server env |

To set the directory in your `.env` file:
```bash
SVG_FA_PRO_DIR="/path/to/my/fontawesome-pro-svgs"
```

---

## 4. CLI Execution & Commands

The importer is located in `scripts/import-font-awesome.ts` and can be run directly via `npm run import:fa` or `npx tsx`:

### A. Dry-Run Simulation (Recommended First Step)
Simulate the scan, validate SVGs, and inspect detected styles without making database changes:
```bash
npx tsx scripts/import-font-awesome.ts --dir /path/to/fa-pro --dry-run
```

### B. Standard Live Import
Perform a live import using the default batch size (50):
```bash
npx tsx scripts/import-font-awesome.ts --dir /path/to/fa-pro
```
or using npm:
```bash
npm run import:fa -- --dir /path/to/fa-pro
```

### C. Customized Batch Size & Custom Resume Cache
For large collections (over 10,000+ files):
```bash
npx tsx scripts/import-font-awesome.ts \
  --dir /path/to/fa-pro \
  --batch-size 100 \
  --resume-file ./.import-cache/my-fa-progress.json \
  --collection "Font Awesome Pro v6"
```

### D. Re-scan & Force Update
Bypass the resume cache and verify all hashes against current database state:
```bash
npx tsx scripts/import-font-awesome.ts --dir /path/to/fa-pro --force
```

### CLI Command Options Reference:
```text
Options:
  --dir, -d <path>         Source directory containing Font Awesome SVG files.
  --dry-run, -n            Simulate import without writing to database.
  --batch-size, -b <num>   Number of files to process per batch (default: 50).
  --resume-file, -r <path> Path to cache file tracking processed SVGs.
  --collection, -c <name>  Collection name in database (default: "Font Awesome Pro").
  --force, -f              Ignore resume cache and re-process all files.
  --help, -h               Show documentation.
```

---

## 5. Sample Import Verification

A small authorized sample set is bundled at `./assets/sample-fa-pro/` for verification:

```bash
# 1. Run simulation test
npx tsx scripts/import-font-awesome.ts --dir ./assets/sample-fa-pro --dry-run

# 2. Run live import
npx tsx scripts/import-font-awesome.ts --dir ./assets/sample-fa-pro
```

Sample output:
```text
=====================================================
🚀 VectorHub — Font Awesome Pro Asset Importer
=====================================================
📂 Source Directory : /app/applet/assets/sample-fa-pro
⚙️  Dry-Run Mode     : NO (Live DB writes)
📦 Batch Size       : 50
💾 Resume Cache     : ./.import-cache/fa-import-resume.json
🏷️  Target Collection: Font Awesome Pro
-----------------------------------------------------
🔍 Scanning directory hierarchy for SVG assets...
📊 Discovered 8 SVG candidate file(s).
=====================================================
✅ Font Awesome Pro Import Completed
=====================================================
⏱️  Duration            : 0.02s
📁 Files Scanned       : 8
⚡ Files Processed     : 8
✨ New Icons Created   : 8
🔄 Existing Updated    : 0
⏸️  Unchanged Duplicates: 0
⏩ Skipped by Cache    : 0
🛡️  Security Violations : 0

🎨 Styles Breakdown:
   - brands           : 1 icons
   - duotone          : 1 icons
   - light            : 1 icons
   - regular          : 1 icons
   - sharp-solid      : 1 icons
   - solid            : 2 icons
   - thin             : 1 icons
=====================================================
```

---

## 6. Public Directory & Admin Integration

1. **Style Filters**: The public directory at `/` immediately exposes a style filter bar with pills for `Solid`, `Regular`, `Light`, `Thin`, `Duotone`, `Brands`, and `Sharp Solid`.
2. **Preview Cards**: Imported assets display authentic SVG renderings, file sizes, and style tags. Pro assets feature a distinct `PRO` badge.
3. **Detail Page & Licensing**: Detail pages (`/s/[id]/[slug]`) include a legal disclaimer clarifying non-redistribution terms, display the preserved local storage path, show the SHA-256 hash, and provide live PNG/SVG exports and SVG Studio optimization tools.
4. **Admin Studio**: The Admin Dashboard at `/admin` includes a dedicated **Font Awesome Pro Local Importer** card in the **Batch Importer** tab with real-time execution controls.

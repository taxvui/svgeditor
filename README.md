# VectorHub — Production-Ready Full-Stack SVG Library & Studio

VectorHub is an open-source vector library, SVG inspector, and client/server optimization platform inspired by SVGViewer.dev. Built with a production-grade full-stack architecture, PostgreSQL relational schema, Zod request validation, SVGO optimization pipeline, SVG security sanitization engine, and DeepMind Science skill integrations.

---

## 1. Architecture & Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide Icons | Responsive directory, zoom stage, code editor, admin dashboard |
| **Backend API** | Node.js, Express, tsx | RESTful API endpoints, rate limiting, security headers, cookie auth |
| **Database** | PostgreSQL / Supabase, Relational Store | Relational schema for assets, collections, categories, licenses, tags |
| **Validation** | Zod | Server-side runtime request schema validation |
| **SVG Engine** | SVGO (v3) & DOM Sanitizer | XSS script stripping, whitespace minification, float coordinate rounding |
| **Science Skill** | Google DeepMind Science / PubChem PUG REST | Molecular compound resolution, 2D structure vectors, SMILES metadata |

---

## 2. Directory Structure

```
├── .data/                      # Local relational database storage
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx   # Protected operations studio (CRUD, imports, tests)
│   │   ├── DirectoryPage.tsx    # Responsive SVG grid, sorting, 24-item pagination
│   │   ├── EditorPage.tsx       # Live vector code editor, zoom, multi-pass optimizer
│   │   ├── Header.tsx           # Top navigation following Top Bar Contract
│   │   └── IconDetailPage.tsx   # Detailed preview, PNG exporter (16-1024px), Data URI
│   ├── data/
│   │   └── iconDataset.ts       # 56+ production-ready curated vector assets
│   ├── db/
│   │   ├── database.ts          # Relational database engine, indexing, pagination
│   │   └── schema.ts            # PostgreSQL DDL migrations, relational interfaces
│   ├── server/
│   │   ├── api.ts               # Express REST API routes with Zod validation
│   │   ├── scienceService.ts    # DeepMind Science PubChem API connector
│   │   ├── svgoService.ts       # Server-side SVGO optimization engine
│   │   └── svgSecurity.ts       # Stored XSS defense, script tag stripping, sanitization
│   ├── types/
│   │   └── icon.ts              # TypeScript domain types & optimizer interfaces
│   ├── utils/
│   │   ├── router.ts            # Client-side SPA routing & browser history sync
│   │   ├── svgExporter.ts       # PNG canvas rasterizer & Data URI generator
│   │   └── svgOptimizer.ts      # Multi-pass client optimizer & XML prettifier
│   ├── App.tsx                  # Root application router & dark mode state
│   ├── index.css                # Tailwind styling, checkerboard canvas textures
│   └── main.tsx                 # React DOM mount point
├── server.ts                    # Express server entry point mounting Vite middlewares
├── .env.example                 # Documented environment variables
├── package.json                 # Project dependencies & scripts
└── tsconfig.json                # TypeScript strict configuration
```

---

## 3. Database Schema & Migrations

The database models 7 relational entities with foreign keys and indexes:

- **`svg_assets`**: `id` (UUID), `name`, `slug` (unique), `description`, `svg_content`, `thumbnail_path`, `collection_id` (FK), `category_id` (FK), `license_id` (FK), `width`, `height`, `view_box`, `file_size`, `status` (`published` | `draft` | `archived`), `created_at`, `updated_at`, `published_at`.
- **`categories`**: `id` (UUID), `name`, `slug` (unique), `description`.
- **`collections`**: `id` (UUID), `name`, `slug` (unique), `description`, `source_url`, `author`.
- **`licenses`**: `id` (UUID), `name`, `license_url`, `attribution_required`, `commercial_use_allowed`.
- **`tags`**: `id` (UUID), `name`, `slug` (unique).
- **`svg_asset_tags`**: `asset_id` (FK), `tag_id` (FK) composite primary key.
- **`profiles`**: `id` (UUID), `email` (unique), `display_name`, `role` (`admin` | `editor` | `viewer`), `created_at`.

DDL migrations are available in `src/db/schema.ts` (`POSTGRES_MIGRATION_SQL`).

---

## 4. REST API Documentation

### Public Endpoints

- `GET /api/svg`
  - Query params: `page` (default: 1), `limit` (default: 24), `category`, `collection`, `tag`, `q`, `sort`, `status`
  - Response: `{ items: SvgAsset[], total: number, page: number, limit: number, totalPages: number }`
- `GET /api/svg/:id`
  - Retrieve detailed SVG record by UUID or slug with linked taxonomy.
- `GET /api/categories` — List all categories with published asset counts.
- `GET /api/collections` — List all collections with author details.
- `GET /api/search?q=query` — Fast search across titles, descriptions, and tags.
- `POST /api/svg/optimize`
  - Request: `{ svg: string, multipass?: boolean, precision?: number }`
  - Response: `{ success: true, optimizedSvg: string, originalBytes: number, optimizedBytes: number, bytesSaved: number, percentageSaved: number, durationMs: number }`

### Admin & Operations Endpoints

- `POST /api/svg` — Create SVG asset with security validation and XSS neutralization.
- `PATCH /api/svg/:id` — Update asset metadata, status, or markup.
- `DELETE /api/svg/:id` — Delete asset and cascade tag associations.
- `POST /api/svg/import` — Batch import multiple SVGs with duplicate detection.
- `POST /api/science/fetch-chemical-svg` — PubChem API connector resolving 2D chemical structure vectors.
- `GET /api/admin/supabase-status` — Health check, endpoint status, and table readiness for Supabase project.
- `POST /api/admin/supabase-sync` — Synchronize local database icons and Font Awesome Pro assets to Supabase.

---

## 5. Security & Sanitization

1. **Stored XSS Prevention**:
   - Rejects or neutralizes executable tags: `<script>`, `<iframe>`, `<object>`, `<embed>`, `<foreignObject>` with arbitrary scripts.
   - Strips all `on*` event handlers (`onload`, `onclick`, `onerror`, `onmouseover`).
   - Strips dangerous URI schemes (`javascript:`, `vbscript:`, `data:text/html`).
2. **Denial of Service (DoS) Defense**:
   - 512 KB payload size ceiling per asset.
   - Rejects XML External Entity (XXE) and DTD entity injection attacks.
3. **Data Integrity**:
   - Runtime Zod schema enforcement on all payload fields.

---

## 6. Science Skill Integration

VectorHub integrates the Google DeepMind Science Skill connecting to the **PubChem PUG REST API**:
- Query chemical molecules by common or IUPAC name (e.g., *Aspirin*, *Caffeine*, *Dopamine*, *Ibuprofen*).
- Resolves Compound IDs (CID), molecular formulas, and canonical SMILES using the `fetchWithRetry` backoff algorithm.
- Renders vector representations into the library's **Science & Molecules** collection.

---

## 7. Font Awesome Pro Local Asset Importer

VectorHub includes a dedicated, server-side batch importer (`scripts/import-font-awesome.ts`) designed to ingest locally owned Font Awesome Pro SVG collections safely without exposing raw files to public buckets or modifying the original directory structure.

### Features
- **Recursive Scanning**: Automatically discovers all `.svg` files across nested directories.
- **Style Detection**: Identifies icon styles from directory naming (`solid`, `regular`, `light`, `thin`, `duotone`, `brands`, `sharp-solid`).
- **Name & Slug Extraction**: Normalizes filenames into human-readable titles (e.g. `arrow-up-right` → `Arrow Up Right`) and unique prefixed slugs (`fa-solid-arrow-up-right`).
- **Non-Destructive File Ingestion**: Preserves the original files in place; never writes to, moves, or deletes source files.
- **Security Validation & Sanitization**: Validates XML structure, rejects embedded executable scripts or dangerous event handlers, and prevents stored XSS attacks.
- **Duplicate Detection & Content Hashing**: Generates SHA-256 hashes of each SVG payload to avoid creating duplicates and safely update existing database records.
- **Resumable Batching & Dry-Run Mode**: Supports interruption recovery via a local resume cache (`.import-cache/fa-import-resume.json`), configurable chunk sizes, and simulation without DB mutations.

### Configuration
Set the source directory via the environment variable in `.env` or pass the path directly to the CLI:
```bash
# In .env
SVG_FA_PRO_DIR="/path/to/fontawesome-pro-svgs"
```

Expected directory hierarchy:
```
/path/to/fontawesome-pro-svgs/
  ├── solid/
  │   ├── camera.svg
  │   └── shield-check.svg
  ├── duotone/
  │   └── bolt.svg
  ├── light/
  │   └── heart.svg
  ├── regular/
  │   └── star.svg
  ├── thin/
  │   └── bookmark.svg
  ├── brands/
  │   └── github.svg
  └── sharp-solid/
      └── key.svg
```

### CLI Commands
```bash
# 1. Dry run simulation (checks files and displays summary without writing to DB)
npm run import:fa -- --dry-run

# 2. Dry run with a custom directory
npm run import:fa -- --dir ./assets/sample-fa-pro --dry-run

# 3. Live import with custom batch size
npm run import:fa -- --dir ./assets/sample-fa-pro --batch-size 50

# 4. Force re-processing all files (bypassing resume cache)
npm run import:fa -- --force

# 5. Display command-line help
npm run import:fa -- --help
```

---

## 8. Running the Platform

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Import Font Awesome Pro Assets (Optional)**:
   ```bash
   npm run import:fa
   ```
3. **Start Dev Server (Port 3000)**:
   ```bash
   npm run dev
   ```
4. **Execute Verification & Tests**:
   - Open `/admin` in the browser and navigate to the **Test Runner** tab, or run:
   ```bash
   npm run lint
   ```
5. **Build for Production**:
   ```bash
   npm run build
   ```


## Secure Vercel configuration

Configure these **server-only** variables in Vercel Settings > Environment Variables,
for the environments you use. Redeploy after changing them. Never use VITE_ for
private credentials and never commit a populated .env.

| Variable | Value |
| --- | --- |
| SVG_SUPABASE_URL | Your Supabase project URL |
| SVG_SUPABASE_PUBLISHABLE_KEY | Publishable key for password sign-in (or SVG_SUPABASE_ANON_KEY) |
| SVG_SUPABASE_SECRET_KEY | Server secret key (or SVG_SUPABASE_SERVICE_ROLE_KEY) |
| SVG_ADMIN_EMAILS | Comma-separated email addresses of permitted administrators |
| SVG_DATABASE_URL | Optional; the app uses Supabase REST, not a direct SQL connection |

1. Rotate the Supabase secret previously committed to the public .env.example.
   Removing it from the latest file does not revoke it or remove it from Git history.
2. Run src/db/migrations/0001_init.sql followed by 0002_secure_api_access.sql
   in your Supabase SQL Editor. The latter enables RLS and revokes browser access
   to library tables. Service-role access is server-only.
3. Create and confirm the administrator account in Supabase Authentication > Users,
   then add its email to SVG_ADMIN_EMAILS. An empty list denies all admin access.
4. Deploy and open /login. Sign in with that account's email and password.
   There are no demo passwords or default administrator privileges.
5. If the database is empty, use the authenticated admin sync action to copy the
   repository's local icon dataset into Supabase. This is an explicit import step.

All library reads and writes use Supabase when configured. Vercel/production
never silently writes to its ephemeral local filesystem. Local development may
use the sample database if Supabase is not configured. Login sessions use an
HttpOnly, Secure (production), SameSite=Strict cookie, verified with Supabase on
requests. Sessions expire with the Supabase access token; sign in again afterward.
The API checks permissions independently of the UI. Configure Supabase Auth
rate limits/CAPTCHA for your deployment as needed.

In the SVG editor, Crop adjusts the viewBox and clips its display without deleting
source shapes. Fit to content measures the artwork, includes stroke margins and
optional padding. Center preserves canvas dimensions and shifts the viewBox
origin to place the artwork at its center. Both apply to the complete drawing,
including transformed groups, and are saved in undo/redo history and exports.
Filter shadows and markers can extend beyond geometric bounds; use fit padding
for those effects. The editor does not support selecting individual objects yet.

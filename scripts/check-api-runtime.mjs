// Exercise the emitted ESM API with plain Node, without tsx's module resolver.
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const output = await mkdtemp(join(tmpdir(), 'svg-api-runtime-'));
let server;
try {
  const compiled = spawnSync(resolve('node_modules/.bin/tsc'), [
    '--ignoreConfig', '--module', 'NodeNext', '--moduleResolution', 'NodeNext',
    '--target', 'ES2022', '--esModuleInterop', '--skipLibCheck',
    '--outDir', output, '--rootDir', root, 'api/index.ts', 'api/[...all].ts',
  ], { cwd: root, encoding: 'utf8' });
  assert.equal(compiled.status, 0, compiled.stderr || compiled.stdout);
  await writeFile(join(output, 'package.json'), '{"type":"module"}');
  await symlink(resolve('node_modules'), join(output, 'node_modules'), 'junction');
  process.env.VERCEL = '1';
  // Empty values prevent dotenv from loading real project credentials in this test.
  for (const key of ['SVG_SUPABASE_URL', 'SVG_SUPABASE_PUBLISHABLE_KEY', 'SVG_SUPABASE_ANON_KEY', 'SVG_SUPABASE_SECRET_KEY', 'SVG_SUPABASE_SERVICE_ROLE_KEY', 'SVG_ADMIN_EMAILS']) process.env[key] = '';
  const { default: app } = await import(pathToFileURL(join(output, 'api/index.js')).href);
  const { default: catchall } = await import(pathToFileURL(join(output, 'api/[...all].js')).href);
  assert.equal(app, catchall);
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base + '/api/health')).status, 200);
  const me = await fetch(base + '/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal((await me.json()).authenticated, false);
  const login = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'diagnostic@example.invalid', password: 'test-password' }) });
  assert.equal(login.status, 503);
  assert.equal((await login.json()).code, 'AUTH_NOT_CONFIGURED');
  console.log('PASS compiled ESM runtime: both API entries load; health/session respond; missing auth configuration returns JSON.');
} finally {
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  await rm(output, { recursive: true, force: true });
}

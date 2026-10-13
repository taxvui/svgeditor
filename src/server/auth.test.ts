import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

test('Supabase login, admin authorization, and remote database selection', async () => {
  const remoteCalls: string[] = [];
  const user = { id: 'd1cd6307-d218-463c-884e-c6d562065b24', email: 'owner@example.test', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '2026-01-01T00:00:00Z' };
  const remote = createServer(async (req, res) => {
    const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString();
    res.setHeader('Content-Type', 'application/json');
    if (req.url?.startsWith('/auth/v1/token')) {
      if (JSON.parse(body).password !== 'test-correct-password') { res.statusCode = 400; res.end(JSON.stringify({ message: 'Invalid credentials' })); return; }
      res.end(JSON.stringify({ user, access_token: 'verified-test-session', refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer' })); return;
    }
    if (req.url?.startsWith('/auth/v1/user')) {
      if (req.headers.authorization !== 'Bearer verified-test-session') { res.statusCode = 401; res.end(JSON.stringify({ message: 'Invalid token' })); return; }
      res.end(JSON.stringify(user)); return;
    }
    if (req.url?.startsWith('/auth/v1/logout')) { res.end('{}'); return; }
    if (req.url?.startsWith('/rest/v1/svg_assets')) {
      remoteCalls.push(req.url);
      res.setHeader('Content-Range', '0-0/1');
      res.end(JSON.stringify([{ id: 'remote-id', name: 'Remote icon', slug: 'remote-icon', status: 'published', svg_content: '<svg/>', svg_asset_tags: [{ tags: { name: 'remote' } }] }])); return;
    }
    res.statusCode = 404; res.end('{}');
  });
  await new Promise<void>(resolve => remote.listen(0, '127.0.0.1', resolve));
  process.env.SVG_SUPABASE_URL = `http://127.0.0.1:${(remote.address() as any).port}`;
  process.env.SVG_SUPABASE_PUBLISHABLE_KEY = 'test-publishable';
  process.env.SVG_SUPABASE_SECRET_KEY = 'test-server-secret';
  process.env.SVG_ADMIN_EMAILS = 'owner@example.test';
  const { default: app } = await import('./app.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}/api`;
  const post = (path: string, body: object, headers: Record<string, string> = {}) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  try {
    const me = await fetch(base + '/auth/me'); assert.equal((await me.json()).authenticated, false);
    for (const headers of ([{}, { Cookie: 'vh_user=admin@vectorhub.dev' }, { Authorization: 'Bearer admin-token-anything' }, { Cookie: 'vh_session=forged' }] as Record<string, string>[])) {
      assert.equal((await fetch(base + '/admin/stats', { headers })).status, 401);
      assert.equal((await post('/svg', {}, headers)).status, 401);
      assert.equal((await post('/svg/import', {}, headers)).status, 401);
      assert.equal((await post('/admin/supabase-sync', {}, headers)).status, 401);
      for (const method of ['PATCH', 'DELETE']) assert.equal((await fetch(base + '/svg/remote-id', { method, headers: { 'Content-Type': 'application/json', ...headers }, body: '{}' })).status, 401);
    }
    assert.equal((await post('/auth/login', { email: user.email, password: 'wrong' })).status, 401);
    const signedIn = await post('/auth/login', { email: user.email, password: 'test-correct-password' });
    assert.equal(signedIn.status, 200);
    const cookie = signedIn.headers.get('set-cookie')!;
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Strict/);
    assert.equal((await signedIn.json()).profile.role, 'admin');
    const headers = { Cookie: 'vh_session=verified-test-session' };
    const admin = await fetch(base + '/auth/me', { headers }); assert.equal((await admin.json()).profile.role, 'admin');
    process.env.SVG_ADMIN_EMAILS = '';
    assert.equal((await fetch(base + '/admin/stats', { headers })).status, 403);
    const unconfigured = await post('/auth/login', { email: user.email, password: 'test-correct-password' });
    assert.equal(unconfigured.status, 503); assert.equal((await unconfigured.json()).code, 'ADMIN_NOT_CONFIGURED');
    process.env.SVG_ADMIN_EMAILS = 'another@example.test';
    const notAdmin = await post('/auth/login', { email: user.email, password: 'test-correct-password' });
    assert.equal(notAdmin.status, 403); assert.equal((await notAdmin.json()).code, 'ADMIN_ACCESS_DENIED');
    process.env.SVG_ADMIN_EMAILS = user.email;
    assert.equal((await post('/svg', {}, headers)).status, 400); // Authorized, reaches schema validation.
    assert.equal((await post('/svg', {}, { ...headers, Origin: 'https://attacker.test' })).status, 403);
    assert.equal((await post('/auth/login', {}, { Origin: 'null' })).status, 403);
    const publicIcons = await fetch(base + '/svg?status=all');
    assert.equal(publicIcons.status, 200);
    const data = await publicIcons.json(); assert.equal(data.items[0].name, 'Remote icon'); assert.deepEqual(data.items[0].tags, ['remote']);
    assert.ok(remoteCalls.some(url => url.includes('status=eq.published')));
    await fetch(base + '/svg?status=all', { headers }); assert.ok(remoteCalls.some(url => !url.includes('status=eq.')));
    const logout = await post('/auth/logout', {}, headers); assert.equal(logout.status, 200); assert.match(logout.headers.get('set-cookie')!, /Expires=Thu, 01 Jan 1970/);
    process.env.SVG_SUPABASE_PUBLISHABLE_KEY = '';
    assert.equal((await post('/auth/login', { email: user.email, password: 'test-correct-password' })).status, 503);
  } finally {
    server.closeAllConnections(); remote.closeAllConnections();
    await Promise.all([new Promise<void>(resolve => server.close(() => resolve())), new Promise<void>(resolve => remote.close(() => resolve()))]);
  }
});

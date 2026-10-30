import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

// Only anonymous GET requests: safe to run against the shared live game.
const target = new URL(process.argv[2] || 'https://photo-fumble.onrender.com');
assert(!target.username && !target.password, 'Use a public URL without credentials.');
assert(
  target.protocol === 'https:' ||
    (target.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(target.hostname)),
  'Use HTTPS for an online deployment.',
);
const base = target.origin;
const checks: { name: string; passed: boolean; detail?: string }[] = [];

async function get(path: string) {
  const url = new URL(path, base);
  assert.equal(url.origin, base, 'Only request assets on the game’s own origin.');
  return fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20_000) });
}

async function check(name: string, run: () => Promise<void>) {
  try {
    await run();
    checks.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    checks.push({ name, passed: false, detail });
    console.error(`FAIL ${name}: ${detail}`);
  }
}

console.log(`Checking ${base} with anonymous, read-only requests.\n`);
let html = '';
await check('Public homepage responds over HTTPS', async () => {
  const response = await get('/');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /text\/html/);
  html = await response.text();
  assert.match(html, /<title>Photo Fumble<\/title>/i);
  assert.match(html, /id=["']root["']/);
});

await check('Deployed JavaScript and CSS files are available', async () => {
  assert(html, 'Homepage must load before checking its assets.');
  const assets = [
    ...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)=["']([^"']+)["'][^>]*>/gi),
  ]
    .map((match) => new URL(match[1], base))
    .filter((url) => /\.(?:js|css)$/.test(url.pathname));
  assert(
    assets.some((url) => url.pathname.endsWith('.js')),
    'Missing JavaScript entry.',
  );
  assert(
    assets.some((url) => url.pathname.endsWith('.css')),
    'Missing CSS entry.',
  );
  for (const asset of assets) {
    const response = await get(asset.href);
    assert.equal(response.status, 200, `${asset.pathname} must load.`);
    assert.match(
      response.headers.get('content-type') || '',
      asset.pathname.endsWith('.css') ? /text\/css/ : /(?:java|ecma)script/,
      `${asset.pathname} must have the expected content type.`,
    );
    assert((await response.text()).trim().length > 0, `${asset.pathname} must not be empty.`);
  }
});

await check('Game server health API returns ok', async () => {
  const response = await get('/api/health');
  assert.equal(response.status, 200);
  const body: unknown = await response.json();
  assert(body && typeof body === 'object' && 'ok' in body);
  assert.equal(body.ok, true);
  assert.match(response.headers.get('cache-control') || '', /no-store/);
});

await check('Session API requires a player cookie', async () => {
  const response = await get('/api/session');
  assert.equal(response.status, 401);
  const body: unknown = await response.json();
  assert(body && typeof body === 'object' && 'error' in body);
  assert.equal(typeof body.error, 'string');
});

await mkdir('output', { recursive: true });
await writeFile(
  'output/online-checks.json',
  JSON.stringify({ target: base, checkedAt: new Date().toISOString(), checks }, null, 2) + '\n',
);
const failed = checks.filter((result) => !result.passed).length;
console.log(
  `\n${checks.length - failed}/${checks.length} checks passed. Report: output/online-checks.json`,
);
console.log(
  'Multiplayer gameplay, uploads, audio playback, and reconnects still need a hosted rehearsal.',
);
if (failed) process.exitCode = 1;

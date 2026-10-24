import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { byteRange, processMedia } from '../server/media.js';

test('audio byte ranges support Safari probes, seeking, suffixes, and invalid ranges', () => {
  assert.deepEqual(byteRange('bytes=0-1', 100), [0, 1]);
  assert.deepEqual(byteRange('bytes=50-', 100), [50, 99]);
  assert.deepEqual(byteRange('bytes=-10', 100), [90, 99]);
  assert.deepEqual(byteRange('bytes=0-999', 100), [0, 99]);
  assert.equal(byteRange('bytes=200-300', 100), undefined);
  assert.equal(byteRange('bytes=50-20', 100), undefined);
  assert.equal(byteRange('bytes=-0', 100), undefined);
});

test('chat masks are flattened into stored pixels and images normalize to WebP', async () => {
  const white = await sharp({
    create: { width: 100, height: 100, channels: 3, background: '#ffffff' },
  })
    .png()
    .toBuffer();
  const output = await processMedia(white, 'chat', [{ x: 0, y: 0, width: 1, height: 0.5 }]);
  const { data, info } = await sharp(output.data).raw().toBuffer({ resolveWithObject: true });
  assert.equal(output.mime, 'image/webp');
  const top = 10 * info.width * info.channels;
  const bottom = 90 * info.width * info.channels;
  assert.ok(data[top] < 70);
  assert.ok(data[bottom] > 220);
});
test('impostor receives a separately encoded blur and unsupported images fail', async () => {
  const image = await sharp({
    create: { width: 80, height: 60, channels: 3, background: '#ff5555' },
  })
    .png()
    .toBuffer();
  const output = await processMedia(image, 'impostor', []);
  assert.ok(output.blur);
  assert.notDeepEqual(output.blur, output.data);
  await assert.rejects(() => processMedia(Buffer.from('<svg></svg>'), 'quiz', []), /file type/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

function getPngDimensions(relativePath) {
  const bytes = fs.readFileSync(path.join(root, relativePath));
  assert.equal(bytes.toString('hex', 0, 8), '89504e470d0a1a0a');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test('PWA manifest exposes a standalone home screen app with correctly sized icons', () => {
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');

  const icon192 = manifest.icons.find(icon => icon.src === '/assets/pwa-icon-192.png');
  const icon512 = manifest.icons.find(icon => icon.src === '/assets/pwa-icon-512.png');
  const maskableIcon = manifest.icons.find(icon => icon.src === '/assets/pwa-icon-maskable-512.png');

  assert.equal(icon192.sizes, '192x192');
  assert.equal(icon512.sizes, '512x512');
  assert.equal(maskableIcon.sizes, '512x512');
  assert.equal(maskableIcon.purpose, 'maskable');
  assert.deepEqual(getPngDimensions('assets/pwa-icon-192.png'), { width: 192, height: 192 });
  assert.deepEqual(getPngDimensions('assets/pwa-icon-512.png'), { width: 512, height: 512 });
  assert.deepEqual(getPngDimensions('assets/pwa-icon-maskable-512.png'), { width: 512, height: 512 });
});

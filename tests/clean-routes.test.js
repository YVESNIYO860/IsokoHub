const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeLocalPath, normalizeAbsoluteUrl } = require('../js/route-utils.js');

test('normalizeLocalPath strips .html extensions and preserves query strings', () => {
  assert.equal(normalizeLocalPath('/image-studio.html'), '/image-studio');
  assert.equal(normalizeLocalPath('/products.html?q=phones'), '/products?q=phones');
  assert.equal(normalizeLocalPath('/dashboard.html?view=settings'), '/dashboard?view=settings');
  assert.equal(normalizeLocalPath('/'), '/');
});

test('normalizeAbsoluteUrl rewrites localhost legacy html URLs to clean route URLs', () => {
  assert.equal(normalizeAbsoluteUrl('http://localhost:3000/image-studio.html'), 'http://localhost:3000/image-studio');
  assert.equal(normalizeAbsoluteUrl('http://localhost:3000/products.html?category=Phones'), 'http://localhost:3000/products?category=Phones');
  assert.equal(normalizeAbsoluteUrl('https://example.com/about.html#contact'), 'https://example.com/about#contact');
});

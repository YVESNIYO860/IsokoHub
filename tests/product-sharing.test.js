const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const shareCode = fs.readFileSync(path.join(root, 'js/core/product-sharing.js'), 'utf8');

function createShareContext(overrides = {}) {
  const context = {
    URL,
    console: { warn() {}, error() {} },
    document: { addEventListener() {} },
    navigator: {},
    window: { location: { origin: 'https://isokohub.example' }, prompt() {} },
    ...overrides
  };
  vm.createContext(context);
  vm.runInContext(shareCode, context);
  return context;
}

test('shares product details with a root-relative listing URL', async () => {
  let shared;
  const context = createShareContext({
    navigator: {
      share: async (data) => { shared = data; }
    }
  });

  const result = await context.shareProductListing('used camera', 'Used camera');

  assert.equal(result, 'shared');
  assert.deepEqual(JSON.parse(JSON.stringify(shared)), {
    title: 'Used camera',
    text: 'Check out Used camera on IsokoHub.',
    url: 'https://isokohub.example/product?id=used%20camera'
  });
});

test('copies the listing link when native sharing is unavailable', async () => {
  let copiedUrl = '';
  const context = createShareContext({
    navigator: {
      clipboard: {
        writeText: async (url) => { copiedUrl = url; }
      }
    }
  });

  const result = await context.shareProductListing('product-1', 'Phone');

  assert.equal(result, 'copied');
  assert.equal(copiedUrl, 'https://isokohub.example/product?id=product-1');
});

test('provides a manual copy fallback when clipboard access fails', async () => {
  let promptedUrl = '';
  const context = createShareContext({
    navigator: {
      clipboard: {
        writeText: async () => { throw new Error('Clipboard unavailable'); }
      }
    },
    window: {
      location: { origin: 'https://isokohub.example' },
      prompt: (message, url) => { promptedUrl = url; }
    }
  });

  const result = await context.shareProductListing('product-2', 'Tablet');

  assert.equal(result, 'prompted');
  assert.equal(promptedUrl, 'https://isokohub.example/product?id=product-2');
});

test('adds a share action to each product-card renderer', () => {
  const cardFiles = [
    'js/products.js',
    'js/home.js',
    'js/shop.js',
    'js/product-details.js',
    'src/ShoppingAssistant.jsx'
  ];

  for (const relativePath of cardFiles) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    assert.match(source, /data-share-product/, `${relativePath} should expose product sharing`);
  }

  const routeSource = fs.readFileSync(path.join(root, 'src/main.jsx'), 'utf8');
  assert.match(routeSource, /js\/core\/product-sharing\.js/);
});

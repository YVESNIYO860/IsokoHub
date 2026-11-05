const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

(async () => {
  const code = fs.readFileSync('js/data.js', 'utf8');
  const storage = {};
  const context = {
    console,
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      },
      setItem(key, value) {
        storage[key] = String(value);
      },
      removeItem(key) {
        delete storage[key];
      }
    },
    supabase: null,
    window: { __isokoPendingDataRequests: 0 }
  };
  vm.createContext(context);
  vm.runInContext(code, context);

  context.localStorage.setItem('isokoHubAdminShops', JSON.stringify([
    { id: 'shop-1', name: 'Trend House', products: ['p-1', 'p-3'] }
  ]));

  assert.strictEqual(typeof context.normalizeProductImageUrl, 'function');
  assert.strictEqual(context.normalizeProductImageUrl('https://example.com/photo.jxl'), '');
  assert.strictEqual(context.normalizeProductImageUrl('https://example.com/photo.png'), 'https://example.com/photo.png');

  const enriched = await context.enrichProductsWithShopData([{ id: 'p-1' }, { id: 'p-2' }, { id: 'p-3' }]);
  assert.strictEqual(enriched[0].shop.id, 'shop-1');
  assert.strictEqual(enriched[1].shop, null);
  assert.strictEqual(enriched[2].shop.name, 'Trend House');

  const storedShops = await context.readStoredShops();
  assert.strictEqual(storedShops[0].name, 'Trend House');
  const shopById = await context.getShopById('shop-1');
  assert.strictEqual(shopById.name, 'Trend House');

  console.log('shop-data test passed');
})();

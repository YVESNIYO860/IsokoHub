const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

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
  supabase: null
};
vm.createContext(context);
vm.runInContext(code, context);

context.localStorage.setItem('isokoHubAdminShops', JSON.stringify([
  { id: 'shop-1', name: 'Trend House', products: ['p-1', 'p-3'] }
]));

const enriched = context.enrichProductsWithShopData([{ id: 'p-1' }, { id: 'p-2' }, { id: 'p-3' }]);
assert.strictEqual(enriched[0].shop.id, 'shop-1');
assert.strictEqual(enriched[1].shop, null);
assert.strictEqual(enriched[2].shop.name, 'Trend House');
assert.strictEqual(context.readStoredShops()[0].name, 'Trend House');
assert.strictEqual(context.getShopById('shop-1').name, 'Trend House');
console.log('shop-data test passed');

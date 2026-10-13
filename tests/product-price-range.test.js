const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('js/data.js', 'utf8');
const context = {
  console,
  localStorage: {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
  },
  supabase: null
};
vm.createContext(context);
vm.runInContext(code, context);

const rangePrice = context.formatProductPrice({ price: 12000, price_min: 12000, price_max: 15000 });
assert.ok(rangePrice.includes('12,000'));
assert.ok(rangePrice.includes('15,000'));
assert.ok(rangePrice.includes('-'));
assert.strictEqual(context.hasProductPriceRange({ price_min: 12000, price_max: 15000 }), true);
assert.strictEqual(context.hasProductPriceRange({ price_min: 12000, price_max: 12000 }), false);
assert.strictEqual(
  context.formatProductPrice({ price: 12000, price_min: 12000, price_max: 12000 }),
  context.formatPrice(12000)
);
assert.strictEqual(
  context.formatProductPrice({ price: 12000 }),
  context.formatPrice(12000)
);
console.log('product price range test passed');
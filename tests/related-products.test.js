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
  supabase: null,
  window: {},
  crypto: { randomUUID: () => 'test-uuid' }
};
vm.createContext(context);
vm.runInContext(code, context);

const products = [
  { id: 'p-1', name: 'Laptop', category: 'Electronics', status: 'approved', price: 800 },
  { id: 'p-2', name: 'Phone', category: 'Electronics', status: 'approved', price: 500 },
  { id: 'p-3', name: 'Chair', category: 'Furniture', status: 'approved', price: 120 },
  { id: 'p-4', name: 'Desk', category: 'Furniture', status: 'approved', price: 200 },
  { id: 'p-5', name: 'Tablet', category: 'Electronics', status: 'approved', price: 350 },
  { id: 'p-6', name: 'Other', category: 'Home', status: 'approved', price: 100 }
];

const related = context.pickRelatedProducts(products, products[0], 4);
assert.strictEqual(related.length, 4);
assert.ok(related.every((item) => item.id !== 'p-1'));
assert.ok(related.some((item) => item.category === 'Electronics'));
assert.ok(related.length <= 4);
console.log('related product selection test passed');

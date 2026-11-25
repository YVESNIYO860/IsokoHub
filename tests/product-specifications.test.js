const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('js/data.js', 'utf8');
const context = {
  console,
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  supabase: null,
  window: {}
};
vm.createContext(context);
vm.runInContext(code, context);

const specs = context.getProductSpecifications({
  color: 'Midnight blue',
  ram: '8 GB',
  storageCapacity: '256 GB',
  condition: 'New',
  specifications: {
    _schema_version: 2,
    processor: 'Snapdragon',
    finish: 'Matte',
    empty: '  ',
    ignored: { value: 'not a display value' }
  }
});
const normalizedSpecs = JSON.parse(JSON.stringify(specs));

assert.deepStrictEqual(
  normalizedSpecs.map(({ label, value }) => [label, value]),
  [
    ['Color', 'Midnight blue'],
    ['Memory', '8 GB'],
    ['Storage', '256 GB'],
    ['Processor', 'Snapdragon'],
    ['Condition', 'New'],
    ['Finish', 'Matte']
  ]
);
assert.strictEqual(normalizedSpecs.find(spec => spec.label === 'Memory').icon, 'fa-memory');
assert.strictEqual(normalizedSpecs.find(spec => spec.label === 'Storage').icon, 'fa-hard-drive');
assert.strictEqual(context.needsProductDetailsUpdate({ specifications: { color: 'Black' } }), true);
assert.strictEqual(context.needsProductDetailsUpdate({ specifications: { _schema_version: 2 } }), false);
assert.ok(!normalizedSpecs.some(spec => spec.label.toLowerCase().includes('schema')));
console.log('product specifications test passed');

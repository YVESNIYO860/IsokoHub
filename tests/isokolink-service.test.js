const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('js/core/isokolink-service.js', 'utf8');
const context = {
  console,
  localStorage: {
    store: {},
    getItem(key) { return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null; },
    setItem(key, value) { this.store[key] = String(value); },
    removeItem(key) { delete this.store[key]; }
  },
  window: {},
  Date
};

try {
  vm.createContext(context);
  vm.runInContext(code, context);
  const service = context.window.IsokoLinkService;
  assert.ok(service, 'service should be exposed');
  const link = service.buildLink({ sourceType: 'product', sourceId: 'p-1', targetType: 'seller', targetId: 's-1', relationship: 'listed_by' });
  assert.strictEqual(link.relationship, 'listed_by');
  service.saveLink(link);
  assert.strictEqual(service.resolveLinksForEntity('product', 'p-1').length, 1);
  console.log('isokolink service test passed');
} catch (error) {
  console.error('isokolink service test failed');
  throw error;
}

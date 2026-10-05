const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('js/core/service-module.js', 'utf8');
const context = {
  console,
  window: {},
  localStorage: {
    store: {},
    getItem(key) { return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null; },
    setItem(key, value) { this.store[key] = String(value); },
    removeItem(key) { delete this.store[key]; }
  }
};

vm.createContext(context);
vm.runInContext(code, context);

const serviceModule = context.window.ServiceModule;
assert.ok(serviceModule, 'service module contract should be exposed');
assert.strictEqual(typeof serviceModule.createServicePreview, 'function');
assert.strictEqual(typeof serviceModule.normalizeServiceRecord, 'function');
assert.strictEqual(serviceModule.createServicePreview({ title: 'Plumbing', category: 'Home Repairs' }).title, 'Plumbing');
console.log('service module contract test passed');

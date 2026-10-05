const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('js/core/property-module.js', 'utf8');
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

const propertyModule = context.window.PropertyModule;
assert.ok(propertyModule, 'property module contract should be exposed');
assert.strictEqual(typeof propertyModule.createPropertyPreview, 'function');
assert.strictEqual(typeof propertyModule.normalizePropertyRecord, 'function');
assert.strictEqual(propertyModule.createPropertyPreview({ title: 'Apartment', location: 'Kigali' }).title, 'Apartment');
console.log('property module contract test passed');

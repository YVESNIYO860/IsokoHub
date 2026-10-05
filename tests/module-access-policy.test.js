const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('js/core/module-access-policy.js', 'utf8');
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

vm.createContext(context);
vm.runInContext(code, context);

const policy = context.window.ModuleAccessPolicy;
assert.ok(policy, 'policy service should be exposed');
assert.strictEqual(typeof policy.getModuleAccessState, 'function');
assert.strictEqual(policy.getModuleAccessState('market', { role: 'customer' }).allowed, true);
assert.strictEqual(policy.getModuleAccessState('properties', { role: 'customer' }).allowed, false);
console.log('module access policy test passed');

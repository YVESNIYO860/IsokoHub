const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('js/core/ecosystem-discovery.js', 'utf8');
const stubDocument = {
  body: {
    appendChild() {}
  },
  createElement() {
    return {
      setAttribute() {},
      appendChild() {},
      style: {},
      innerHTML: ''
    };
  },
  querySelector() {
    return null;
  }
};

const context = {
  console,
  document: stubDocument,
  window: {
    moduleRegistry: {
      getModuleRegistry() {
        return {
          services: {
            key: 'services',
            label: 'Services',
            route: '/services',
            enabled: true,
            entityTypes: ['service'],
            description: 'Service discovery and booking.'
          }
        };
      },
      registerModule() {}
    },
    isokoCore: {
      modules: {
        market: {
          key: 'market',
          label: 'Market',
          route: '/products',
          enabled: true,
          entityTypes: ['product'],
          description: 'Marketplace products and seller listings.'
        }
      },
      registerModule() {}
    }
  }
};

vm.createContext(context);
vm.runInContext(code, context);

const discovery = context.window.EcosystemDiscovery;
assert.ok(discovery, 'discovery registry should be exposed');
assert.strictEqual(typeof discovery.resolveModuleForEntity, 'function');
assert.strictEqual(typeof discovery.renderDiscoveryShell, 'function');
assert.strictEqual(discovery.resolveModuleForEntity('service').key, 'services');
console.log('ecosystem discovery contract test passed');

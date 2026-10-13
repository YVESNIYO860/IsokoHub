const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('js/data.js', 'utf8');
const context = {
  console,
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  supabase: null,
  window: {},
  crypto: { randomUUID: () => 'test-uuid' }
};
vm.createContext(context);
vm.runInContext(code, context);

const description = context.renderProductDescription('**Bold** and *italic*\n++underline++ and `code`\n- One\n- Two\n[Details](https://example.com) <img src=x onerror=alert(1)>');
assert.ok(description.includes('<strong>Bold</strong>'));
assert.ok(description.includes('<em>italic</em>'));
assert.ok(description.includes('<u>underline</u>'));
assert.ok(description.includes('<code>code</code>'));
assert.ok(description.includes('<ul><li>One</li><li>Two</li></ul>'));
assert.ok(description.includes('href="https://example.com"'));
assert.ok(description.includes('&lt;img'));
assert.ok(!description.includes('<img'));
assert.ok(!context.renderProductDescription('[bad](javascript:alert(1))').includes('<a '));
console.log('description formatting test passed');
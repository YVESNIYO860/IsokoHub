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

const textNode = (value) => ({ nodeType: 3, nodeValue: value });
const element = (tagName, childNodes = [], attributes = {}) => ({
  nodeType: 1,
  tagName: tagName.toUpperCase(),
  childNodes,
  children: childNodes.filter((child) => child.nodeType === 1),
  getAttribute(name) { return attributes[name] || null; }
});
const editorMarkup = element('div', [
  element('p', [element('strong', [textNode('bold')]), textNode(' '), element('em', [textNode('italic')])]),
  element('ul', [element('li', [textNode('First')]), element('li', [textNode('Second')])]),
  element('a', [textNode('safe link')], { href: 'https://example.com' }),
  element('a', [textNode('unsafe link')], { href: 'javascript:alert(1)' })
]);
assert.strictEqual(
  context.descriptionNodeToMarkdown(editorMarkup),
  '**bold** *italic*\n\n- First\n- Second\n\n[safe link](https://example.com)unsafe link\n\n'
);
console.log('description formatting test passed');
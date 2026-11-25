const test = require('node:test');
const assert = require('node:assert/strict');
const productIntelligence = require('../api/product-intelligence');
const { makePrompt, sanitizeExtractedDetails } = productIntelligence._test;

function mockResponse() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = value; }
  };
}

function preserveEnvironment(names) {
  return Object.fromEntries(names.map(name => [name, process.env[name]]));
}

function restoreEnvironment(values) {
  Object.entries(values).forEach(([name, value]) => {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  });
}

test('extracted listing details are restricted to supported, grounded form values', () => {
  const details = sanitizeExtractedDetails({
    name: 'Samsung Galaxy S23',
    category: 'Unknown category',
    condition: 'Maybe',
    color: 'Rose Gold',
    price_min: 500000,
    price_max: 350000,
    specifications: { brand: 'Samsung', invented_feature: 'Not allowed' },
    custom_specifications: [
      { label: 'Compatibility', value: 'Android apps' },
      { label: 'Phone number', value: '+250788000000' }
    ]
  });

  assert.equal(details.name, 'Samsung Galaxy S23');
  assert.equal(details.category, '');
  assert.equal(details.condition, '');
  assert.equal(details.color, 'Other');
  assert.equal(details.custom_color, 'Rose Gold');
  assert.equal(details.price_min, 350000);
  assert.equal(details.price_max, 500000);
  assert.deepEqual(details.specifications, { brand: 'Samsung' });
  assert.deepEqual(details.custom_specifications, [{ label: 'Compatibility', value: 'Android apps' }]);
});

test('seller AI drafts avoid visible Markdown markers and use styled plain-text formatting', () => {
  const prompt = makePrompt('description', {
    name: 'Samsung Galaxy A26 5G',
    category: 'Phones',
    description: '8 GB RAM and 256 GB storage'
  }, 'en', '');

  assert.match(prompt, /Never use asterisks, underscores, hash marks, backticks, or Markdown formatting markers/);
  assert.match(prompt, /plain-text headings ending in a colon and simple hyphen bullets/);
  assert.doesNotMatch(prompt, /standard Markdown bold/);
});

test('seller AI extracts fields from a description without requiring a name or category first', async () => {
  const environment = preserveEnvironment(['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GROQ_API_KEY', 'GROQ_MODEL']);
  const oldFetch = global.fetch;
  process.env.SUPABASE_URL = 'https://isokohub-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.GROQ_API_KEY = 'test-groq-key';
  delete process.env.GROQ_MODEL;

  const extracted = {
    name: 'Samsung Galaxy S23',
    category: 'Phones',
    condition: 'Used',
    color: 'Black',
    custom_color: '',
    price_min: 350000,
    price_max: 400000,
    specifications: { brand: 'Samsung', model: 'Galaxy S23', memory: '8 GB', storage: '256 GB' },
    custom_specifications: []
  };
  let groqRequest;
  global.fetch = async (url, options) => {
    if (String(url).includes('/auth/v1/user')) {
      return { ok: true, json: async () => ({ id: 'seller-123' }) };
    }
    if (String(url).includes('/rest/v1/user_profiles')) {
      return { ok: true, json: async () => [{ is_active: true, is_verified: true }] };
    }
    if (String(url).startsWith('https://api.groq.com/')) {
      groqRequest = JSON.parse(options.body);
      return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(extracted) } }] }) };
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const response = mockResponse();
    await productIntelligence({
      method: 'POST',
      headers: { authorization: 'Bearer session-token-for-testing', 'x-forwarded-for': '198.51.100.41' },
      socket: {},
      body: {
        action: 'extract_listing_details',
        language: 'en',
        product: { description: 'Used black Samsung Galaxy S23, 8 GB RAM and 256 GB storage. RWF 350,000 to 400,000.' }
      }
    }, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body).details, extracted);
    assert.deepEqual(groqRequest.response_format, { type: 'json_object' });
    assert.match(groqRequest.messages[1].content, /Do not convert another currency or estimate a price/);
  } finally {
    global.fetch = oldFetch;
    restoreEnvironment(environment);
  }
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { isProductDiscoveryRequest, parsePreliminaryFilters, validateLanguage } = require('../api/shopping-assistant')._test;
const { sanitizeProduct } = require('../api/product-intelligence')._test;
const { queryPublicProducts, validateSearchArguments } = require('../api/_shared/product-search');
const shoppingAssistant = require('../api/shopping-assistant');
const productIntelligence = require('../api/product-intelligence');

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

test('natural-language filter extraction recognizes price, district, condition and storage', () => {
  const filters = parsePreliminaryFilters('Find used laptops with 256 GB storage under 500,000 RWF in Huye');

  assert.equal(filters.condition, 'Used');
  assert.equal(filters.maxPrice, 500000);
  assert.equal(filters.district, 'Huye');
  assert.deepEqual(filters.specifications, { storage: '256 gb' });
  assert.match(filters.query, /laptops/);
});

test('natural-language filter extraction sorts cheapest matches first', () => {
  const filters = parsePreliminaryFilters('Find the cheapest Samsung phone');

  assert.equal(filters.brand, 'Samsung');
  assert.equal(filters.sortBy, 'price_asc');
});

test('only clear shopping requests trigger an automatic listing search', () => {
  assert.equal(isProductDiscoveryRequest('Find a laptop'), true);
  assert.equal(isProductDiscoveryRequest('Je cherche des annonces'), true);
  assert.equal(isProductDiscoveryRequest('How are you today?'), false);
  assert.equal(isProductDiscoveryRequest('Who developed IsokoHub?'), false);
});

test('seller language and product input are restricted to supported, public-safe fields', () => {
  assert.equal(validateLanguage('rw'), 'rw');
  assert.equal(validateLanguage('de'), '');

  const product = sanitizeProduct({
    name: 'Laptop',
    category: 'Electronics',
    price: 250000,
    description: 'Used laptop',
    phone: '+250000000000',
    specifications: { memory: '8 GB', contact: '+250000000000' }
  });

  assert.deepEqual(product.specifications, { memory: '8 GB' });
  assert.equal(Object.hasOwn(product, 'phone'), false);
});

test('search filters reject unsupported conditions and invalid pagination', () => {
  assert.throws(() => validateSearchArguments({ condition: 'Refurbished' }), /Condition must be New or Used/);
  assert.throws(() => validateSearchArguments({ offset: 81 }), /offset is invalid/);
});

test('price filters cover ranged and legacy fixed-price listings', async () => {
  const oldFetch = global.fetch;
  const oldUrl = process.env.SUPABASE_URL;
  const oldKey = process.env.SUPABASE_ANON_KEY;
  process.env.SUPABASE_URL = 'https://isokohub-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  let requestUrl = '';
  global.fetch = async (url) => {
    requestUrl = String(url);
    return {
      ok: true,
      json: async () => [
        { id: 'range', name: 'Laptop', category: 'Electronics', price: 250000, price_min: 200000, price_max: 300000, status: 'approved' },
        { id: 'fixed', name: 'Laptop', category: 'Electronics', price: 400000, price_min: null, price_max: null, status: 'approved' }
      ]
    };
  };

  try {
    const result = await queryPublicProducts({ query: 'laptop', maxPrice: 350000 });
    const filter = new URL(requestUrl).searchParams.get('and');
    assert.match(filter, /price_min\.lte\.350000/);
    assert.match(filter, /price\.lte\.350000/);
    assert.deepEqual(result.products.map(product => product.id), ['range']);
  } finally {
    global.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = oldKey;
  }
});

test('public search returns approved listing fields only and preserves missing prices as unavailable', async () => {
  const oldFetch = global.fetch;
  const oldUrl = process.env.SUPABASE_URL;
  const oldKey = process.env.SUPABASE_ANON_KEY;
  process.env.SUPABASE_URL = 'https://isokohub-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  let requestUrl = '';
  global.fetch = async (url, options) => {
    requestUrl = String(url);
    assert.equal(options.headers.Authorization, 'Bearer test-anon-key');
    return {
      ok: true,
      json: async () => [{
        id: 'public-item',
        name: 'Laptop',
        category: 'Electronics',
        price: null,
        price_min: null,
        price_max: null,
        currency: 'RWF',
        image: 'https://example.test/laptop.jpg',
        description: 'Approved listing',
        condition: 'Used',
        district: 'Huye',
        specifications: { memory: '8 GB' },
        status: 'approved',
        seller_email: 'private@example.test',
        seller_phone: '+250000000000'
      }]
    };
  };

  try {
    const result = await queryPublicProducts({ query: 'laptop', limit: 3 });
    assert.match(requestUrl, /status=eq\.approved/);
    assert.match(requestUrl, /select=/);
    assert.equal(result.products.length, 1);
    assert.equal(result.products[0].price, null);
    assert.equal(result.products[0].priceMin, null);
    assert.equal(Object.hasOwn(result.products[0], 'seller_email'), false);
  } finally {
    global.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = oldKey;
  }
});

test('shopping endpoint executes a bounded search tool and returns real public results', async () => {
  const environment = preserveEnvironment(['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GROQ_API_KEY', 'GROQ_MODEL']);
  const oldFetch = global.fetch;
  process.env.SUPABASE_URL = 'https://isokohub-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.GROQ_API_KEY = 'test-groq-key';
  delete process.env.GROQ_MODEL;
  let groqCalls = 0;
  const requestedModels = [];
  global.fetch = async (url, options) => {
    if (String(url).startsWith('https://api.groq.com/')) {
      groqCalls += 1;
      requestedModels.push(JSON.parse(options.body).model);
      const message = groqCalls === 1
        ? {
          tool_calls: [{
            id: 'search-call',
            function: { name: 'search_products', arguments: JSON.stringify({ query: 'laptop', limit: 2 }) }
          }]
        }
        : { content: 'I found an approved laptop listing.' };
      return { ok: true, json: async () => ({ choices: [{ message }] }) };
    }
    return {
      ok: true,
      json: async () => [{
        id: 'listing-123',
        name: 'Approved laptop',
        category: 'Electronics',
        price: 250000,
        currency: 'RWF',
        image: 'https://example.test/laptop.jpg',
        description: 'Laptop in working condition',
        condition: 'Used',
        district: 'Huye',
        specifications: { memory: '8 GB' },
        status: 'approved',
        seller_email: 'private@example.test'
      }]
    };
  };

  try {
    const response = mockResponse();
    await shoppingAssistant({
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.28' },
      socket: {},
      body: { language: 'en', messages: [{ role: 'user', content: 'Find a laptop' }] }
    }, response);
    const result = JSON.parse(response.body);
    assert.equal(response.statusCode, 200);
    assert.equal(groqCalls, 2);
    assert.deepEqual(requestedModels, ['openai/gpt-oss-120b', 'openai/gpt-oss-120b']);
    assert.equal(result.products[0].id, 'listing-123');
    assert.equal(result.reply, 'I found an approved laptop listing.');
    assert.equal(Object.hasOwn(result.products[0], 'seller_email'), false);
  } finally {
    global.fetch = oldFetch;
    restoreEnvironment(environment);
  }
});

test('shopping assistant chats naturally without searching listings and knows the developer name', async () => {
  const environment = preserveEnvironment(['GROQ_API_KEY', 'GROQ_MODEL']);
  const oldFetch = global.fetch;
  process.env.GROQ_API_KEY = 'test-groq-key';
  delete process.env.GROQ_MODEL;
  let requestedMessages;
  global.fetch = async (url, options) => {
    assert.match(String(url), /^https:\/\/api\.groq\.com\//);
    requestedMessages = JSON.parse(options.body).messages;
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'I am doing well, thank you! How can I help you today?' } }] })
    };
  };

  try {
    const response = mockResponse();
    await shoppingAssistant({
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.27' },
      socket: {},
      body: { language: 'en', messages: [{ role: 'user', content: 'How are you today?' }] }
    }, response);
    const result = JSON.parse(response.body);
    const prompt = requestedMessages.find(message => message.role === 'system').content;
    assert.equal(response.statusCode, 200);
    assert.equal(result.reply, 'I am doing well, thank you! How can I help you today?');
    assert.deepEqual(result.products, []);
    assert.match(prompt, /NIYONKURU Yves/);
    assert.match(prompt, /Never default to laptops or any other category/);
    assert.match(prompt, /Answer greetings, small talk/);
  } finally {
    global.fetch = oldFetch;
    restoreEnvironment(environment);
  }
});

test('seller endpoint verifies active approval before requesting a Groq draft', async () => {
  const environment = preserveEnvironment(['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GROQ_API_KEY']);
  const oldFetch = global.fetch;
  process.env.SUPABASE_URL = 'https://isokohub-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.GROQ_API_KEY = 'test-groq-key';
  let groqCalls = 0;
  global.fetch = async (url) => {
    if (String(url).includes('/auth/v1/user')) {
      return { ok: true, json: async () => ({ id: 'seller-123' }) };
    }
    if (String(url).includes('/rest/v1/user_profiles')) {
      return { ok: true, json: async () => [{ is_active: true, is_verified: true }] };
    }
    groqCalls += 1;
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'Accurate product draft.' } }] }) };
  };

  try {
    const response = mockResponse();
    await productIntelligence({
      method: 'POST',
      headers: { authorization: 'Bearer session-token-for-testing', 'x-forwarded-for': '198.51.100.29' },
      socket: {},
      body: {
        action: 'description',
        language: 'en',
        product: { name: 'Laptop', category: 'Electronics', specifications: { memory: '8 GB' } }
      }
    }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(JSON.parse(response.body).text, 'Accurate product draft.');
    assert.equal(groqCalls, 1);
  } finally {
    global.fetch = oldFetch;
    restoreEnvironment(environment);
  }
});

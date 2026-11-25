const test = require('node:test');
const assert = require('node:assert/strict');
const { groqChatCompletion } = require('../api/_shared/groq');
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

test('retries with the supported default when GROQ_MODEL has been retired', async () => {
  const environment = preserveEnvironment(['GROQ_API_KEY', 'GROQ_MODEL']);
  const oldFetch = global.fetch;
  process.env.GROQ_API_KEY = 'test-groq-key';
  process.env.GROQ_MODEL = 'llama-3.3-70b-versatile';
  const requestedModels = [];
  global.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    requestedModels.push(body.model);
    if (body.model !== 'openai/gpt-oss-120b') {
      return {
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            code: 'model_decommissioned',
            message: 'This model has been decommissioned.'
          }
        })
      };
    }
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'AI is available again.' } }] })
    };
  };

  try {
    const completion = await groqChatCompletion({
      messages: [{ role: 'user', content: 'Test request' }]
    });
    assert.deepEqual(requestedModels, ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b']);
    assert.equal(completion.content, 'AI is available again.');
  } finally {
    global.fetch = oldFetch;
    restoreEnvironment(environment);
  }
});

test('reports invalid Groq credentials without exposing provider response details', async () => {
  const environment = preserveEnvironment(['GROQ_API_KEY', 'GROQ_MODEL']);
  const oldFetch = global.fetch;
  process.env.GROQ_API_KEY = 'test-groq-key';
  delete process.env.GROQ_MODEL;
  global.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: { code: 'invalid_api_key', message: 'private provider detail' } })
  });

  try {
    await assert.rejects(
      groqChatCompletion({ messages: [{ role: 'user', content: 'Test request' }] }),
      error => error.statusCode === 503 && /GROQ_API_KEY/.test(error.message) && !error.message.includes('private provider detail')
    );
  } finally {
    global.fetch = oldFetch;
    restoreEnvironment(environment);
  }
});

test('seller endpoint returns an actionable Groq credential error', async () => {
  const environment = preserveEnvironment(['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GROQ_API_KEY', 'GROQ_MODEL']);
  const oldFetch = global.fetch;
  process.env.SUPABASE_URL = 'https://isokohub-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.GROQ_API_KEY = 'test-groq-key';
  delete process.env.GROQ_MODEL;
  global.fetch = async (url) => {
    if (String(url).includes('/auth/v1/user')) {
      return { ok: true, json: async () => ({ id: 'seller-123' }) };
    }
    if (String(url).includes('/rest/v1/user_profiles')) {
      return { ok: true, json: async () => [{ is_active: true, is_verified: true }] };
    }
    return {
      ok: false,
      status: 401,
      json: async () => ({ error: { code: 'invalid_api_key', message: 'private provider detail' } })
    };
  };

  try {
    const response = mockResponse();
    await productIntelligence({
      method: 'POST',
      headers: { authorization: 'Bearer session-token-for-testing', 'x-forwarded-for': '198.51.100.42' },
      socket: {},
      body: {
        action: 'description',
        language: 'en',
        product: { name: 'Test listing', category: 'Others', description: 'A clear product description.' }
      }
    }, response);
    assert.equal(response.statusCode, 503);
    assert.equal(
      JSON.parse(response.body).error,
      'The AI service rejected its credentials. Check the GROQ_API_KEY setting.'
    );
  } finally {
    global.fetch = oldFetch;
    restoreEnvironment(environment);
  }
});

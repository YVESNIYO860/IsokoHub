const test = require('node:test');
const assert = require('node:assert/strict');
const imageEdit = require('../api/image-edit');

function mockResponse() {
  return {
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    end(value) {
      this.body = value;
    }
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

test('enhanced image prompts are plain text without Markdown decoration', () => {
  assert.equal(
    imageEdit._test.normalizeEnhancedPrompt('```text\n**Place the product in soft studio lighting.**\n```'),
    'Place the product in soft studio lighting.'
  );
});

test('image editing sends Groq-enhanced instructions to Cloudflare', async () => {
  const environment = preserveEnvironment([
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_TOKEN',
    'GROQ_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ]);
  const oldFetch = global.fetch;
  process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account';
  process.env.CLOUDFLARE_API_TOKEN = 'test-cloudflare-token';
  process.env.GROQ_API_KEY = 'test-groq-key';
  process.env.SUPABASE_URL = 'https://isokohub-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';

  const sourceBytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  const outputBytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]);
  let cloudflarePrompt = '';
  global.fetch = async (url, options) => {
    if (String(url).includes('/auth/v1/user')) return { ok: true };
    if (String(url).includes('/rpc/consume_image_edit_quota')) {
      return { ok: true, json: async () => true };
    }
    if (String(url).startsWith('https://api.groq.com/')) {
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '**Place the product on a clean white background with soft studio lighting.**' } }]
        })
      };
    }
    if (String(url).startsWith('https://api.cloudflare.com/')) {
      cloudflarePrompt = options.body.get('prompt');
      return {
        ok: true,
        headers: { get: () => 'image/png' },
        arrayBuffer: async () => outputBytes
      };
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const response = mockResponse();
    await imageEdit({
      method: 'POST',
      headers: { authorization: 'Bearer test-session-token' },
      body: {
        image: `data:image/png;base64,${sourceBytes.toString('base64')}`,
        prompt: 'make the photo look clean',
        width: 512,
        height: 512
      }
    }, response);

    const result = JSON.parse(response.body);
    assert.equal(response.statusCode, 200);
    assert.equal(cloudflarePrompt, 'Place the product on a clean white background with soft studio lighting.');
    assert.equal(result.enhancedPrompt, cloudflarePrompt);
    assert.equal(result.image, outputBytes.toString('base64'));
  } finally {
    global.fetch = oldFetch;
    restoreEnvironment(environment);
  }
});

const assert = require('assert');
const usernameLogin = require('../api/username-login');

async function callEndpoint(password) {
  const responses = [
    { ok: true, async json() { return [{ email: 'seller@example.com' }]; } },
    { ok: password === 'correct-password', async json() { return {}; } }
  ];
  global.fetch = async () => responses.shift();

  const response = {
    headers: {},
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    end(body) { this.body = JSON.parse(body); }
  };
  await usernameLogin({ method: 'POST', body: { username: 'shop_owner', password } }, response);
  return response;
}

async function run() {
  const originalFetch = global.fetch;
  const originalEnvironment = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

  try {
    const invalidPassword = await callEndpoint('wrong-password');
    assert.strictEqual(invalidPassword.statusCode, 401);
    assert.strictEqual(Object.hasOwn(invalidPassword.body, 'email'), false);

    const validPassword = await callEndpoint('correct-password');
    assert.strictEqual(validPassword.statusCode, 200);
    assert.strictEqual(validPassword.body.email, 'seller@example.com');
    console.log('username login credential test passed');
  } finally {
    global.fetch = originalFetch;
    Object.entries(originalEnvironment).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
const assert = require('assert');
const adminUsers = require('../api/admin-users');

function createResponse() {
  return {
    headers: {},
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    end(body) { this.body = JSON.parse(body); }
  };
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
    const deniedResponse = createResponse();
    await adminUsers({ method: 'GET', headers: {} }, deniedResponse);
    assert.strictEqual(deniedResponse.statusCode, 401);

    const calls = [];
    global.fetch = async (url, options = {}) => {
      calls.push({ url, options });
      if (url.endsWith('/auth/v1/user')) {
        return { ok: true, async json() { return { id: '11111111-1111-4111-8111-111111111111' }; } };
      }
      if (url.endsWith('/rest/v1/rpc/is_isokohub_admin')) {
        return { ok: true, async json() { return true; } };
      }
      if (url.includes('/rest/v1/user_profiles?')) {
        return { ok: true, async json() { return [{ id: '22222222-2222-4222-8222-222222222222', role: 'seller' }]; } };
      }
      return { ok: true, async json() { return {}; } };
    };

    const disableResponse = createResponse();
    await adminUsers({
      method: 'POST',
      headers: { authorization: 'Bearer verified-admin-token' },
      body: { userId: '22222222-2222-4222-8222-222222222222', action: 'disable' }
    }, disableResponse);
    assert.strictEqual(disableResponse.statusCode, 200);
    assert.ok(calls.some(({ url, options }) => url.includes('/auth/v1/admin/users/22222222-2222-4222-8222-222222222222')
      && JSON.parse(options.body).ban_duration === '876000h'));
    console.log('admin user controls test passed');
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
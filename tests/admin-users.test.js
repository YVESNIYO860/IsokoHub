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

function mockFetchResponse(body = {}, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
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

    const deleteCalls = [];
    global.fetch = async (url, options = {}) => {
      deleteCalls.push({ url, options });
      if (url.endsWith('/auth/v1/user')) {
        return mockFetchResponse({ id: '11111111-1111-4111-8111-111111111111' });
      }
      if (url.endsWith('/rest/v1/rpc/is_isokohub_admin')) {
        return mockFetchResponse(true);
      }
      if (url.includes('/rest/v1/user_profiles?')) {
        return mockFetchResponse([{ id: '22222222-2222-4222-8222-222222222222', role: 'seller' }]);
      }
      if (url.includes('/rest/v1/products?') && options.method !== 'DELETE') {
        return mockFetchResponse([{ image: ['https://example.supabase.co/storage/v1/object/public/product-images/seller/item.png'], video_url: 'https://example.supabase.co/storage/v1/object/public/house-videos/seller/tour.mp4' }]);
      }
      if (url.includes('/storage/v1/object/')) return mockFetchResponse([]);
      if (url.includes('/auth/v1/admin/users/') && options.method === 'DELETE') {
        return mockFetchResponse({ user: { id: '22222222-2222-4222-8222-222222222222' } });
      }
      return mockFetchResponse({}, options.method === 'DELETE' ? 204 : 200);
    };

    const deleteResponse = createResponse();
    await adminUsers({
      method: 'POST',
      headers: { authorization: 'Bearer verified-admin-token' },
      body: { userId: '22222222-2222-4222-8222-222222222222', action: 'delete' }
    }, deleteResponse);
    assert.strictEqual(deleteResponse.statusCode, 200, JSON.stringify(deleteResponse.body));
    assert.ok(deleteCalls.some(({ url, options }) => url.includes('/storage/v1/object/product-images')
      && JSON.parse(options.body).prefixes.includes('seller/item.png')));
    assert.ok(deleteCalls.some(({ url, options }) => url.includes('/storage/v1/object/house-videos')
      && JSON.parse(options.body).prefixes.includes('seller/tour.mp4')));
    assert.ok(deleteCalls.some(({ url, options }) => url.includes('/rest/v1/products?') && options.method === 'DELETE'));
    assert.ok(deleteCalls.some(({ url, options }) => url.includes('/auth/v1/admin/users/22222222-2222-4222-8222-222222222222')
      && options.method === 'DELETE'));

    const productDeleteCalls = [];
    global.fetch = async (url, options = {}) => {
      productDeleteCalls.push({ url, options });
      if (url.endsWith('/auth/v1/user')) return mockFetchResponse({ id: '11111111-1111-4111-8111-111111111111' });
      if (url.endsWith('/rest/v1/rpc/is_isokohub_admin')) return mockFetchResponse(true);
      if (url.includes('/rest/v1/products?') && options.method !== 'DELETE') {
        return mockFetchResponse({
          image: ['https://example.supabase.co/storage/v1/object/public/product-images/seller/listing.png'],
          video_url: null
        });
      }
      if (url.includes('/storage/v1/object/')) return mockFetchResponse([]);
      return mockFetchResponse({}, options.method === 'DELETE' ? 204 : 200);
    };

    const productDeleteResponse = createResponse();
    await adminUsers({
      method: 'POST',
      headers: { authorization: 'Bearer verified-admin-token' },
      body: { productId: '33333333-3333-4333-8333-333333333333', action: 'delete_listing' }
    }, productDeleteResponse);
    assert.strictEqual(productDeleteResponse.statusCode, 200, JSON.stringify(productDeleteResponse.body));
    assert.ok(productDeleteCalls.some(({ url, options }) => url.includes('/storage/v1/object/product-images')
      && JSON.parse(options.body).prefixes.includes('seller/listing.png')));
    assert.ok(productDeleteCalls.some(({ url, options }) => url.includes('/rest/v1/products?') && options.method === 'DELETE'));
    console.log('admin user controls and deletion test passed');
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
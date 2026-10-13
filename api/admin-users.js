function sendJson(response, status, payload) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
}

function getBearerToken(request) {
  const match = String(request.headers.authorization || '').match(/^Bearer\s+([\w.-]+)$/i);
  return match ? match[1] : '';
}

module.exports = async function adminUsers(request, response) {
  if (!['GET', 'POST'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST');
    return sendJson(response, 405, { error: 'Only GET and POST requests are supported.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return sendJson(response, 503, { error: 'Admin account controls are not configured.' });
  }

  const token = getBearerToken(request);
  if (!token) return sendJson(response, 401, { error: 'Sign in as an administrator.' });

  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` }
    });
    if (!authResponse.ok) return sendJson(response, 401, { error: 'Your session has expired. Sign in again.' });
    const adminUser = await authResponse.json();

    const adminCheck = await fetch(`${supabaseUrl}/rest/v1/rpc/is_isokohub_admin`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });
    if (!adminCheck.ok || await adminCheck.json() !== true) {
      return sendJson(response, 403, { error: 'Administrator access is required.' });
    }

    if (request.method === 'GET') {
      const query = new URLSearchParams({
        select: 'id,email,full_name,username,role,is_verified,is_active,created_at',
        order: 'created_at.desc'
      });
      const profilesResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?${query}`, {
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
      });
      if (!profilesResponse.ok) return sendJson(response, 503, { error: 'Could not load account profiles. Apply migration 017 first.' });
      return sendJson(response, 200, { users: await profilesResponse.json() });
    }

    const userId = typeof request.body?.userId === 'string' ? request.body.userId : '';
    const action = request.body?.action;
    if (!/^[0-9a-f-]{36}$/i.test(userId) || userId === adminUser.id) {
      return sendJson(response, 400, { error: 'Choose a valid account other than your own.' });
    }
    if (!['verify', 'disable', 'enable'].includes(action)) {
      return sendJson(response, 400, { error: 'Unsupported account action.' });
    }

    const authAdminUrl = `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`;
    const profileUrl = `${supabaseUrl}/rest/v1/user_profiles?id=eq.${encodeURIComponent(userId)}`;
    const serviceHeaders = {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    };
    const targetResponse = await fetch(`${profileUrl}&select=id,role`, {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
    });
    if (!targetResponse.ok) return sendJson(response, 503, { error: 'Could not verify the selected account.' });
    const targetProfiles = await targetResponse.json();
    if (!targetProfiles.length) return sendJson(response, 404, { error: 'Account not found.' });
    if (targetProfiles[0].role === 'admin') return sendJson(response, 403, { error: 'Admin accounts cannot be changed here.' });

    if (action === 'verify') {
      const profileResponse = await fetch(profileUrl, {
        method: 'PATCH',
        headers: serviceHeaders,
        body: JSON.stringify({ is_verified: true, verified_at: new Date().toISOString(), verified_by: adminUser.id })
      });
      if (!profileResponse.ok) return sendJson(response, 503, { error: 'Could not approve this account.' });
    } else if (action === 'disable') {
      const banResponse = await fetch(authAdminUrl, {
        method: 'PUT',
        headers: serviceHeaders,
        body: JSON.stringify({ ban_duration: '876000h' })
      });
      if (!banResponse.ok) return sendJson(response, 503, { error: 'Supabase could not disable this account.' });
      const profileResponse = await fetch(profileUrl, {
        method: 'PATCH',
        headers: serviceHeaders,
        body: JSON.stringify({ is_active: false })
      });
      if (!profileResponse.ok) {
        await fetch(authAdminUrl, { method: 'PUT', headers: serviceHeaders, body: JSON.stringify({ ban_duration: 'none' }) });
        return sendJson(response, 503, { error: 'Could not save the disabled account status.' });
      }
    } else {
      const enableResponse = await fetch(authAdminUrl, {
        method: 'PUT',
        headers: serviceHeaders,
        body: JSON.stringify({ ban_duration: 'none' })
      });
      if (!enableResponse.ok) return sendJson(response, 503, { error: 'Supabase could not re-enable this account.' });
      const profileResponse = await fetch(profileUrl, {
        method: 'PATCH',
        headers: serviceHeaders,
        body: JSON.stringify({ is_active: true })
      });
      if (!profileResponse.ok) {
        await fetch(authAdminUrl, { method: 'PUT', headers: serviceHeaders, body: JSON.stringify({ ban_duration: '876000h' }) });
        return sendJson(response, 503, { error: 'Could not save the enabled account status.' });
      }
    }

    return sendJson(response, 200, { success: true });
  } catch (error) {
    console.error('Admin account action failed:', error?.message || error);
    return sendJson(response, 502, { error: 'Account management is temporarily unavailable.' });
  }
};
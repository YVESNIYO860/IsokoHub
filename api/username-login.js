function sendJson(response, status, payload) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
}

module.exports = async function usernameLogin(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Only POST requests are supported.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return sendJson(response, 503, { error: 'Username login is not configured. Sign in with your email instead.' });
  }

  const username = typeof request.body?.username === 'string' ? request.body.username.trim().toLowerCase() : '';
  const password = typeof request.body?.password === 'string' ? request.body.password : '';
  if (!/^[a-z0-9_]{3,24}$/.test(username) || !password || password.length > 256) {
    return sendJson(response, 401, { error: 'Invalid username or password.' });
  }

  try {
    const profileQuery = new URLSearchParams({ select: 'email', username: `eq.${username}`, limit: '1' });
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?${profileQuery}`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      }
    });
    if (!profileResponse.ok) return sendJson(response, 503, { error: 'Username login is temporarily unavailable.' });
    const profiles = await profileResponse.json();
    const email = profiles?.[0]?.email;
    if (!email) return sendJson(response, 401, { error: 'Invalid username or password.' });

    const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!authResponse.ok) return sendJson(response, 401, { error: 'Invalid username or password.' });
    return sendJson(response, 200, { email });
  } catch (error) {
    console.error('Username login failed:', error?.message || error);
    return sendJson(response, 502, { error: 'Username login is temporarily unavailable.' });
  }
};
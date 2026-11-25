const { ApiError } = require('./http');

function getBearerToken(request) {
  const authorization = request.headers.authorization || '';
  const match = String(authorization).match(/^Bearer\s+([\w.-]{16,4096})$/i);
  return match ? match[1] : '';
}

async function verifySupabaseUser(request) {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new ApiError('Seller AI is not configured on this server.', 503);

  const token = getBearerToken(request);
  if (!token) throw new ApiError('Sign in to use seller AI tools.', 401);

  let response;
  try {
    response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`
      },
      signal: AbortSignal.timeout(8000)
    });
  } catch {
    throw new ApiError('Could not verify your account. Try again shortly.', 502);
  }
  if (!response.ok) throw new ApiError('Your session expired. Sign in again.', 401);
  const user = await response.json();
  if (!user?.id) throw new ApiError('Your session expired. Sign in again.', 401);

  const profileParams = new URLSearchParams({
    select: 'is_active,is_verified',
    id: `eq.${user.id}`,
    limit: '1'
  });
  let profileResponse;
  try {
    profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?${profileParams}`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`
      },
      signal: AbortSignal.timeout(8000)
    });
  } catch {
    throw new ApiError('Could not verify seller access. Try again shortly.', 502);
  }
  if (!profileResponse.ok) throw new ApiError('Could not verify seller access.', 503);
  const profiles = await profileResponse.json();
  if (profiles?.[0]?.is_active !== true || profiles?.[0]?.is_verified !== true) {
    throw new ApiError('Seller AI tools are available to active, approved sellers.', 403);
  }

  return { user, token, supabaseUrl, anonKey };
}

module.exports = { getBearerToken, verifySupabaseUser };

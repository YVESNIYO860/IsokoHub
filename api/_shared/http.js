class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request, maximumBytes = 24000) {
  if (request.body !== undefined) {
    const raw = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
    if (Buffer.byteLength(raw || '') > maximumBytes) {
      throw new ApiError('The request is too large.', 413);
    }
    try {
      const body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : request.body;
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new ApiError('The request body must be a JSON object.', 400);
      }
      return body;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('The request contains invalid JSON.', 400);
    }
  }

  return new Promise((resolve, reject) => {
    let byteCount = 0;
    const chunks = [];
    let tooLarge = false;
    request.on('data', (chunk) => {
      byteCount += chunk.length;
      if (byteCount > maximumBytes) {
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });
    request.on('error', () => reject(new ApiError('Unable to read the request body.', 400)));
    request.on('end', () => {
      if (tooLarge) return reject(new ApiError('The request is too large.', 413));
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          return reject(new ApiError('The request body must be a JSON object.', 400));
        }
        resolve(body);
      } catch {
        reject(new ApiError('The request contains invalid JSON.', 400));
      }
    });
  });
}

const requestCounts = new Map();

function getClientAddress(request) {
  const forwarded = request.headers['x-forwarded-for'];
  const address = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '').split(',')[0];
  return (address || request.socket?.remoteAddress || 'unknown').trim().slice(0, 80);
}

function takeRateLimit(request, bucket, maximum, windowMs) {
  const key = `${bucket}:${getClientAddress(request)}`;
  const now = Date.now();
  const current = requestCounts.get(key);
  if (!current || current.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= maximum) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  if (requestCounts.size > 10000) {
    for (const [storedKey, entry] of requestCounts) {
      if (entry.resetAt <= now) requestCounts.delete(storedKey);
    }
  }
  return { allowed: true, retryAfter: 0 };
}

function handleApiError(response, error, fallbackMessage) {
  const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
  if (statusCode >= 500) console.error('[api] request failed:', error?.message || error);
  sendJson(response, statusCode, {
    error: statusCode >= 500 ? fallbackMessage : (error?.message || fallbackMessage)
  });
}

module.exports = {
  ApiError,
  handleApiError,
  readJsonBody,
  sendJson,
  takeRateLimit
};

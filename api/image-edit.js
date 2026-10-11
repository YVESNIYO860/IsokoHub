const MODEL_NAME = '@cf/black-forest-labs/flux-2-klein-4b';
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_PROMPT_LENGTH = 500;
const MAX_OUTPUT_DIMENSION = 1024;

function sendJson(response, status, payload) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
}

function getBearerToken(request) {
  const authorization = request.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+([\w.-]+)$/i);
  return match ? match[1] : '';
}

function normalizeBase64Image(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/i);
  const base64 = match ? match[2] : value;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length > Math.ceil(MAX_IMAGE_BYTES * 4 / 3)) {
    return null;
  }

  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return null;

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const isPng = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP' && buffer.toString('ascii', 0, 4) === 'RIFF';
  if (!isJpeg && !isPng && !isWebp) return null;

  const type = match?.[1].toLowerCase() || (isJpeg ? 'image/jpeg' : isPng ? 'image/png' : 'image/webp');
  return { base64, buffer, type };
}

function getImageResult(payload) {
  const result = payload?.result;
  if (typeof result === 'string') return result;
  if (typeof result?.image === 'string') return result.image;
  if (typeof result?.output === 'string') return result.output;
  if (typeof payload?.image === 'string') return payload.image;
  return '';
}

module.exports = async function imageEdit(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Only POST requests are supported.' });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!accountId || !apiToken || !supabaseUrl || !supabaseAnonKey) {
    return sendJson(response, 503, { error: 'Image editing is not configured on the server yet.' });
  }

  const token = getBearerToken(request);
  if (!token) return sendJson(response, 401, { error: 'Sign in to use AI image editing.' });

  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`
      }
    });
    if (!authResponse.ok) return sendJson(response, 401, { error: 'Your session has expired. Sign in again.' });
  } catch (error) {
    return sendJson(response, 502, { error: 'Could not verify your sign-in. Please try again.' });
  }

  const image = normalizeBase64Image(request.body?.image);
  const prompt = typeof request.body?.prompt === 'string' ? request.body.prompt.trim() : '';
  const width = Number(request.body?.width);
  const height = Number(request.body?.height);
  if (!image) return sendJson(response, 400, { error: 'Choose a valid JPEG, PNG, or WebP image under 3 MB.' });
  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) {
    return sendJson(response, 400, { error: 'Enter an edit prompt between 1 and 500 characters.' });
  }
  if (!Number.isInteger(width) || !Number.isInteger(height)
    || width < 256 || height < 256
    || width > MAX_OUTPUT_DIMENSION || height > MAX_OUTPUT_DIMENSION) {
    return sendJson(response, 400, { error: 'The requested output dimensions are invalid.' });
  }

  try {
    const quotaResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_image_edit_quota`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });
    if (!quotaResponse.ok) {
      return sendJson(response, 503, { error: 'Image-edit limits are not enabled yet. Ask the site owner to apply the required Supabase migration.' });
    }
    if (await quotaResponse.json() !== true) {
      return sendJson(response, 429, { error: 'You have reached today’s AI edit limit. Try again tomorrow.' });
    }

    const formData = new FormData();
    formData.set('prompt', prompt);
    formData.set('input_image_0', new Blob([image.buffer], { type: image.type }), `isokohub-input.${image.type.split('/')[1]}`);
    formData.set('width', String(width));
    formData.set('height', String(height));

    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${MODEL_NAME}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`
        },
        body: formData
      }
    );
    if (!cloudflareResponse.ok) {
      return sendJson(response, 502, { error: 'The image editing provider could not process this image.' });
    }

    const contentType = cloudflareResponse.headers.get('content-type') || '';
    let outputBase64 = '';
    let outputType = 'image/png';
    if (contentType.startsWith('image/')) {
      outputType = contentType.split(';')[0];
      outputBase64 = Buffer.from(await cloudflareResponse.arrayBuffer()).toString('base64');
    } else {
      const payload = await cloudflareResponse.json();
      outputBase64 = getImageResult(payload);
      if (payload?.success === false || !outputBase64) {
        return sendJson(response, 502, { error: 'The image editing provider returned no image.' });
      }
    }

    const dataUrlMatch = outputBase64.match(/^data:(image\/[\w.+-]+);base64,(.+)$/i);
    if (dataUrlMatch) {
      outputType = dataUrlMatch[1];
      outputBase64 = dataUrlMatch[2];
    }

    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(outputBase64)) {
      return sendJson(response, 502, { error: 'The image editing provider returned an unreadable image.' });
    }

    return sendJson(response, 200, { image: outputBase64, type: outputType });
  } catch (error) {
    return sendJson(response, 502, { error: 'Image editing failed. Please try again.' });
  }
};
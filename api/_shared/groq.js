const { ApiError } = require('./http');

const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';

function isUnavailableModelError(status, providerError) {
  if (status !== 400 && status !== 404) return false;
  const details = `${providerError?.code || ''} ${providerError?.message || ''}`;
  return /model/i.test(details) && /(decommission|retir|not found|not supported|unsupported|does not exist|unavailable)/i.test(details);
}

function providerApiError(status, providerError) {
  const code = typeof providerError?.code === 'string' ? providerError.code : '';
  console.error('[groq] request rejected', { status, code });
  if (status === 429) return new ApiError('The AI service is busy. Please wait a moment and try again.', 429);
  if (isUnavailableModelError(status, providerError)) {
    return new ApiError('The configured AI model is unavailable. Set GROQ_MODEL to openai/gpt-oss-120b or remove it.', 503, true);
  }
  if (status === 401 || status === 403) {
    return new ApiError('The AI service rejected its credentials. Check the GROQ_API_KEY setting.', 503, true);
  }
  return new ApiError('The AI service is temporarily unavailable.', 502);
}

async function groqChatCompletion(requestBody) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new ApiError('AI assistant is not configured on this server. Set GROQ_API_KEY.', 503, true);

  const configuredModel = (
    typeof requestBody.model === 'string' && requestBody.model.trim()
      ? requestBody.model.trim()
      : process.env.GROQ_MODEL?.trim()
  ) || DEFAULT_GROQ_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const sendRequest = (model) => fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...requestBody, model }),
      signal: controller.signal
    });

    let response = await sendRequest(configuredModel);
    if (!response.ok) {
      const providerPayload = await response.json().catch(() => ({}));
      const providerError = providerPayload?.error;
      if (configuredModel !== DEFAULT_GROQ_MODEL && isUnavailableModelError(response.status, providerError)) {
        console.warn('[groq] configured model unavailable; retrying with the supported default model');
        response = await sendRequest(DEFAULT_GROQ_MODEL);
      } else {
        throw providerApiError(response.status, providerError);
      }
    }

    if (!response.ok) {
      const providerPayload = await response.json().catch(() => ({}));
      throw providerApiError(response.status, providerPayload?.error);
    }

    const result = await response.json();
    if (!result?.choices?.[0]?.message) {
      throw new ApiError('The AI service returned an invalid response.', 502);
    }
    return result.choices[0].message;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error?.name === 'AbortError') throw new ApiError('The AI request timed out. Please try again.', 504);
    throw new ApiError('Could not reach the AI service. Please try again.', 502);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { groqChatCompletion };

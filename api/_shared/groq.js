const { ApiError } = require('./http');

const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function groqChatCompletion(requestBody) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new ApiError('AI assistant is not configured on this server.', 503);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        ...requestBody
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new ApiError(
        response.status === 429
          ? 'The AI service is busy. Please wait a moment and try again.'
          : 'The AI service is temporarily unavailable.',
        response.status === 429 ? 429 : 502
      );
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

// Claude API helper for product summary generation
const CLAUDE_PROXY_URL = 'http://127.0.0.1:3001/claude';
const CLAUDE_PROXY_HEALTH_URL = 'http://127.0.0.1:3001/health';
const CLAUDE_MODEL = 'claude-3.5-mini';

async function checkClaudeProxyHealth() {
  const response = await fetch(CLAUDE_PROXY_HEALTH_URL, { method: 'GET' });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Claude proxy health check failed (${response.status}): ${text}`);
  }

  const result = await response.json();
  if (!result?.ok) {
    throw new Error('Claude proxy health check returned invalid response.');
  }

  return true;
}

async function sendClaudeRequest(body) {
  try {
    await checkClaudeProxyHealth();
  } catch (err) {
    throw new Error(`Claude proxy unreachable at ${CLAUDE_PROXY_HEALTH_URL}. Start the local proxy with npm run claude-proxy and ensure it is running. ${err.message}`);
  }

  const response = await fetch(CLAUDE_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude request failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return result?.completion?.trim() || result?.completion || '';
}

async function summarizeTextWithClaude(text) {
  const prompt = `Summarize the following product details into one short review sentence suitable for admin verification. Keep the summary clear, concise, and focused on condition, main features, and availability. Do not mention the word "Claude".`;
  const finalText = `${prompt}\n\n${text.trim()}`;

  return sendClaudeRequest({
    model: CLAUDE_MODEL,
    prompt: finalText,
    max_tokens_to_sample: 140,
    temperature: 0.25,
    top_p: 1.0,
    stop_sequences: ['\n\n']
  });
}

async function askQuestionWithClaude(prompt) {
  if (!prompt || !prompt.trim()) {
    return 'Please enter a valid question for the product assistant.';
  }

  return sendClaudeRequest({
    model: CLAUDE_MODEL,
    prompt,
    max_tokens_to_sample: 180,
    temperature: 0.35,
    top_p: 1.0,
    stop_sequences: ['\n\n']
  });
}

function buildProductSummaryInput(product) {
  if (!product) return '';

  const lines = [];
  if (product.name) lines.push(`Name: ${product.name}`);
  if (product.category) lines.push(`Category: ${product.category}`);
  if (product.condition) lines.push(`Condition: ${product.condition}`);
  if (product.district) lines.push(`Location: ${product.district}`);
  if (typeof product.price !== 'undefined') lines.push(`Price: ${formatPrice(product.price)}`);
  if (product.description) lines.push(`Description: ${product.description}`);
  if (product.is_ad || product.ad_requested) {
    lines.push(`Ad requested: ${product.ad_requested ? 'yes' : 'no'}, boosted: ${product.is_ad ? 'yes' : 'no'}`);
  }

  return lines.join('\n');
}

function buildProductQuestionPrompt(product, question) {
  const summaryInput = buildProductSummaryInput(product);
  return `You are an intelligent assistant for a marketplace. Use the following product information to answer the user's question clearly and concisely. Do not mention that you are Claude or reference any internal systems. Product information:\n\n${summaryInput}\n\nUser question: ${question.trim()}\n\nAnswer:`;
}

function generateFallbackSummary(text) {
  if (!text) return 'No product details available.';

  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'No product details available.';

  const sentences = cleaned.split(/\.\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  const firstTwo = sentences.slice(0, 2).join('. ');
  return firstTwo.endsWith('.') ? firstTwo : `${firstTwo}.`;
}

async function fetchProductSummary(product) {
  if (!product || !product.id) return 'No product details available.';

  const cacheKey = `product-summary-${product.id}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    return cached;
  }

  const summaryInput = buildProductSummaryInput(product);
  if (!summaryInput) {
    return 'No product details available.';
  }

  try {
    const summary = await summarizeTextWithClaude(summaryInput);
    localStorage.setItem(cacheKey, summary);
    return summary;
  } catch (err) {
    console.warn('Product summary generation error:', err);
    return generateFallbackSummary(summaryInput);
  }
}

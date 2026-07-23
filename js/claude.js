// Claude API helper for product summary generation
// AI support temporarily disabled: return safe fallbacks and avoid network calls.
function checkClaudeProxyHealth() {
  return true;
}

function sendClaudeRequest() {
  throw new Error('AI support is disabled locally.');
}

async function summarizeTextWithClaude(text) {
  return Promise.resolve(generateFallbackSummary(text));
}

async function askQuestionWithClaude(prompt) {
  if (!prompt || !prompt.trim()) {
    return 'Please enter a valid question.';
  }
  return Promise.resolve('AI support is currently disabled. Please enable it when needed.');
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

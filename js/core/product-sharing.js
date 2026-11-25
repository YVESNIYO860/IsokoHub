const productShareFeedbackTimers = new WeakMap();

async function shareProductListing(productId, productName) {
  const url = new URL(`/product?id=${encodeURIComponent(productId)}`, window.location.origin).toString();
  const title = String(productName || 'IsokoHub listing');

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title,
        text: `Check out ${title} on IsokoHub.`,
        url
      });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
      console.warn('Native product sharing failed; trying to copy the link.', error);
    }
  }

  if (typeof navigator.clipboard?.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(url);
      return 'copied';
    } catch (error) {
      console.warn('Unable to copy the product link to the clipboard.', error);
    }
  }

  if (typeof window.prompt === 'function') {
    window.prompt('Copy this product link to share:', url);
    return 'prompted';
  }

  throw new Error('This browser does not support sharing or copying product links.');
}

function setProductShareButtonLabel(button, label) {
  const text = button.querySelector('.product-share-label');
  if (text) text.textContent = label;
  button.setAttribute('aria-label', `${label} ${button.dataset.productName || 'product'}`);
}

document.addEventListener('click', async (event) => {
  const button = event.target instanceof Element ? event.target.closest('[data-share-product]') : null;
  if (!button || button.disabled) return;

  const productId = button.dataset.shareProduct;
  if (!productId) {
    console.error('Cannot share a product without its listing ID.');
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  button.disabled = true;
  setProductShareButtonLabel(button, 'Sharing');

  let feedback = '';
  try {
    const result = await shareProductListing(productId, button.dataset.productName);
    feedback = {
      shared: 'Shared',
      copied: 'Copied!',
      prompted: 'Copy link ready'
    }[result] || '';
  } catch (error) {
    console.error('Unable to share this product.', error);
    feedback = 'Try again';
  } finally {
    button.disabled = false;
    if (feedback) {
      setProductShareButtonLabel(button, feedback);
      const previousTimer = productShareFeedbackTimers.get(button);
      if (previousTimer) window.clearTimeout(previousTimer);
      productShareFeedbackTimers.set(button, window.setTimeout(() => {
        setProductShareButtonLabel(button, 'Share');
        productShareFeedbackTimers.delete(button);
      }, 1800));
    } else {
      setProductShareButtonLabel(button, 'Share');
    }
  }
});

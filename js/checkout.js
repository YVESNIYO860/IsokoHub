document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const buyId = params.get('buy');
  let cart = [];
  const container = document.getElementById('checkout-cart');
  const summary = document.getElementById('checkout-summary');

  if (!container || !summary) return;

  if (buyId) {
    // Prefill checkout with single product for immediate buy
    const prod = await fetchProductById(buyId).catch(() => null);
    if (prod) {
      cart = [{
        id: prod.id,
        name: prod.name,
        price: Number(prod.price) || 0,
        image: Array.isArray(prod.image) ? prod.image[0] : prod.image,
        quantity: 1,
        seller_phone: prod.seller_phone || prod.sellerPhone || '',
        seller_email: prod.seller_email || prod.sellerEmail || '',
        delivery_cost: prod.delivery_cost || prod.deliveryCost || null,
        free_delivery: prod.free_delivery === true || prod.freeDelivery === true || false,
        seller_lat: prod.seller_lat || prod.sellerLat || null,
        seller_lng: prod.seller_lng || prod.sellerLng || null
      }];
    }
  }

  if (!buyId) {
    cart = getCart();
  }

  if (!cart || cart.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:3rem;">Your cart is empty. <a href="products.html">Continue shopping</a></div>`;
    return;
  }

  const itemsHtml = cart.map(item => `
    <article class="checkout-item" data-item-id="${item.id}">
      <img class="checkout-item-image" src="${item.image}" alt="${item.name}" onerror="this.style.visibility='hidden'"/>
      <div class="checkout-item-details">
        <h2 class="checkout-item-name">${item.name}</h2>
        <div class="checkout-item-meta">Qty ${item.quantity} <span aria-hidden="true">&middot;</span> ${formatPrice(item.price)} each</div>
        <div class="checkout-item-seller">Seller: ${item.seller_phone || item.seller_email || 'Contact unavailable'}</div>
        <div class="checkout-item-delivery">${item.free_delivery ? '<span class="delivery-free">Free delivery</span>' : (item.delivery_cost ? `Delivery: ${formatPrice(item.delivery_cost)}` : 'Delivery: To be confirmed')}</div>
      </div>
      <strong class="checkout-item-total">${formatPrice(item.price * item.quantity)}</strong>
    </article>
  `).join('');

  container.innerHTML = `
    <section class="checkout-items-panel">
      <div class="checkout-panel-heading"><span>Order items</span><span>${cart.length} item${cart.length === 1 ? '' : 's'}</span></div>
      ${itemsHtml}
    </section>
  `;

  const subtotal = cart.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  // initial delivery total (using explicit delivery_cost when present; others TBD until we locate user)
  const deliveryTotalInitial = cart.reduce((sum, it) => sum + (it.free_delivery ? 0 : (it.delivery_cost ? Number(it.delivery_cost) : 0)), 0);
  const total = subtotal + deliveryTotalInitial;

  summary.innerHTML = `
    <section class="checkout-summary-card">
      <div class="checkout-summary-heading"><span>Order summary</span><i class="fa-solid fa-receipt" aria-hidden="true"></i></div>
      <div class="checkout-summary-row"><span>Subtotal</span><strong>${formatPrice(subtotal)}</strong></div>
      <div class="checkout-summary-row"><span>Delivery</span><strong>${formatPrice(deliveryTotalInitial)}</strong></div>
      <div class="checkout-summary-total"><span>Total</span><strong>${formatPrice(total)}</strong></div>
      <div class="checkout-next-step"><i class="fa-solid fa-comments" aria-hidden="true"></i><span>Contact the seller to confirm availability, delivery, and payment details.</span></div>
      <a href="products.html" class="btn btn-secondary checkout-continue-btn"><i class="fa-solid fa-arrow-left"></i> Continue shopping</a>
    </section>
  `;
});

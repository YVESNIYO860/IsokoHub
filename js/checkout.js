document.addEventListener('DOMContentLoaded', () => {
  const cart = getCart();
  const container = document.getElementById('checkout-cart');
  const summary = document.getElementById('checkout-summary');

  if (!container || !summary) return;

  if (!cart || cart.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:3rem;">Your cart is empty. <a href="products.html">Continue shopping</a></div>`;
    return;
  }

  const itemsHtml = cart.map(item => `
    <div style="display:flex; gap:1rem; align-items:center; padding:0.6rem 0; border-bottom:1px solid #eef2ff;">
      <img src="${item.image}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;"/>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700">${item.name}</div>
        <div style="color:#64748b">Qty: ${item.quantity} &middot; Price: ${formatPrice(item.price)}</div>
        <div style="margin-top:6px; color:#0f172a; font-size:0.95rem;">Seller: ${item.seller_phone || item.seller_email || 'N/A'}</div>
        ${item.free_delivery ? `<div style="color:#166534; font-weight:600;">Free delivery</div>` : (item.delivery_cost ? `<div style="color:#64748b">Delivery: ${formatPrice(item.delivery_cost)}</div>` : '')}
      </div>
      <div style="font-weight:800">${formatPrice(item.price * item.quantity)}</div>
    </div>
  `).join('');

  container.innerHTML = `
    <div style="border:1px solid #e6eef8; border-radius:12px; padding:1rem; background:#fff;">
      ${itemsHtml}
    </div>
  `;

  const subtotal = cart.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const deliveryTotal = cart.reduce((sum, it) => sum + (it.free_delivery ? 0 : (Number(it.delivery_cost) || 0)), 0);
  const total = subtotal + deliveryTotal;

  summary.innerHTML = `
    <div style="border:1px solid #e6eef8; border-radius:12px; padding:1rem; background:#fff; display:grid; gap:0.75rem;">
      <div style="display:flex; justify-content:space-between;"><div>Subtotal</div><div>${formatPrice(subtotal)}</div></div>
      <div style="display:flex; justify-content:space-between;"><div>Delivery</div><div>${formatPrice(deliveryTotal)}</div></div>
      <div style="display:flex; justify-content:space-between; font-weight:800; font-size:1.1rem;"><div>Total</div><div>${formatPrice(total)}</div></div>

      <label style="display:flex; flex-direction:column; gap:0.35rem;">
        Your phone number (for MTN Mobile Money):
        <input id="buyer-phone" class="form-control" placeholder="e.g. 250788123456" />
      </label>

      <button id="pay-now" class="btn btn-primary">Pay with MTN Mobile Money</button>
      <div id="checkout-feedback" style="display:none; padding:0.5rem; border-radius:6px;"></div>
    </div>
  `;

  const payBtn = document.getElementById('pay-now');
  const feedback = document.getElementById('checkout-feedback');

  payBtn.addEventListener('click', async () => {
    const phone = document.getElementById('buyer-phone').value.trim();
    if (!phone) {
      feedback.style.display = 'block';
      feedback.style.color = '#b91c1c';
      feedback.textContent = 'Please enter your phone number to proceed.';
      return;
    }

    payBtn.disabled = true;
    payBtn.textContent = 'Processing…';
    feedback.style.display = 'none';

    try {
      // Prepare payload for backend MTN payment creation
      const payload = {
        amount: total,
        currency: 'RWF',
        phone,
        items: cart.map(i => ({ id: i.id, name: i.name, qty: i.quantity, price: i.price, seller_phone: i.seller_phone }))
      };

      // Call your backend endpoint that implements MTN payment API server-side.
      const resp = await fetch('/api/mtn/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Payment initiation failed');
      }

      const data = await resp.json();
      // Expect backend to return { checkout_url } or { transactionId }
      if (data.checkout_url) {
        // Redirect user to payment page/hosted flow
        window.location.href = data.checkout_url;
        return;
      }

      // Or show instructions/confirmation
      feedback.style.display = 'block';
      feedback.style.color = '#0b6c4a';
      feedback.textContent = 'Payment initiated. Follow the instructions on your phone.';

      // Optionally clear cart after successful start
      localStorage.removeItem('isokoHubCart');
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: [] } }));

    } catch (err) {
      console.error('Payment error:', err);
      feedback.style.display = 'block';
      feedback.style.color = '#b91c1c';
      feedback.textContent = 'Payment failed: ' + (err.message || 'Unknown error');
    } finally {
      payBtn.disabled = false;
      payBtn.textContent = 'Pay with MTN Mobile Money';
    }
  });
});

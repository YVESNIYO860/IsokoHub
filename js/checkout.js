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
    <div style="display:flex; gap:1rem; align-items:center; padding:0.6rem 0; border-bottom:1px solid #eef2ff;" data-item-id="${item.id}">
      <img src="${item.image}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;"/>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700">${item.name}</div>
        <div style="color:#64748b">Qty: ${item.quantity} &middot; Price: ${formatPrice(item.price)}</div>
        <div style="margin-top:6px; color:#0f172a; font-size:0.95rem;">Seller: ${item.seller_phone || item.seller_email || 'N/A'}</div>
        <div id="delivery-for-${item.id}" style="margin-top:6px;">${item.free_delivery ? `<span style=\"color:#166534; font-weight:600;\">Free delivery</span>` : (item.delivery_cost ? `<span style=\"color:#64748b\">Delivery: ${formatPrice(item.delivery_cost)}</span>` : `<span style=\"color:#64748b\">Delivery: TBD</span>` )}</div>
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
  // initial delivery total (using explicit delivery_cost when present; others TBD until we locate user)
  const deliveryTotalInitial = cart.reduce((sum, it) => sum + (it.free_delivery ? 0 : (it.delivery_cost ? Number(it.delivery_cost) : 0)), 0);
  let computedDeliveryTotal = deliveryTotalInitial;
  let userLocation = null;

  summary.innerHTML = `
    <div style="border:1px solid #e6eef8; border-radius:12px; padding:1rem; background:#fff; display:grid; gap:0.75rem;">
      <div style="display:flex; justify-content:space-between;"><div>Subtotal</div><div>${formatPrice(subtotal)}</div></div>
      <div style="display:flex; justify-content:space-between;"><div>Delivery</div><div>${formatPrice(deliveryTotal)}</div></div>
      <div style="display:flex; justify-content:space-between; font-weight:800; font-size:1.1rem;"><div>Total</div><div>${formatPrice(total)}</div></div>

      <label style="display:flex; flex-direction:column; gap:0.35rem;">
        Your phone number (for MTN Mobile Money):
        <input id="buyer-phone" class="form-control" placeholder="e.g. 250788123456" />
      </label>

      <div style="display:flex; flex-direction:column; gap:0.5rem;">
        <button id="detect-location-btn" class="btn btn-secondary">Detect my location for delivery price</button>
        <div id="location-status" style="color:#64748b; font-size:0.9rem;"></div>
      </div>

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

  // --- Location & Delivery calculation helpers ---
  function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = x => x * Math.PI / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function computeDeliveryFee(distanceKm) {
    // Simple configurable rule for Rwanda: base 500 RWF for first 5km, then 100 RWF/km thereafter
    const base = 500;
    const perKm = 100;
    if (distanceKm <= 5) return base;
    return Math.round(base + Math.ceil(distanceKm - 5) * perKm);
  }

  async function updateDeliveryCostsWithLocation(lat, lng) {
    userLocation = { lat, lng };
    const status = document.getElementById('location-status');
    status.textContent = 'Location detected — calculating delivery prices...';

    let newDeliveryTotal = 0;
    for (const it of cart) {
      const el = document.getElementById('delivery-for-' + it.id);
      if (it.free_delivery) {
        if (el) el.innerHTML = `<span style="color:#166534; font-weight:600;">Free delivery</span>`;
        continue;
      }

      // if explicit delivery_cost provided, keep it; otherwise compute from seller coords if available
      if (it.delivery_cost) {
        newDeliveryTotal += Number(it.delivery_cost) || 0;
        if (el) el.innerHTML = `<span style="color:#64748b">Delivery: ${formatPrice(it.delivery_cost)}</span>`;
        continue;
      }

      if (it.seller_lat && it.seller_lng) {
        const d = haversineKm(lat, lng, Number(it.seller_lat), Number(it.seller_lng));
        const fee = computeDeliveryFee(d);
        newDeliveryTotal += fee;
        if (el) el.innerHTML = `<span style="color:#64748b">Delivery: ${formatPrice(fee)} (${d.toFixed(1)} km)</span>`;
      } else {
        // unable to compute distance
        if (el) el.innerHTML = `<span style="color:#f59e0b">Delivery: seller hasn't provided location</span>`;
      }
    }

    computedDeliveryTotal = newDeliveryTotal + cart.reduce((sum, it) => sum + (it.delivery_cost ? 0 : 0), 0);
    // update summary UI amounts
    const deliveryNode = summary.querySelector('div:nth-child(2) div:last-child');
    const totalNode = summary.querySelector('div:nth-child(3) div:last-child');
    if (deliveryNode) deliveryNode.textContent = formatPrice(computedDeliveryTotal);
    if (totalNode) totalNode.textContent = formatPrice(subtotal + computedDeliveryTotal);
    status.textContent = 'Delivery prices updated';
  }

  document.getElementById('detect-location-btn').addEventListener('click', () => {
    const status = document.getElementById('location-status');
    if (!navigator.geolocation) {
      status.textContent = 'Geolocation is not supported by your browser.';
      return;
    }
    status.textContent = 'Requesting location permission...';
    navigator.geolocation.getCurrentPosition((pos) => {
      updateDeliveryCostsWithLocation(pos.coords.latitude, pos.coords.longitude).catch((e) => {
        console.error('Failed to compute delivery prices', e);
        status.textContent = 'Failed to compute delivery prices';
      });
    }, (err) => {
      console.error('Geolocation error', err);
      status.textContent = 'Location permission denied or unavailable.';
    }, { enableHighAccuracy: true, timeout: 10000 });
  });
});

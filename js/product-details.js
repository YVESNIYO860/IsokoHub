document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const wrapper = document.getElementById('product-wrapper');

  if (!productId) {
    wrapper.innerHTML = `
      <div style="text-align: center; padding: 5rem;">
        <h2 class="text-danger">Product Not Found</h2>
        <a href="products.html" class="btn btn-primary mt-2">Back to Products</a>
      </div>
    `;
    return;
  }

  wrapper.innerHTML = `
    <div style="text-align: center; padding: 5rem;">
      <i class="fa-solid fa-spinner fa-spin fa-3x"></i>
      <p class="mt-2">Loading product details...</p>
    </div>
  `;

  let product = await fetchProductById(productId);

  if (product) {
    product = (await enrichProductsWithShopData([product]))[0] || product;
  }

  if (!product || (product.status !== 'approved' && getCurrentUser()?.email !== 'yvesniyonkuru2022@gmail.com')) {
    wrapper.innerHTML = `
      <div style="text-align: center; padding: 5rem;">
        <h2 class="text-danger">Product Not Found</h2>
        <p class="text-muted mt-1">This product may have been removed, not yet approved, or does not exist.</p>
        <a href="products.html" class="btn btn-primary mt-2">Back to Products</a>
      </div>
    `;
    return;
  }

  document.title = `${product.name} - IsokoHub`;

  // compute price HTML after product is loaded
  const prevPriceVal = Number(product.previous_price || product.previousPrice || 0);
  const currentPriceVal = Number(product.price || 0);
  const priceHtml = (prevPriceVal && prevPriceVal > currentPriceVal)
    ? `<div class="pd-price-row"><div class="pd-price-label">Price:</div><div class="pd-price"><span class="old-price">${formatPrice(prevPriceVal)}</span> <span class="new-price">${formatPrice(currentPriceVal)}</span></div></div>`
    : `<div class="pd-price-row"><div class="pd-price-label">Price:</div><div class="pd-price">${formatPrice(currentPriceVal)}</div></div>`;

  const getPlaceholderImage = () => {
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'>
        <rect width='600' height='600' fill='%23f8fbff'/>
        <rect x='40' y='40' width='520' height='520' rx='28' fill='%23ffffff' stroke='%23dbeafe' stroke-width='2'/>
        <circle cx='300' cy='250' r='92' fill='%23e0f2fe'/>
        <path d='M220 410c28-72 134-72 162 0' fill='%23bfdbfe'/>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
  };

  const normalizeProductImage = (value) => {
    if (value == null) return '';
    const text = String(value).trim();
    if (!text) return '';
    const lower = text.toLowerCase();
    if (lower.includes('no image') || lower.includes('placeholder') || /[<>"]/.test(text)) {
      return '';
    }
    return text;
  };

  const placeholderImage = getPlaceholderImage();
  const images = (Array.isArray(product.image) ? product.image : [product.image])
    .map(normalizeProductImage)
    .filter(Boolean);
  const mainImage = images[0] || placeholderImage;

  const sellerPhone = product.seller_phone ? String(product.seller_phone).trim() : '';
  const sellerEmail = product.seller_email ? String(product.seller_email).trim() : (product.sellerEmail ? String(product.sellerEmail).trim() : '');
  const productPageUrl = `${window.location.origin}/product.html?id=${encodeURIComponent(product.id)}`;
  const shareText = `Check out this IsokoHub listing: ${product.name}`;

  const getCurrentShareImageUrl = () => images[activeImageIndex] || productPageUrl;
  const buildShareUrls = () => {
    const targetUrl = encodeURIComponent(productPageUrl);
    const imageUrl = getCurrentShareImageUrl();
    const headerTag = 'SHARE';
    const adminNote = 'Shared by IsokoHub Admin for direct contact.';
    const bodyText = `${headerTag}: ${shareText} - ${productPageUrl}\nImage: ${imageUrl}\n\n${adminNote}`;
    return {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(bodyText)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${targetUrl}&quote=${encodeURIComponent(bodyText)}`,
      twitter: `https://twitter.com/intent/tweet?url=${targetUrl}&text=${encodeURIComponent(bodyText)}`
    };
  };

  wrapper.innerHTML = `
    <div class="product-detail-shell">
      <div class="product-gallery-card">
        <div class="gallery-main">
          ${images.length > 1 ? `<button class="gallery-nav gallery-prev" type="button" id="gallery-prev" aria-label="Previous image"><i class="fa-solid fa-chevron-left"></i></button>` : ''}
          <img src="${escapeHtml(mainImage)}" id="main-product-image" alt="${escapeHtml(product.name || 'Product image')}" class="product-main-img">
          ${images.length > 1 ? `<button class="gallery-nav gallery-next" type="button" id="gallery-next" aria-label="Next image"><i class="fa-solid fa-chevron-right"></i></button>` : ''}
          <button class="gallery-zoom-btn" type="button" id="gallery-zoom-btn"><i class="fa-solid fa-maximize"></i> Full screen</button>
        </div>

        ${images.length > 1 ? `
          <div class="gallery-thumbs">
            ${images.map((img, idx) => `
              <button type="button" class="gallery-thumb ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="View image ${idx + 1}">
                <img src="${escapeHtml(img)}" alt="${escapeHtml(`${product.name || 'Product image'} ${idx + 1}`)}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderImage)}'">
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="product-info-card" id="product-description-panel">
        <div class="detail-stack">
          <div class="detail-card detail-header-card">
            <div class="pd-header">
              <div class="pd-category">${product.category}</div>
              <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; margin-top:0.6rem;">
                <h1 class="pd-title" style="margin:0;">${product.name}</h1>
                <span class="pd-badge ${product.condition === 'New' ? 'badge-new' : 'badge-used'}">${product.condition || 'Used'}</span>
              </div>
            </div>
          </div>

          <div class="detail-card">
            <div class="detail-card-title">Price</div>
            <div class="detail-card-value">${priceHtml}</div>
          </div>

          <div class="detail-card">
            <div class="detail-card-title">Location</div>
            <div class="detail-card-value"><i class="fa-solid fa-location-dot"></i> ${product.district || 'District not set'}${product.latitude || product.seller_lat ? ` • ${product.latitude ?? product.seller_lat}, ${product.longitude ?? product.seller_lng}` : ''}</div>
          </div>

          ${product.shop?.id ? `
            <div class="detail-card">
              <div class="detail-card-title">Storefront</div>
              <div class="detail-card-value">
                <a href="shop.html?id=${encodeURIComponent(product.shop.id)}" class="shop-link-button">
                  <i class="fa-solid fa-store"></i> ${escapeHtml(product.shop.name || 'View storefront')}
                </a>
                ${product.shop.location ? `<div class="text-muted" style="margin-top:0.35rem;">${escapeHtml(product.shop.location)}</div>` : ''}
              </div>
            </div>
          ` : ''}

          <div class="detail-card">
            <div class="detail-card-title">Contact Seller</div>
            <div class="detail-card-value">
              ${sellerPhone ? `<div><i class="fa-solid fa-phone"></i> ${sellerPhone}</div>` : ''}
              ${sellerEmail ? `<div><i class="fa-solid fa-envelope"></i> ${sellerEmail}</div>` : '<div class="text-muted">Seller contact details will be added soon.</div>'}
              ${product.seller_id || product.sellerId ? `<a href="seller-profile.html?id=${encodeURIComponent(product.seller_id || product.sellerId)}" class="seller-profile-inline-link"><i class="fa-solid fa-user"></i> View seller profile</a>` : ''}
            </div>
          </div>

          <div class="detail-card">
            <div class="detail-card-title">Delivery</div>
            <div class="detail-card-value">
              ${product.free_delivery === true || product.freeDelivery === true ? `<div style="color:#166534; font-weight:700;">Free delivery available</div>` : ''}
              ${product.delivery_cost || product.deliveryCost ? `<div style="color:#475569;">Delivery cost: ${formatPrice(product.delivery_cost || product.deliveryCost)}</div>` : (product.free_delivery || product.freeDelivery ? '' : '<div class="text-muted">Delivery details not specified</div>')}
            </div>
          </div>

          <div class="detail-card">
            <div class="detail-card-title">About this item</div>
            <div class="detail-card-value">${escapeHtml(product.description || '').replace(/\n/g, '<br>')}</div>
          </div>

          <div class="detail-card">
            <div class="detail-card-title">Quick actions</div>
            <div class="product-actions">
              <div class="contact-actions">
                <a href="chat.html?product=${encodeURIComponent(product.id)}" class="contact-action contact-action-chat">
                  <span class="contact-action-icon"><i class="fa-solid fa-comments"></i></span>
                  <span class="contact-action-copy"><strong>Chat online</strong><small>Talk about this item</small></span>
                </a>
                <a href="${sellerPhone ? `https://wa.me/${sellerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello, I am interested in your listing: ${product.name}`)}` : '#'}" target="_blank" rel="noopener" class="contact-action contact-action-whatsapp ${sellerPhone ? '' : 'is-disabled'}">
                  <span class="contact-action-icon"><i class="fa-brands fa-whatsapp"></i></span>
                  <span class="contact-action-copy"><strong>WhatsApp</strong><small>Message seller</small></span>
                </a>
                <a href="${sellerEmail ? `mailto:${sellerEmail}?subject=${encodeURIComponent(`Question about ${product.name}`)}` : '#'}" class="contact-action contact-action-email ${sellerEmail ? '' : 'is-disabled'}">
                  <span class="contact-action-icon"><i class="fa-solid fa-envelope"></i></span>
                  <span class="contact-action-copy"><strong>Email</strong><small>Ask a question</small></span>
                </a>
              </div>
              ${product.buy_online ? `<button class="add-cart-btn" onclick="event.preventDefault(); window.location.href='checkout.html?buy=${product.id}'">Buy Online</button>` : ''}
              <button id="add-to-cart-btn" class="btn btn-primary btn-block add-cart-btn" style="border-radius: 999px;">
                <i class="fa-solid fa-cart-plus"></i> Add to Cart
              </button>
              ${getCurrentUser && getCurrentUser() && (getCurrentUser().id === product.seller_id || getCurrentUser().id === product.sellerId) ? `<a href="sell.html?editId=${product.id}" class="btn btn-secondary btn-block" style="border-radius:999px;">Edit this listing</a>` : ''}
            </div>
          </div>

        </div>
      </div>
    </div>

    <div class="related-products-section">
      <div class="related-products-header">
        <div>
          <span class="related-products-kicker">Recommended</span>
          <h3>More items you may like</h3>
        </div>
        <a href="products.html" class="related-products-link">Browse all products</a>
      </div>
      <div id="related-products-grid" class="related-products-grid"></div>
    </div>

    <div class="gallery-modal" id="gallery-modal" aria-hidden="true">
      <div class="gallery-modal-backdrop" data-close="true"></div>
      <div class="gallery-modal-body">
        <button class="gallery-modal-close" type="button" id="gallery-modal-close" aria-label="Close zoom view"><i class="fa-solid fa-xmark"></i></button>
        ${images.length > 1 ? `<button class="gallery-modal-nav gallery-modal-prev" type="button" id="gallery-modal-prev" aria-label="Previous image"><i class="fa-solid fa-chevron-left"></i></button>` : ''}
        <img src="${escapeHtml(mainImage)}" id="gallery-modal-image" alt="${escapeHtml(product.name || 'Product image')}" class="gallery-modal-image">
        ${images.length > 1 ? `<button class="gallery-modal-nav gallery-modal-next" type="button" id="gallery-modal-next" aria-label="Next image"><i class="fa-solid fa-chevron-right"></i></button>` : ''}
        <div class="gallery-controls">
          <button type="button" id="gallery-zoom-out" aria-label="Zoom out"><i class="fa-solid fa-minus"></i></button>
          <button type="button" id="gallery-zoom-reset" aria-label="Reset zoom"><i class="fa-solid fa-rotate-left"></i></button>
          <button type="button" id="gallery-zoom-in" aria-label="Zoom in"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>
    </div>
  `;

  let activeImageIndex = 0;
  let zoomLevel = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panOriginX = 0;
  let panOriginY = 0;
  const mainImageEl = document.getElementById('main-product-image');
  const modal = document.getElementById('gallery-modal');
  const modalImage = document.getElementById('gallery-modal-image');

  const attachPlaceholderOnError = (img) => {
    if (!img) return;
    img.onerror = () => {
      img.onerror = null;
      img.src = placeholderImage;
    };
  };

  [mainImageEl, modalImage].forEach(attachPlaceholderOnError);
  wrapper.querySelectorAll('.gallery-thumb img').forEach(attachPlaceholderOnError);

  const updateGalleryAspectRatio = () => {
    if (!mainImageEl?.naturalWidth || !mainImageEl.naturalHeight) return;
    const galleryMain = document.querySelector('.gallery-main');
    if (!galleryMain) return;
    const naturalRatio = mainImageEl.naturalWidth / mainImageEl.naturalHeight;
    const boundedRatio = Math.max(0.65, Math.min(1.65, naturalRatio));
    galleryMain.style.aspectRatio = `${boundedRatio} / 1`;
  };

  mainImageEl?.addEventListener('load', updateGalleryAspectRatio);
  if (mainImageEl?.complete) updateGalleryAspectRatio();

  const relatedProducts = pickRelatedProducts(await fetchProducts(true), product, 4);
  const relatedProductsGrid = document.getElementById('related-products-grid');

  if (relatedProductsGrid) {
    relatedProductsGrid.innerHTML = relatedProducts.length
      ? relatedProducts.map((relatedProduct) => buildRelatedProductCard(relatedProduct)).join('')
      : '<div class="text-muted">No related products available right now.</div>';
  }

  const aiQuestionInput = document.getElementById('ai-question-input');
  const aiQuestionBtn = document.getElementById('ai-question-btn');
  const aiResponseEl = document.getElementById('ai-response');

  // AI assistant functionality removed/disabled for now.

  // If user arrived with ?buy=1, highlight and scroll to the Buy Online CTA
  try {
    const buyFlag = urlParams.get('buy');
    if (buyFlag) {
      const buyBtn = document.querySelector('.add-cart-btn');
      if (buyBtn) {
        setTimeout(() => {
          buyBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          buyBtn.style.transition = 'box-shadow 0.35s ease, transform 0.2s ease';
          buyBtn.style.boxShadow = '0 10px 30px rgba(6, 95, 70, 0.18)';
          buyBtn.style.transform = 'translateY(-2px)';
          setTimeout(() => {
            buyBtn.style.boxShadow = '';
            buyBtn.style.transform = '';
          }, 2400);
        }, 650);
      }
    }
  } catch (e) {
    console.warn('Buy highlight error', e);
  }

  function updateActiveImage(index) {
    activeImageIndex = index;
    const safeIndex = (index + images.length) % images.length;
    if (mainImageEl) {
      mainImageEl.onload = updateGalleryAspectRatio;
      mainImageEl.src = images[safeIndex];
    }
    if (modalImage) modalImage.src = images[safeIndex];

    document.querySelectorAll('.gallery-thumb').forEach((thumb, thumbIndex) => {
      thumb.classList.toggle('active', thumbIndex === safeIndex);
    });
  }

  function openGalleryModal(index = activeImageIndex) {
    updateActiveImage(index);
    if (modal) {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'false');
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      updateZoom(1);
      if (modal.requestFullscreen && !document.fullscreenElement) {
        modal.requestFullscreen().catch(() => {});
      }
    }
  }

  function closeGalleryModal() {
    if (modal) {
      if (document.fullscreenElement === modal) {
        document.exitFullscreen?.().catch(() => {});
      }
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      modal.style.display = 'none';
      document.body.style.overflow = '';
      updateZoom(1);
      const descriptionPanel = document.getElementById('product-description-panel');
      if (descriptionPanel) {
        descriptionPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  function updateImageTransform() {
    if (!modalImage) return;
    modalImage.style.setProperty('--zoom-level', zoomLevel.toFixed(1));
    modalImage.style.setProperty('--pan-x', `${panX}px`);
    modalImage.style.setProperty('--pan-y', `${panY}px`);
    modalImage.classList.toggle('is-pannable', zoomLevel > 1);
    modalImage.style.cursor = zoomLevel > 1 ? 'grab' : 'zoom-in';
  }

  function resetPan() {
    panX = 0;
    panY = 0;
    updateImageTransform();
  }

  function updateZoom(level) {
    zoomLevel = Math.max(1, Math.min(3, level));
    if (zoomLevel === 1) {
      resetPan();
    } else {
      updateImageTransform();
    }
  }

  function startPan(event) {
    if (zoomLevel <= 1 || !modalImage) return;
    isPanning = true;
    panStartX = event.clientX;
    panStartY = event.clientY;
    panOriginX = panX;
    panOriginY = panY;
    modalImage.style.cursor = 'grabbing';
    event.preventDefault();
  }

  function movePan(event) {
    if (!isPanning || zoomLevel <= 1 || !modalImage) return;
    panX = panOriginX + (event.clientX - panStartX);
    panY = panOriginY + (event.clientY - panStartY);
    updateImageTransform();
  }

  function endPan() {
    if (!isPanning) return;
    isPanning = false;
    if (modalImage) {
      modalImage.style.cursor = zoomLevel > 1 ? 'grab' : 'zoom-in';
    }
  }

  document.querySelectorAll('.gallery-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      openGalleryModal(Number(thumb.dataset.index));
    });
  });

  document.getElementById('gallery-prev')?.addEventListener('click', () => {
    updateActiveImage(activeImageIndex - 1);
  });

  document.getElementById('gallery-next')?.addEventListener('click', () => {
    updateActiveImage(activeImageIndex + 1);
  });

  document.getElementById('gallery-zoom-btn')?.addEventListener('click', () => openGalleryModal(activeImageIndex));
  mainImageEl?.addEventListener('click', () => openGalleryModal(activeImageIndex));
  modalImage?.addEventListener('pointerdown', startPan);
  window.addEventListener('pointermove', movePan);
  window.addEventListener('pointerup', endPan);
  window.addEventListener('pointercancel', endPan);
  document.getElementById('gallery-modal-prev')?.addEventListener('click', () => updateActiveImage(activeImageIndex - 1));
  document.getElementById('gallery-modal-next')?.addEventListener('click', () => updateActiveImage(activeImageIndex + 1));
  document.getElementById('gallery-zoom-in')?.addEventListener('click', () => updateZoom(zoomLevel + 0.25));
  document.getElementById('gallery-zoom-out')?.addEventListener('click', () => updateZoom(zoomLevel - 0.25));
  document.getElementById('gallery-zoom-reset')?.addEventListener('click', () => updateZoom(1));
  document.getElementById('gallery-modal-close')?.addEventListener('click', (event) => {
    event.stopPropagation();
    closeGalleryModal();
  });
  modal?.addEventListener('click', (event) => {
    if (event.target === modal || event.target.dataset.close === 'true') {
      closeGalleryModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (modal && modal.hidden === false && event.key === 'Escape') {
      closeGalleryModal();
    }
  });

  const updateShareLinks = () => {
    const urls = buildShareUrls();
    const whatsappBtn = document.getElementById('whatsapp-share-btn');
    const facebookBtn = document.getElementById('facebook-share-btn');
    const twitterBtn = document.getElementById('twitter-share-btn');

    if (whatsappBtn) whatsappBtn.href = urls.whatsapp;
    if (facebookBtn) facebookBtn.href = urls.facebook;
    if (twitterBtn) twitterBtn.href = urls.twitter;
  };

  document.getElementById('whatsapp-share-btn')?.addEventListener('click', updateShareLinks);
  document.getElementById('facebook-share-btn')?.addEventListener('click', updateShareLinks);
  document.getElementById('twitter-share-btn')?.addEventListener('click', updateShareLinks);

  document.getElementById('copy-link-btn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(productPageUrl);
      alert('Product link copied to clipboard');
    } catch (err) {
      console.error('Unable to copy link:', err);
      prompt('Copy this link to share:', productPageUrl);
    }
  });

  const onImageUpdate = (index) => {
    updateActiveImage(index);
    updateShareLinks();
  };

  document.querySelectorAll('.gallery-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => onImageUpdate(Number(thumb.dataset.index)));
  });

  document.getElementById('gallery-prev')?.addEventListener('click', () => onImageUpdate(activeImageIndex - 1));
  document.getElementById('gallery-next')?.addEventListener('click', () => onImageUpdate(activeImageIndex + 1));

  updateShareLinks();

  document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
    addToCart(product);
  });
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildRelatedProductCard(product) {
  const imageList = Array.isArray(product.image) ? product.image : [product.image];
  const firstImage = imageList.find((img) => typeof img === 'string' && img.trim()) || '';
  const displayImage = firstImage || 'assets/logo.png';
  const price = typeof product.price !== 'undefined' ? formatPrice(Number(product.price)) : 'Price unavailable';
  const district = product.district || 'District not set';

  return `
    <a href="product.html?id=${encodeURIComponent(product.id)}" class="related-product-card">
      <img src="${escapeHtml(displayImage)}" alt="${escapeHtml(product.name || 'Related product')}" class="related-product-image" onerror="this.onerror=null;this.src='assets/logo.png';">
      <div class="related-product-body">
        <div class="related-product-category">${escapeHtml(product.category || 'Product')}</div>
        <h4 class="related-product-title">${escapeHtml(product.name || 'Product')}</h4>
        <div class="related-product-location"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(district)}</div>
        <div class="related-product-meta">
          <span class="related-product-price">${price}</span>
        </div>
      </div>
    </a>
  `;
}
